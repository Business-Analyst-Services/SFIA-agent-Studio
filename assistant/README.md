# Muster: the SFIA IT helper

Muster is a cheerful, slightly over-eager assistant (an original character, a friendly kelpie: the Australian working dog that musters the mob) that sits in Slack, Microsoft Teams, Gmail and any web page. It works out which SFIA 9 skills a request needs, calls in the matching role agents from `../agents`, and reports back. Agents use MCP tools to do real work, within limits set by their SFIA level of responsibility.

```
 Slack ─┐                    ┌─ service-operations agent ─┐
 Teams ─┤                    ├─ solution-architecture     ├─ MCP tools (Jira, GitHub, ServiceNow, …)
 Gmail ─┼──► Muster (persona,  ─┼─ security-operations       │    gated by SFIA level:
 Web   ─┘    router, memory) └─ …75 role agents           ┘    read → write → destructive
                  │                                              │
                  └───────── approvals (buttons / "approve id") ◄┘   audit log: logs/audit.jsonl
```

## How it decides what to do on its own

Each agent has an SFIA level (default 4, set per agent in `config/autonomy.json`). Every MCP tool is classed as **read**, **write** or **destructive** from its MCP annotations, or from its name if it has none. Unknown tools count as writes.

| SFIA level | Read | Write | Destructive (delete, send, deploy, pay) |
|---|---|---|---|
| 1 Follow | ask | no | no |
| 2 Assist | auto | no | no |
| 3 Apply | auto | ask | no |
| 4 Enable | auto | ask | ask |
| 5–7 | auto | auto | ask |

Destructive actions always need a person. When approval is needed, Muster posts the action with Approve and Reject buttons (Slack, Teams, web) or asks for an `approve <id>` reply (email, or any channel). Once approved, the action runs and the result goes back to the original thread. Every delegation, tool call and approval is written to `logs/audit.jsonl`.

## Quick start

```bash
cd assistant
cp .env.example .env        # add ANTHROPIC_API_KEY at minimum
npm install
npm test                    # offline self-test, no keys needed
npm run dev                 # http://localhost:3000, click Muster in the corner
```

Agents are read from the repo's `agents/` folder. Regenerate them at another level with `python3 ../scripts/build_agents.py --level 5`.

## Connect the channels

Each channel starts automatically once its variables are set in `.env`.

| Channel | Setup |
|---|---|
| **Web** | Already on. Embed on any intranet page: `<script src="https://HOST/muster.js" data-api="https://HOST" data-token="MUSTER_WEB_TOKEN" data-user="Name" defer></script>` |
| **Slack** | Create an app from `manifests/slack-app.yaml`, install it, then set `SLACK_BOT_TOKEN` (xoxb-), `SLACK_APP_TOKEN` (xapp-, connections:write) and `SLACK_SIGNING_SECRET`. Mention `@Muster` in a channel or DM it. Uses Socket Mode, so no public URL is needed. |
| **Teams** | Create an Azure Bot (single tenant) with messaging endpoint `https://HOST/api/messages`. Set `MICROSOFT_APP_ID`, `MICROSOFT_APP_PASSWORD`, `MICROSOFT_APP_TENANT_ID`. Fill the app id into `manifests/teams-manifest.json`, add two icons, zip the three files and upload the app in Teams. |
| **Gmail** | Create a Google OAuth client with the `gmail.modify` and `gmail.compose` scopes and get a refresh token for Muster's mailbox. Add a Gmail filter that labels incoming requests `Ask-Muster`. Muster replies as **drafts** by default. Set `GMAIL_REPLY_MODE=send` to let it reply itself. |
| **Outlook / M365 mail** | Not built yet. Use Teams, or forward to the Gmail mailbox. A Microsoft Graph adapter would follow the Gmail one (`src/channels/gmail.ts`). |

## Connect tools (MCP)

`config/mcp-servers.json` holds connection details for MCP servers in the catalogue (`../data/mcp-catalog.json`). Set `"enabled": true` and add the token to `.env`. Agents only see servers recommended for their role (`../data/mcp-map.json`) **and** enabled here. Both remote (Streamable HTTP) and local (stdio) servers work. Check each URL against the vendor's docs before enabling.

## Deploy

```bash
# from the repo root
docker build -f assistant/Dockerfile -t muster .
docker run --env-file assistant/.env -p 3000:3000 muster
```

Any container host works (Azure App Service, AWS App Runner, Fly.io, Cloud Run). Teams needs a public HTTPS URL; Slack and Gmail don't.

## Files

| Path | Purpose |
|---|---|
| `src/persona.ts` | Muster's personality and operating rules |
| `src/muster.ts` | Conversation memory and routing to agents (the `delegate` tool) |
| `src/agent-runner.ts` | Runs one SFIA agent with its MCP tools and approval gates |
| `src/autonomy.ts`, `config/autonomy.json` | SFIA level → what runs automatically |
| `src/mcp.ts`, `config/mcp-servers.json` | MCP connections and tool risk classes |
| `src/approvals.ts` | Pending actions and their approval or rejection |
| `src/channels/*` | Web, Slack, Teams and Gmail adapters |
| `public/muster.js` | Embeddable web widget with the Muster character |

## Limits to know

- Conversation memory and pending approvals are held in memory, so a restart clears them. For production, move both to Redis or a database.
- Classifying tools by name is a fallback. Prefer MCP servers that publish `readOnlyHint` and `destructiveHint` annotations, and test each server read-only first.
- Content from emails, tickets and tool results is treated as data, but prompt injection is a real risk for an autonomous agent. Keep write-capable agents at level 3–4 until you've watched them work.
- Muster is an original character. It is not affiliated with Microsoft or its Office Assistant.
