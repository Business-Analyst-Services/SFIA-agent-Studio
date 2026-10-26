# SFIA Role Agent Studio

Turns the SFIA Foundation's **SFIA 9 illustrative skills profiles** (March 2026) into an AI agent workforce: one agent per role, one orchestrator per role family, an industry-agnostic capability model, and **Muster** — a kelpie-shaped IT helper that fronts the whole crew.

**Live site:** https://business-analyst-services.github.io/SFIA-agent-Studio/

## Meet Muster (the front page)

The site opens on the Muster demo — a call-style session with a full 3D low-poly kelpie sitting in an outback paddock:

- **Join like a meeting.** A lobby offers *Join the meeting* (voice-first, Teams/Zoom/Meet style) or text modes styled as Slack, Teams chat, Email or an intranet widget.
- **Talk or type.** Voice input uses the browser's speech recognition (Chrome/Edge); replies are read aloud with a deep, gruff voice by default. In the meeting, the 💬 button opens the in-call chat as a floating panel — conversation, approvals and typing live there, with live captions under Muster for voice-only use.
- **Scenarios are offered, not fired.** Pick from the Scenario menu (quick requests, six end-to-end value streams, twelve industry scenarios) or just describe a problem — Muster proposes it with *Run it / Plan it first / Something else* chips.
- **Delivery plans.** Ask Muster to "plan" any build and it maps the lifecycle — Discover, Design, Build, Test, Transition, Run — with the teams and agents per phase, the artefacts each produces, approval counts and phase gates, filed as a plan document.
- **Governance on show.** Every tool action is classed read / write / destructive and gated by the agents' SFIA level and the industry pack's systems-of-record caps; approvals happen in the conversation, and the *Behind the scenes / Artefacts* drawer shows routing, the audit trail and high-fidelity previews of everything created (Jira issues, ServiceNow forms, PRs, dashboards…).
- **A crew of native animals.** Every role family has its own low-poly Australian animal — bilby for Business Analysis, dingo for DevOps, Tasmanian devil for Security, wombat, echidna, kookaburra and seventeen more — generated in the same art style as Muster (`site/menagerie.js`). When Muster hands a step to an agent, that animal **joins the session** as a participant tile: it pops in, goes live (animated, blinking, tail going) while its agent works, and gets a ✓ when its step is done. Agents also speak in the conversation as themselves — approval requests come from the agent's own avatar, not from Muster.
- **Voice options.** Settings offer Gruff / Deep / Natural tones over your browser's voices, plus an optional ElevenLabs key for a properly gravelly Muster (voices load from your account; the key stays in your browser).

Site navigation lives in the **Background** menu (top right): Capability map, Role agents, Value streams, Domains, Integrate, GitHub.

## What's in the repo

| Path | What it is |
|---|---|
| `site/index.html` | **The Muster demo** described above. `?stream=`, `?domain=`, `?cap=` and `?role=` deep-link straight into a run; `site/muster.html` redirects here. |
| `site/agents.html` | The role agent studio. Browse 75 roles, choose 5–7 skills, set a target SFIA level (1–7), and copy the agent prompt, agent JSON or orchestrator prompt. |
| `site/capability-map.html` | An IT capability model organised by SFIA 9 categories and subcategories, with all 75 roles placed on it and gaps called out (data in `data/capability-map.json`, built by `scripts/build_capability_map.py`). |
| `site/value-streams.html` | Six end-to-end value streams (data in `data/value-streams.json`): each step's agent, capability, tools, artefacts and handoff, runnable in the demo. |
| `site/domains.html` | Domain packs for 12 industries (data in `data/domains.json`, built by `scripts/build_domains.py`): systems of record, standards, MCP routes, read/write/never rules and a runnable scenario each. |
| `site/integrate.html` | How to plug the Muster assistant into Slack, Teams, email, intranets, Jira Service Management, ServiceNow, the REST API, and Rovo / Copilot Studio / Claude Code. |
| `site/vendor/three.min.js` | three.js (pinned, self-hosted) for the 3D Muster. |
| `assistant/` | The deployable Muster service — see below and `assistant/README.md`. |
| `data/roles.json` | 75 role profiles extracted from the PDF: family, description, example job titles, skills with codes and level ranges. |
| `data/mcp-catalog.json` / `data/mcp-map.json` | MCP servers (status, purpose, source) and which are recommended per role family and role. |
| `agents/*.md` | Generated role agents (75). Claude Code subagent format: copy into `.claude/agents/`. |
| `orchestrators/*.md` | Generated family orchestrators (22) that route requests by SFIA skill code. |
| `scripts/extract_profiles.py` | Rebuilds `data/roles.json` from the SFIA PDF. |
| `scripts/build_agents.py` | Regenerates `agents/` and `orchestrators/` from the data. |

## Run locally

```bash
mkdir -p _site && cp site/*.html site/*.js _site/ && cp -r site/vendor data agents orchestrators _site/
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
