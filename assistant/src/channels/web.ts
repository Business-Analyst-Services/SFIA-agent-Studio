// HTTP server: the embeddable web widget, a JSON chat API, and approvals.
import express, { type Request, type Response, type NextFunction } from "express";
import { join } from "node:path";
import { ASSISTANT_ROOT } from "../catalog.js";
import { handle, catalog } from "../pip.js";
import { resolveApproval, listPending, type Notifier, type PendingAction } from "../approvals.js";

export const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/", express.static(join(ASSISTANT_ROOT, "public")));

interface WebEvent { type: "say" | "approval"; text: string; approvalId?: string; at: number }
const inbox = new Map<string, WebEvent[]>();
const push = (id: string, e: WebEvent): void => { inbox.set(id, [...(inbox.get(id) ?? []), e].slice(-50)); };

function auth(req: Request, res: Response, next: NextFunction) {
  const token = process.env.PIP_WEB_TOKEN;
  if (!token || req.get("authorization") === `Bearer ${token}`) return next();
  res.status(401).json({ error: "Missing or wrong token. Set the widget's data-token to PIP_WEB_TOKEN." });
}

function notifierFor(conversationId: string): Notifier {
  return {
    say: async text => push(conversationId, { type: "say", text, at: Date.now() }),
    askApproval: async (a: PendingAction) => push(conversationId, {
      type: "approval", approvalId: a.id, at: Date.now(),
      text: `The ${a.agentId} agent wants to run ${a.tool.name} (${a.tool.risk}).\nInput: ${JSON.stringify(a.input).slice(0, 400)}`,
    }),
  };
}

app.post("/api/chat", auth, async (req, res) => {
  const { conversationId, user, text } = req.body ?? {};
  if (!conversationId || !text) return void res.status(400).json({ error: "conversationId and text are required" });
  try {
    const reply = await handle({ conversationId, user: user || "web user", text, channel: "web" }, notifierFor(conversationId));
    const events = inbox.get(conversationId) ?? [];
    inbox.delete(conversationId);
    res.json({ reply, events });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// Updates that arrive after the reply (approved actions finishing, etc.). The widget polls this.
app.get("/api/events", auth, (req, res) => {
  const id = String(req.query.conversationId ?? "");
  const events = inbox.get(id) ?? [];
  inbox.delete(id);
  res.json({ events });
});

app.get("/api/approvals", auth, (_req, res) => {
  res.json(listPending().map(a => ({ id: a.id, agent: a.agentId, tool: a.tool.name, risk: a.tool.risk, input: a.input, requestedBy: a.requestedBy })));
});

app.post("/api/approvals/:id", auth, async (req, res) => {
  const result = await resolveApproval(String(req.params.id), Boolean(req.body?.approved), req.body?.approver || "web approver");
  res.json({ result });
});

app.get("/api/agents", (_req, res) => {
  res.json([...catalog.agents.values()].map(a => ({ id: a.id, role: a.role.role, family: a.role.family, skills: a.role.core.map(s => s.code) })));
});

app.get("/healthz", (_req, res) => void res.json({ ok: true, agents: catalog.agents.size }));
