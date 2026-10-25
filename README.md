# SFIA Role Agent Studio

Turns the SFIA Foundation's **SFIA 9 illustrative skills profiles** (March 2026) into AI agents: one agent per role, one orchestrator per role family, and MCP server recommendations for the tools each role uses.

**Live interface:** https://business-analyst-services.github.io/sfia-agent-studio/

## What's in the repo

| Path | What it is |
|---|---|
| `site/index.html` | The web interface. Browse 75 roles, choose 5–7 skills, set a target SFIA level (1–7), and copy the agent prompt, agent JSON or orchestrator prompt. |
| `data/roles.json` | 75 role profiles extracted from the PDF: family, description, example job titles, "look at these first" skills and "other skills to consider", each with code and level range. |
| `data/mcp-catalog.json` | MCP servers with status (Official, Reference, Community, Build), purpose and source. |
| `data/mcp-map.json` | Which servers are recommended for each role family, plus role-specific additions. |
| `agents/*.md` | Generated role agents (75). Claude Code subagent format: copy into `.claude/agents/`. |
| `orchestrators/*.md` | Generated family orchestrators (22) that route requests by SFIA skill code. |
| `scripts/extract_profiles.py` | Rebuilds `data/roles.json` from the SFIA PDF. |
| `scripts/build_agents.py` | Regenerates `agents/` and `orchestrators/` from the data. |

## Pip: the assistant

`assistant/` is a working service: **Pip**, a cheerful IT helper that lives in Slack, Teams, Gmail and the web, routes each request to the right SFIA role agent, and lets agents act through MCP tools within limits set by their SFIA level. See [assistant/README.md](assistant/README.md).

The **ITU capability role map** (`site/itu.html`, data in `data/itu-map.json`) places the 75 roles on the ITU capability model and shows the gaps and value-stream handoffs.

## Run locally

```bash
mkdir -p _site && cp site/*.html _site/ && cp -r data agents orchestrators _site/
python3 -m http.server --directory _site 8000
# open http://localhost:8000
```

## Regenerate

```bash
# 1. Refresh role data from the PDF (needs poppler's pdftotext)
python3 scripts/extract_profiles.py sfia_9_illustrative_skills_profiles.pdf

# 2. Rebuild agents at a chosen SFIA level (default 4)
python3 scripts/build_agents.py --level 5
```

Pushing to `main` rebuilds the agents and redeploys the site through GitHub Actions (`.github/workflows/pages.yml`).

## Using the agents

- **Claude Code:** copy `agents/` (and any orchestrator) into your project's `.claude/agents/`.
- **Other frameworks (Rovo, Agent SDK, Copilot Studio):** use the Markdown body as the system prompt and attach the MCP servers listed in its Tools section.
- Start every MCP server read-only. Community servers should be code-reviewed before use.

## Customising

- Add or change MCP servers in `data/mcp-catalog.json`, then map them in `data/mcp-map.json`.
- Tailor skills per role in `data/roles.json`. The generator uses the first seven "look at first" skills.

## Important: SFIA guidance

These are generic, illustrative mappings. Per the SFIA Foundation: do not use them without tailoring, SFIA does not prescribe jobs or organisation design, and you must set levels from your own role context. Keep to 5–7 skills per role. The agents are told never to assess or grade a named person's SFIA level.

SFIA® is a registered trademark of the SFIA Foundation. Skill names and codes come from the SFIA 9 framework; see https://sfia-online.org for licensing terms. The source PDF is not redistributed here.

MCP status reflects public listings checked in October 2026. Verify with each vendor before connecting.
