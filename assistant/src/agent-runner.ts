// Runs one SFIA role agent on a task: its own system prompt, its role's MCP tools, and SFIA-level approval gates.
import Anthropic from "@anthropic-ai/sdk";
import type { AgentDef } from "./catalog.js";
import { toolsFor, callTool, type McpTool } from "./mcp.js";
import { decide, levelFor, MAX_TOOL_CALLS } from "./autonomy.js";
import { requestApproval, type Notifier } from "./approvals.js";
import { audit } from "./audit.js";
import { domainBrief, sorIdsFor } from "./domain.js";

const anthropic = new Anthropic();
const MODEL = process.env.MUSTER_AGENT_MODEL ?? "claude-sonnet-5-5";

export interface AgentResult { agentId: string; output: string; toolCalls: number; pendingApprovals: string[]; unavailableTools: string[] }

export async function runAgent(agent: AgentDef, task: string, context: string, notifier: Notifier, requestedBy: string): Promise<AgentResult> {
  const level = levelFor(agent.id);
  const { tools, unavailable } = await toolsFor([...new Set([...agent.mcpIds, ...sorIdsFor(agent.id)])]);
  const byName = new Map<string, McpTool>(tools.map(t => [t.exposedName, t]));
  const pendingIds: string[] = [];

  const system = `${agent.prompt}${domainBrief(agent.id)}

## Execution context
- You were called by Muster, the IT assistant, on behalf of ${requestedBy}. Your output goes back to Muster, who will relay it.
- Your SFIA level for this task is ${level}. Tools are gated to match: some actions run straight away, some need a person's approval, some are not allowed.
- If a tool result says PENDING_APPROVAL, a person has been asked. Do not retry it. Carry on with the rest of the work and list the pending action in your report.
- Tools from these catalogue servers are not connected: ${unavailable.join(", ") || "none"}. If you need them, say what you would have done and what a person should do instead.
- Finish with a short report: what you did, what you found or produced, decisions needed, and next steps. Keep it under 300 words unless the task is a document.`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: `${context ? `Context:\n${context}\n\n` : ""}Task:\n${task}` }];
  const apiTools: Anthropic.Tool[] = tools.map(t => ({
    name: t.exposedName,
    description: `[${t.risk}] ${t.description}`.slice(0, 1024),
    input_schema: (t.inputSchema?.type ? t.inputSchema : { type: "object", properties: {} }) as Anthropic.Tool.InputSchema,
  }));

  let calls = 0;
  audit("agent.start", { agent: agent.id, level, task: task.slice(0, 500), tools: tools.length });
  for (let turn = 0; turn < 12; turn++) {
    const res = await anthropic.messages.create({ model: MODEL, max_tokens: 4096, system, messages, ...(apiTools.length ? { tools: apiTools } : {}) });
    messages.push({ role: "assistant", content: res.content });
    const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || uses.length === 0) {
      const output = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("\n");
      audit("agent.done", { agent: agent.id, toolCalls: calls, pending: pendingIds });
      return { agentId: agent.id, output, toolCalls: calls, pendingApprovals: pendingIds, unavailableTools: unavailable };
    }
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const u of uses) {
      const tool = byName.get(u.name);
      const input = (u.input ?? {}) as Record<string, unknown>;
      let content: string;
      if (!tool) content = `ERROR: unknown tool ${u.name}`;
      else if (++calls > MAX_TOOL_CALLS) content = "ERROR: tool-call budget for this task is used up. Report what you have.";
      else {
        const d = decide(agent.id, tool.risk, tool.serverId);
        if (d === "never") content = `NOT ALLOWED: ${tool.risk} actions are outside SFIA level ${level}. Recommend it to a person instead.`;
        else if (d === "approve") {
          const p = requestApproval({ agentId: agent.id, tool, input, reason: task.slice(0, 200), notifier, requestedBy });
          pendingIds.push(p.id);
          content = `PENDING_APPROVAL id=${p.id}. A person has been asked to approve this ${tool.risk} action.`;
        } else {
          try { content = await callTool(tool, input); audit("tool.executed", { agent: agent.id, tool: tool.exposedName, risk: tool.risk, auto: true }); }
          catch (e) { content = `ERROR: ${e instanceof Error ? e.message : String(e)}`; }
        }
      }
      results.push({ type: "tool_result", tool_use_id: u.id, content });
    }
    messages.push({ role: "user", content: results });
  }
  return { agentId: agent.id, output: "I ran out of turns before finishing. Here is where I got to: see the audit log.", toolCalls: calls, pendingApprovals: pendingIds, unavailableTools: unavailable };
}
