// Offline self-test: fakes the Claude API, then drives Muster through the web API.
// Run: npm test   (no API key or channel credentials needed)
import http from "node:http";
import assert from "node:assert/strict";

const fake = http.createServer((req, res) => {
  let body = "";
  req.on("data", c => (body += c));
  req.on("end", () => {
    const r = JSON.parse(body);
    const sys = typeof r.system === "string" ? r.system : JSON.stringify(r.system);
    const last = r.messages[r.messages.length - 1];
    const hasResult = Array.isArray(last.content) && last.content.some((b: { type: string }) => b.type === "tool_result");
    const msg = (content: unknown[], stop: string) => ({ id: "msg_test", type: "message", role: "assistant", model: r.model, content, stop_reason: stop, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } });
    let out;
    if (sys.startsWith("You are Muster")) {
      out = hasResult
        ? msg([{ type: "text", text: "Service Operations has it: incident logged and a problem record proposed." }], "end_turn")
        : msg([
            { type: "text", text: "Righto, let me muster the crew. Calling in Service Operations." },
            { type: "tool_use", id: "tu_1", name: "delegate", input: { agent_id: "service-operations", task: "Triage the student portal outage" } },
          ], "tool_use");
    } else {
      out = msg([{ type: "text", text: "Report: triaged, no MCP tools connected, recommend restarting the app pool." }], "end_turn");
    }
    res.writeHead(200, { "content-type": "application/json", "request-id": "req_test" });
    res.end(JSON.stringify(out));
  });
});

await new Promise<void>(ok => fake.listen(0, ok));
const fakePort = (fake.address() as { port: number }).port;
process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${fakePort}`;
process.env.ANTHROPIC_API_KEY = "test";
process.env.MUSTER_WEB_TOKEN = "secret";
process.env.MUSTER_WEBHOOK_TOKEN = "hook";

const { classify, decide } = await import("./autonomy.js");
assert.equal(classify("list_issues"), "read");
assert.equal(classify("create_issue"), "write");
assert.equal(classify("delete_branch"), "destructive");
assert.equal(classify("anything", { readOnlyHint: true }), "read");
assert.equal(decide("service-desk", "write"), "approve");           // level 3
assert.equal(decide("site-reliability-engineer-sre", "write"), "auto"); // level 5
assert.equal(decide("site-reliability-engineer-sre", "destructive"), "approve");
console.log("✓ autonomy rules");
{ // Domain caps: a healthcare EMR is read-only for every agent, whatever its level.
  process.env.MUSTER_DOMAIN = "healthcare";
  const dm = await import("./domain.js?healthcare" as string) as typeof import("./domain.js");
  assert.equal(dm.domain?.name, "Healthcare");
  assert.equal(dm.sorDecision("emr", "write"), "never");
  assert.equal(dm.sorDecision("emr", "read"), null);
  assert.equal(dm.sorDecision("safety", "write"), "approve");
  assert.ok(dm.sorIdsFor("data-analytics").includes("emr"));
  assert.match(dm.domainBrief("data-analytics"), /Never: Write to any clinical record/);
  delete process.env.MUSTER_DOMAIN;
  console.log("✓ domain pack: healthcare EMR read-only, safety writes need approval");
}

const { catalog } = await import("./muster.js");
assert.equal(catalog.agents.size, 75);
assert.ok(catalog.agents.get("business-analysis")?.capabilities.length);
console.log(`✓ catalogue: ${catalog.agents.size} agents, ${Object.keys(catalog.orchestrators).length} orchestrators`);

const { requestApproval, resolveApproval, listPending } = await import("./approvals.js");
const said: string[] = [];
const notifier = { say: async (t: string) => void said.push(t), askApproval: async () => {} };
const p = requestApproval({ agentId: "service-desk", tool: { serverId: "x", name: "close_ticket", exposedName: "x__close_ticket", description: "", inputSchema: {}, risk: "write" }, input: { id: 1 }, reason: "test", notifier, requestedBy: "tester" });
assert.equal(listPending().length, 1);
assert.equal(await resolveApproval(p.id, false, "tester"), "Rejected.");
assert.equal(listPending().length, 0);
console.log("✓ approval flow");

const { app } = await import("./channels/web.js");
(await import("./channels/webhook.js")).mountWebhook(app);
const server = app.listen(0);
await new Promise(ok => server.once("listening", ok));
const port = (server.address() as { port: number }).port;
const call = (path: string, init?: RequestInit) => fetch(`http://127.0.0.1:${port}${path}`, init);

assert.equal((await call("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status, 401);
const res = await call("/api/chat", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer secret" }, body: JSON.stringify({ conversationId: "t1", user: "Tester", text: "The student portal is down" }) });
const j = await res.json() as { reply: string; events: { text: string }[] };
assert.equal(res.status, 200);
assert.match(j.reply, /Service Operations has it/);
assert.match(j.events[0].text, /Calling in Service Operations/);
console.log("✓ web chat → Muster → delegate → service-operations agent → reply");
assert.equal((await (await call("/healthz")).json() as { agents: number }).agents, 75);
const wh = await call("/api/webhook", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer hook" }, body: JSON.stringify({ source: "jira", conversationId: "ITSM-42", user: "Tester", text: "Portal down" }) });
assert.equal(wh.status, 200);
assert.equal((await wh.json() as { conversationId: string }).conversationId, "jira:ITSM-42");
console.log("✓ webhook (Jira-style ticket) → reply");
console.log("✓ health endpoint\nAll self-tests passed.");
server.close(); fake.close();
process.exit(0);
