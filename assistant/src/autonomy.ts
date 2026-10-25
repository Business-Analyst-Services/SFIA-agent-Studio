// Maps an agent's SFIA level of responsibility to what it may do without asking.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ASSISTANT_ROOT } from "./catalog.js";

export type Risk = "read" | "write" | "destructive";
export type Decision = "auto" | "approve" | "never";

interface AutonomyConfig {
  levels: Record<string, Record<Risk, Decision>>;
  agentLevels: Record<string, number>;
  maxToolCallsPerTask: number;
}

const cfg: AutonomyConfig = JSON.parse(readFileSync(join(ASSISTANT_ROOT, "config/autonomy.json"), "utf8"));
export const MAX_TOOL_CALLS = cfg.maxToolCallsPerTask ?? 25;

export function levelFor(agentId: string): number {
  return cfg.agentLevels[agentId] ?? Number(process.env.PIP_DEFAULT_LEVEL ?? 4);
}

export function decide(agentId: string, risk: Risk): Decision {
  const policy = cfg.levels[String(levelFor(agentId))] ?? cfg.levels["4"];
  const d = policy[risk];
  // Destructive actions always need a person, whatever the config says.
  return risk === "destructive" && d === "auto" ? "approve" : d;
}

/** Classify an MCP tool by its annotations, falling back to its name. Unknown tools count as writes. */
export function classify(name: string, annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean }): Risk {
  if (annotations?.readOnlyHint === true) return "read";
  if (annotations?.destructiveHint === true) return "destructive";
  const n = name.toLowerCase();
  if (/(delete|remove|drop|destroy|purge|send|deploy|merge|publish|release|transfer|pay|refund|revoke|terminate|rollback|promote)/.test(n)) return "destructive";
  if (/(^|_|-)(get|list|search|read|fetch|query|find|describe|view|show|lookup|count|aggregate|preview)/.test(n)) return "read";
  return "write";
}
