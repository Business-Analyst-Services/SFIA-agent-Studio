// Domain packs make Muster industry-agnostic. MUSTER_DOMAIN picks one from data/domains.json;
// its systems of record (SoR) add tools for the agents allowed to use them, and cap what any
// agent may do on each SoR, whatever its SFIA level.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./catalog.js";
import type { Risk } from "./autonomy.js";

export interface SystemOfRecord {
  id: string; name: string; holds: string; examples: string[]; standard: string; mcp: string;
  read: string; write: string; never: string; maxRisk: Risk; agents: string[]; dataClass: string;
}
export interface DomainPack { id: string; name: string; regulations: string; value: string; systemsOfRecord: SystemOfRecord[] }

const file = join(REPO_ROOT, "data/domains.json");
const all: DomainPack[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).domains : [];
export const domain: DomainPack | null = all.find(d => d.id === process.env.MUSTER_DOMAIN) ?? null;
if (process.env.MUSTER_DOMAIN && !domain) console.warn(`MUSTER_DOMAIN "${process.env.MUSTER_DOMAIN}" not found. Options: ${all.map(d => d.id).join(", ")}`);

const RANK: Record<Risk, number> = { read: 0, write: 1, destructive: 2 };
export const sorById = (id: string) => domain?.systemsOfRecord.find(s => s.id === id);

/** Extra MCP server ids (SoR ids) an agent may use in this domain. */
export const sorIdsFor = (agentId: string) => domain?.systemsOfRecord.filter(s => s.agents.includes(agentId)).map(s => s.id) ?? [];

/** The SoR's own limit: "never" above its cap; writes and above on a SoR always need a person. */
export function sorDecision(serverId: string, risk: Risk): "never" | "approve" | null {
  const s = sorById(serverId);
  if (!s) return null;
  if (RANK[risk] > RANK[s.maxRisk]) return "never";
  return risk === "read" ? null : "approve";
}

export function domainBrief(agentId?: string): string {
  if (!domain) return "";
  const sors = agentId ? domain.systemsOfRecord.filter(s => s.agents.includes(agentId)) : domain.systemsOfRecord;
  return `\n\n## Industry: ${domain.name}
Regulation to respect: ${domain.regulations}.
Systems of record${agentId ? " you may use" : ""}:
${sors.map(s => `- ${s.name} (${s.examples.join(", ")}; ${s.standard}). Holds: ${s.holds}. Data: ${s.dataClass}. You may: ${s.read}. With approval: ${s.write}. Never: ${s.never}.`).join("\n") || "- none for this role"}
A system of record is the authoritative source. Prefer reading from it over copies, never work around its limits, and say which system each fact came from.`;
}
