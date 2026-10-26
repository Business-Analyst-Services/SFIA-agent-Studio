// Muster: the front-door assistant. Holds the conversation, picks SFIA agents and delegates to them.
import Anthropic from "@anthropic-ai/sdk";
import { loadCatalog, roster } from "./catalog.js";
import { PERSONA } from "./persona.js";
import { runAgent } from "./agent-runner.js";
import { resolveApproval, listPending, type Notifier } from "./approvals.js";
import { audit } from "./audit.js";

const anthropic = new Anthropic();
const MODEL = process.env.MUSTER_MODEL ?? "claude-opus-5-5";
export const catalog = loadCatalog();
const SYSTEM = `${PERSONA}\n\n## Agent roster (id | family | key SFIA skill codes | capability led, by SFIA category)\n${roster(catalog.agents)}`;

const DELEGATE: Anthropic.Tool = {
  name: "delegate",
  description: "Hand a task to one SFIA role agent. It works with its own tools and returns a report. Call several times in one turn to run agents in parallel.",
  input_schema: {
    type: "object",
    properties: {
      agent_id: { type: "string", enum: [...catalog.agents.keys()], description: "Agent id from the roster." },
      task: { type: "string", description: "Clear, self-contained instruction: the outcome wanted, constraints, and the format of the report." },
      context: { type: "string", description: "Relevant facts from the conversation or from other agents' reports." },
    },
    required: ["agent_id", "task"],
  },
};

const history = new Map<string, Anthropic.MessageParam[]>();
const MAX_HISTORY = 30;

export interface IncomingMessage {
  conversationId: string;   // stable per thread/chat/email thread
  user: string;             // display name or email of the person
  text: string;
  channel: "slack" | "teams" | "gmail" | "web";
}

/** Handle one message and return Muster's reply. Progress and approvals go through the notifier. */
export async function handle(msg: IncomingMessage, notifier: Notifier): Promise<string> {
  // Approvals typed as text work in every channel: "approve 1a2b3c4d" or "reject 1a2b3c4d".
  const m = msg.text.trim().match(/^(approve|reject)\s+([a-f0-9]{8})\b/i);
  if (m) return resolveApproval(m[2], m[1].toLowerCase() === "approve", msg.user);
  if (/^(pending|what'?s pending\??)$/i.test(msg.text.trim())) {
    const p = listPending();
    return p.length ? p.map(a => `• ${a.id}: ${a.agentId} wants to run *${a.tool.name}* (${a.tool.risk})`).join("\n") : "Nothing waiting for approval right now.";
  }

  const msgs = history.get(msg.conversationId) ?? [];
  msgs.push({ role: "user", content: `[${msg.channel}] ${msg.user}: ${msg.text}` });
  audit("muster.message", { conversation: msg.conversationId, user: msg.user, channel: msg.channel });

  let reply = "";
  for (let turn = 0; turn < 8; turn++) {
    const res = await anthropic.messages.create({ model: MODEL, max_tokens: 2048, system: SYSTEM, messages: msgs, tools: [DELEGATE] });
    msgs.push({ role: "assistant", content: res.content });
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("\n").trim();
    const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || !uses.length) { reply = text; break; }
    if (text) await notifier.say(text); // e.g. "Righto, let me muster the crew. Calling in…"
    const results = await Promise.all(uses.map(async (u): Promise<Anthropic.ToolResultBlockParam> => {
      const { agent_id, task, context } = u.input as { agent_id: string; task: string; context?: string };
      const agent = catalog.agents.get(agent_id);
      if (!agent) return { type: "tool_result", tool_use_id: u.id, content: `Unknown agent ${agent_id}`, is_error: true };
      try {
        const r = await runAgent(agent, task, context ?? "", notifier, msg.user);
        return { type: "tool_result", tool_use_id: u.id, content: JSON.stringify(r) };
      } catch (e) {
        return { type: "tool_result", tool_use_id: u.id, content: `Agent failed: ${e instanceof Error ? e.message : String(e)}`, is_error: true };
      }
    }));
    msgs.push({ role: "user", content: results });
  }
  history.set(msg.conversationId, trim(msgs));
  return reply || "Hmm, I got a bit tangled there. Could you say that another way?";
}

// Keep recent turns, cutting only at a plain user message so tool_use/tool_result pairs stay together.
function trim(msgs: Anthropic.MessageParam[]) {
  if (msgs.length <= MAX_HISTORY) return msgs;
  let i = msgs.length - MAX_HISTORY;
  while (i < msgs.length && !(msgs[i].role === "user" && typeof msgs[i].content === "string")) i++;
  return msgs.slice(i);
}
