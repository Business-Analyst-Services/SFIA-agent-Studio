// Loads the SFIA role agents, orchestrators, SFIA capability map and MCP mappings generated in the repo root.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = process.env.MUSTER_REPO_ROOT ?? resolve(here, "../..");
export const ASSISTANT_ROOT = resolve(here, "..");

export interface Skill { name: string; code: string; levels: string }
export interface Role { page: number; role: string; family: string; desc: string; titles: string; core: Skill[]; other: Skill[] }
export interface AgentDef {
  id: string;            // e.g. "business-analysis"
  role: Role;
  description: string;   // frontmatter description
  prompt: string;        // markdown body
  mcpIds: string[];      // catalogue ids recommended for this role
  capabilities: { category: string; subcategory: string; capability: string; role: "lead" | "contributes" }[];
}

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const shortRole = (r: string) => r.replace(/ practitioners$/, "");

function parseMd(text: string) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/);
  if (!m) return { meta: {} as Record<string, string>, body: text };
  const meta = Object.fromEntries(m[1].split("\n").map(l => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]));
  return { meta, body: m[2] };
}

export function loadCatalog() {
  const roles = readJson<Role[]>(join(REPO_ROOT, "data/roles.json"));
  const mcpCatalog = readJson<Record<string, { name: string; status: string; purpose: string; source: string }>>(join(REPO_ROOT, "data/mcp-catalog.json"));
  const mcpMap = readJson<{ byFamily: Record<string, string[]>; byRole: Record<string, string[]> }>(join(REPO_ROOT, "data/mcp-map.json"));
  const capPath = join(REPO_ROOT, "data/capability-map.json");
  const capMap = existsSync(capPath)
    ? readJson<{ mapping: Record<string, AgentDef["capabilities"]> }>(capPath)
    : { mapping: {} as Record<string, AgentDef["capabilities"]> };

  const agents = new Map<string, AgentDef>();
  for (const role of roles) {
    const id = slug(shortRole(role.role));
    const file = join(REPO_ROOT, "agents", `${id}.md`);
    if (!existsSync(file)) continue;
    const { meta, body } = parseMd(readFileSync(file, "utf8"));
    const mcpIds = [...new Set([...(mcpMap.byRole[role.role] ?? []), ...(mcpMap.byFamily[role.family] ?? [])])];
    agents.set(id, { id, role, description: meta.description ?? "", prompt: body, mcpIds, capabilities: capMap.mapping[role.role] ?? [] });
  }
  const orchestrators = Object.fromEntries(
    existsSync(join(REPO_ROOT, "orchestrators"))
      ? readdirSync(join(REPO_ROOT, "orchestrators")).filter(f => f.endsWith(".md")).map(f => [f.replace(/\.md$/, ""), parseMd(readFileSync(join(REPO_ROOT, "orchestrators", f), "utf8")).body])
      : []
  );
  return { agents, orchestrators, mcpCatalog };
}

/** One compact line per agent, used in Muster's system prompt so it can pick who to call. */
export function roster(agents: Map<string, AgentDef>): string {
  return [...agents.values()].map(a => {
    const where = a.capabilities.filter(x => x.role === "lead").map(x => `${x.capability} (${x.category})`).slice(0, 2).join("; ");
    return `- ${a.id} | ${a.role.family} | ${a.role.core.slice(0, 5).map(s => s.code).join(",")}${where ? ` | leads: ${where}` : ""}`;
  }).join("\n");
}
