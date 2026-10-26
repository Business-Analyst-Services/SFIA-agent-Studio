// Generic webhook: lets Jira Service Management, ServiceNow, Zendesk or any tool that can send an
// HTTP request hand Muster a request. The reply comes back in the response; later updates
// (approval requests, approved actions finishing) are POSTed to the caller's callbackUrl.
import type { Express, Request, Response } from "express";
import { handle } from "../muster.js";
import type { Notifier, PendingAction } from "../approvals.js";

interface WebhookBody {
  source?: string;          // e.g. "jira", "servicenow"; used in the conversation id
  conversationId?: string;  // ticket key or sys_id, so follow-ups share memory
  user?: string;            // requester name or email
  text?: string;            // the request (ticket summary + description)
  callbackUrl?: string;     // where to POST later updates (optional)
  callbackToken?: string;   // sent back as a Bearer token on callbacks (optional)
}

function notifierFor(b: WebhookBody, conversationId: string): Notifier {
  const post = async (payload: Record<string, unknown>) => {
    if (!b.callbackUrl) return;
    try {
      await fetch(b.callbackUrl, {
        method: "POST",
        headers: { "content-type": "application/json", ...(b.callbackToken ? { authorization: `Bearer ${b.callbackToken}` } : {}) },
        body: JSON.stringify({ conversationId, ...payload }),
      });
    } catch (e) { console.error("Webhook callback failed:", e instanceof Error ? e.message : e); }
  };
  return {
    say: text => post({ type: "message", text }),
    askApproval: (a: PendingAction) => post({
      type: "approval", approvalId: a.id, agent: a.agentId, tool: a.tool.name, risk: a.tool.risk, input: a.input,
      text: `The ${a.agentId} agent wants to run ${a.tool.name} (${a.tool.risk}). Approve with POST /api/approvals/${a.id} {"approved": true}, or comment "approve ${a.id}".`,
    }),
  };
}

export function mountWebhook(app: Express) {
  app.post("/api/webhook", async (req: Request, res: Response) => {
    const token = process.env.MUSTER_WEBHOOK_TOKEN;
    if (!token) return void res.status(503).json({ error: "Webhook is off. Set MUSTER_WEBHOOK_TOKEN to turn it on." });
    if (req.get("authorization") !== `Bearer ${token}`) return void res.status(401).json({ error: "Wrong or missing token." });
    const b = (req.body ?? {}) as WebhookBody;
    if (!b.text) return void res.status(400).json({ error: "text is required" });
    const conversationId = `${b.source ?? "webhook"}:${b.conversationId ?? Date.now()}`;
    try {
      const reply = await handle({ conversationId, user: b.user ?? "webhook", text: b.text, channel: "web" }, notifierFor(b, conversationId));
      res.json({ conversationId, reply });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });
}
