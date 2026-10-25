// Append-only audit trail of every delegation, tool call and approval.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ASSISTANT_ROOT } from "./catalog.js";

const dir = join(ASSISTANT_ROOT, "logs");
mkdirSync(dir, { recursive: true });

export function audit(event: string, data: Record<string, unknown>) {
  const line = JSON.stringify({ at: new Date().toISOString(), event, ...data });
  appendFileSync(join(dir, "audit.jsonl"), line + "\n");
}
