// Connects to MCP servers on demand and exposes their tools to role agents.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ASSISTANT_ROOT } from "./catalog.js";
import { classify, type Risk } from "./autonomy.js";

interface ServerCfg {
  enabled: boolean;
  transport: "http" | "stdio";
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
}
export interface McpTool {
  serverId: string;
  name: string;          // the tool's name on its server
  exposedName: string;   // unique name shown to the model
  description: string;
  inputSchema: Record<string, unknown>;
  risk: Risk;
}

const env = (s: string) => s.replace(/\$\{(\w+)\}/g, (_, k) => process.env[k] ?? "");
const servers: Record<string, ServerCfg> = JSON.parse(readFileSync(join(ASSISTANT_ROOT, "config/mcp-servers.json"), "utf8")).servers;
const clients = new Map<string, Promise<Client>>();
const toolCache = new Map<string, McpTool[]>();

export const enabledServers = () => Object.entries(servers).filter(([, s]) => s.enabled).map(([id]) => id);

async function connect(id: string): Promise<Client> {
  const s = servers[id];
  const client = new Client({ name: "muster-sfia-assistant", version: "0.1.0" });
  const transport = s.transport === "http"
    ? new StreamableHTTPClientTransport(new URL(env(s.url!)), {
        requestInit: { headers: Object.fromEntries(Object.entries(s.headers ?? {}).map(([k, v]) => [k, env(v)])) },
      })
    : new StdioClientTransport({ command: s.command!, args: s.args ?? [], env: process.env as Record<string, string> });
  await client.connect(transport);
  return client;
}

function client(id: string) {
  if (!clients.has(id)) {
    const p = connect(id);
    p.catch(() => clients.delete(id));
    clients.set(id, p);
  }
  return clients.get(id)!;
}

const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");

/** Tools for the given catalogue ids, skipping servers that are not enabled or fail to connect. */
export async function toolsFor(ids: string[]): Promise<{ tools: McpTool[]; unavailable: string[] }> {
  const tools: McpTool[] = [];
  const unavailable: string[] = [];
  for (const id of ids) {
    if (!servers[id]?.enabled) { unavailable.push(id); continue; }
    try {
      if (!toolCache.has(id)) {
        const c = await client(id);
        const { tools: listed } = await c.listTools();
        toolCache.set(id, listed.map(t => ({
          serverId: id,
          name: t.name,
          exposedName: `${safe(id)}__${safe(t.name)}`.slice(0, 64),
          description: t.description ?? "",
          inputSchema: t.inputSchema as Record<string, unknown>,
          risk: classify(t.name, t.annotations as { readOnlyHint?: boolean; destructiveHint?: boolean } | undefined),
        })));
      }
      tools.push(...toolCache.get(id)!);
    } catch {
      unavailable.push(id);
    }
  }
  return { tools, unavailable };
}

export async function callTool(t: McpTool, input: Record<string, unknown>): Promise<string> {
  const c = await client(t.serverId);
  const res = await c.callTool({ name: t.name, arguments: input });
  const content = (res.content ?? []) as { type: string; text?: string }[];
  const text = content.map(b => (b.type === "text" ? b.text : `[${b.type} content]`)).join("\n");
  return (res.isError ? "ERROR: " : "") + text.slice(0, 20000);
}
