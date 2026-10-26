// Starts Muster on every channel that has credentials configured.
import { app } from "./channels/web.js";
import { catalog } from "./muster.js";
import { enabledServers } from "./mcp.js";
import { domain } from "./domain.js";

const port = Number(process.env.PORT ?? 3000);
const has = (...keys: string[]) => keys.every(k => process.env[k]);

if (!process.env.ANTHROPIC_API_KEY) { console.error("Set ANTHROPIC_API_KEY (see .env.example)."); process.exit(1); }

(await import("./channels/webhook.js")).mountWebhook(app);
if (has("MICROSOFT_APP_ID", "MICROSOFT_APP_PASSWORD")) (await import("./channels/teams.js")).mountTeams(app);
app.listen(port, () => console.log(`Muster web widget and API on http://localhost:${port} · ${catalog.agents.size} agents · MCP: ${enabledServers().join(", ") || "none enabled"} · domain: ${domain?.name ?? "general"}`));
if (has("SLACK_BOT_TOKEN", "SLACK_APP_TOKEN")) await (await import("./channels/slack.js")).startSlack();
if (has("GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN")) await (await import("./channels/gmail.js")).startGmail();
