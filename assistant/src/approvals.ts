// Actions an agent wanted to take that need a person's OK first.
import { randomUUID } from "node:crypto";
import { callTool, type McpTool } from "./mcp.js";
import { audit } from "./audit.js";

/** Where to send updates for a conversation: a Slack thread, a Teams chat, an email thread or a web session. */
export interface Notifier {
  /** Plain message back to the conversation. */
  say(text: string): Promise<void>;
  /** Ask a person to approve or reject an action. Channels render buttons where they can. */
  askApproval(a: PendingAction): Promise<void>;
}

export interface PendingAction {
  id: string;
  agentId: string;
  tool: McpTool;
  input: Record<string, unknown>;
  reason: string;
  createdAt: number;
  notifier: Notifier;
  requestedBy: string;
}

const pending = new Map<string, PendingAction>();
const TTL = 24 * 60 * 60 * 1000;

export function requestApproval(p: Omit<PendingAction, "id" | "createdAt">): PendingAction {
  const a = { ...p, id: randomUUID().slice(0, 8), createdAt: Date.now() };
  pending.set(a.id, a);
  audit("approval.requested", { id: a.id, agent: a.agentId, tool: a.tool.exposedName, risk: a.tool.risk, input: a.input, by: a.requestedBy });
  void a.notifier.askApproval(a);
  return a;
}

export const getPending = (id: string) => pending.get(id);
export const listPending = () => [...pending.values()];

/** Approve or reject. On approval the action runs now and the result goes back to the original conversation. */
export async function resolveApproval(id: string, approved: boolean, approver: string): Promise<string> {
  const a = pending.get(id);
  if (!a) return `No pending action with id ${id}. It may already have been handled.`;
  pending.delete(id);
  if (Date.now() - a.createdAt > TTL) return `Action ${id} expired. Ask again if it's still needed.`;
  audit(approved ? "approval.granted" : "approval.rejected", { id, approver, agent: a.agentId, tool: a.tool.exposedName });
  if (!approved) {
    await a.notifier.say(`Okay, I won't run *${a.tool.name}* (${a.agentId}). Rejected by ${approver}.`);
    return "Rejected.";
  }
  try {
    const result = await callTool(a.tool, a.input);
    audit("tool.executed", { id, agent: a.agentId, tool: a.tool.exposedName, approved_by: approver });
    await a.notifier.say(`Done! ${approver} approved *${a.tool.name}* for the ${a.agentId} agent.\n\n${result.slice(0, 1500)}`);
    return "Approved and executed.";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await a.notifier.say(`I tried *${a.tool.name}* after approval, but it failed: ${msg}`);
    return `Failed: ${msg}`;
  }
}
