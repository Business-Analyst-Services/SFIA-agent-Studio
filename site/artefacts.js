/* Shared artefact cards and high-fidelity previews. window.Artefacts = { card(a,isNew), chip(a), open(a) }.
   Each preview renders in the visual language of its system: Jira issue, ServiceNow form, GitHub PR,
   Confluence page, document page, spreadsheet grid, terminal log, dashboard tiles, email, board. */
(function () {
  // system → [badge letters, hue, darkText?]
  const APPS = { Jira: ["J", "#1868db"], Confluence: ["C", "#1868db"], ServiceNow: ["SN", "#0b6b5d"], GitHub: ["GH", "#24292f"],
    "Google Drive": ["G", "#188038"], "Microsoft 365": ["M", "#d83b01"], Grafana: ["Gr", "#f46800"], Kubernetes: ["K8", "#326ce5"],
    Deployment: ["▲", "#24292f"], dbt: ["dbt", "#ff694b"], Snowflake: ["❄", "#1d9ed9"], Miro: ["Mi", "#f2c14e", 1], Figma: ["F", "#a259ff"],
    Stripe: ["S", "#635bff"], "Stripe (test mode)": ["S", "#635bff"], "Fan CRM": ["CR", "#00a1e0"], "Student CRM": ["CR", "#00a1e0"],
    "Accounting ledger": ["AL", "#13709b"], "Ledger (testnet)": ["Ξ", "#5b3fd1"], "Ledger": ["Ξ", "#5b3fd1"],
    "Identity provider": ["ID", "#0f6e64"], "Records management": ["RM", "#1f4e8c"], "TMS (test)": ["TM", "#c2410c"], "Feature flags": ["FF", "#405cf5"] };
  const app = (s) => APPS[s] || APPS[Object.keys(APPS).find((k) => s && s.startsWith(k))] || [String(s || "?").slice(0, 2), "var(--accent, #0f6e64)"];

  const css = `
  .af-card{display:flex;gap:10px;align-items:flex-start;text-align:left;width:100%;font:inherit;color:inherit;background:var(--panel,#fff);border:1px solid var(--line,#d9e1df);border-radius:9px;padding:9px 11px;cursor:pointer}
  .af-card:hover{border-color:var(--accent,#0f6e64)}
  .af-card.new{animation:af-in .5s ease}
  @keyframes af-in{from{transform:translateY(6px);opacity:.3}}
  @media (prefers-reduced-motion:reduce){.af-card.new{animation:none}}
  .af-tile{flex:none;width:34px;height:34px;border-radius:8px;display:grid;place-items:center;font:700 11px "IBM Plex Mono",ui-monospace,monospace;background:var(--ah);color:#fff}
  .af-tile.dk{color:#1d2b29}
  .af-b{min-width:0}
  .af-k{font:500 11px "IBM Plex Mono",ui-monospace,monospace;color:var(--muted,#5b6b68)}
  .af-t{font-weight:600;font-size:13.5px;line-height:1.35;display:block}
  .af-chip{display:inline-flex;align-items:center;gap:5px;font:600 12px "Public Sans",system-ui,sans-serif;color:var(--accent,#0f6e64);background:var(--accent-soft,#dcefeb);border:0;border-radius:999px;padding:3px 10px;cursor:pointer}
  .af-chip:hover{text-decoration:underline}
  dialog.af-dlg{border:1px solid var(--line,#d9e1df);border-radius:14px;padding:0;width:min(680px,calc(100vw - 32px));max-height:calc(100vh - 48px);background:var(--panel,#fff);color:var(--ink,#14211f);box-shadow:0 24px 70px rgba(0,0,0,.35);font:14px/1.5 "Public Sans",system-ui,sans-serif}
  dialog.af-dlg::backdrop{background:rgba(10,20,18,.5)}
  .af-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line,#d9e1df);position:sticky;top:0;background:var(--panel,#fff);z-index:2}
  .af-bar .af-tile{width:26px;height:26px;border-radius:6px;font-size:10px}
  .af-bar b{font:700 14px "Familjen Grotesk",system-ui,sans-serif}
  .af-bar .af-k{margin-left:auto}
  .af-x{border:0;background:none;color:var(--muted,#5b6b68);font-size:24px;line-height:1;cursor:pointer;padding:0 2px}
  .af-x:focus-visible{outline:2px solid var(--accent,#0f6e64)}
  .af-body{padding:16px 18px 6px;overflow-wrap:anywhere}
  .af-title{font:700 20px/1.25 "Familjen Grotesk",system-ui,sans-serif;margin:4px 0 10px;text-wrap:balance}
  .af-note{padding:10px 18px 16px;font-size:11.5px;color:var(--muted,#5b6b68)}
  .af-pill{display:inline-block;font:600 11px "Public Sans",system-ui,sans-serif;letter-spacing:.02em;border-radius:4px;padding:2px 8px;white-space:nowrap}
  .af-pill.ok{background:var(--accent-soft,#dcefeb);color:var(--accent,#0f6e64);box-shadow:inset 0 0 0 1px var(--accent,#0f6e64)}
  .af-pill.warn{background:rgba(194,65,12,.12);color:var(--warm,#c2410c);box-shadow:inset 0 0 0 1px var(--warm,#c2410c)}
  .af-pill.mid{background:var(--line,#d9e1df);color:var(--ink,#14211f)}
  .af-grid{display:grid;grid-template-columns:minmax(110px,auto) 1fr;gap:5px 14px;margin:10px 0;font-size:13px}
  .af-grid dt{color:var(--muted,#5b6b68)} .af-grid dd{margin:0;font-weight:600}
  .af-sec h4{font:700 13.5px "Familjen Grotesk",system-ui,sans-serif;margin:14px 0 4px}
  .af-sec p{margin:0}.af-sec ul{margin:2px 0 0;padding-left:18px}.af-sec li{margin:3px 0}
  .af-sec table{border-collapse:collapse;width:100%;font-size:13px;font-variant-numeric:tabular-nums;margin-top:4px}
  .af-sec td,.af-sec th{border:1px solid var(--line,#d9e1df);padding:5px 9px;text-align:left}
  .af-sec th{color:var(--muted,#5b6b68);font-weight:600;background:var(--bg,#f4f6f6)}
  /* Jira */
  .jr-top{display:flex;align-items:center;gap:8px;font:600 12px "IBM Plex Mono",ui-monospace,monospace;color:var(--muted)}
  .jr-cols{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(170px,1fr);gap:18px}
  @media(max-width:560px){.jr-cols{grid-template-columns:1fr}}
  .jr-side{border-left:1px solid var(--line,#d9e1df);padding-left:14px}
  .jr-side h5{font:600 11px "Public Sans",system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
  .jr-side .af-grid{grid-template-columns:1fr;gap:1px;margin:0}
  .jr-side .af-grid dt{font-size:11.5px;margin-top:7px}
  /* ServiceNow */
  .sn-state{display:flex;gap:8px;align-items:center;background:var(--bg,#f4f6f6);border:1px solid var(--line);border-radius:7px;padding:8px 12px;font:600 13px "IBM Plex Mono",ui-monospace,monospace}
  .sn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px 16px;margin:12px 0}
  .sn-f label{display:block;font-size:11.5px;color:var(--muted);margin-bottom:2px}
  .sn-f span{display:block;border:1px solid var(--line);border-radius:5px;padding:5px 9px;background:var(--panel,#fff);font-weight:600;font-size:13px;min-height:29px}
  /* GitHub */
  .gh-badge{display:inline-flex;align-items:center;gap:5px;background:#1a7f37;color:#fff;border-radius:999px;padding:3px 11px;font:600 12.5px "Public Sans",system-ui,sans-serif}
  .gh-branch{font:500 12px "IBM Plex Mono",ui-monospace,monospace;background:var(--accent-soft,#dcefeb);color:var(--accent,#0f6e64);border-radius:4px;padding:1px 6px}
  .gh-meta{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0;font-size:13px;color:var(--muted)}
  .gh-meta b{color:var(--ink,#14211f)}
  .gh-checks{border:1px solid var(--line);border-radius:7px;margin-top:10px;font-size:13px}
  .gh-checks div{display:flex;gap:8px;align-items:center;padding:7px 11px;border-top:1px solid var(--line)}
  .gh-checks div:first-child{border-top:0}
  .gh-ok{color:#1a7f37;font-weight:700}
  /* Confluence / documents */
  .cf-crumb{font-size:12px;color:var(--muted)}
  .cf-by{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--muted);margin:2px 0 12px;padding-bottom:10px;border-bottom:1px solid var(--line)}
  .cf-av{width:22px;height:22px;border-radius:50%;background:var(--accent,#0f6e64);color:var(--bg,#fff);display:grid;place-items:center;font:700 10px "Public Sans",system-ui,sans-serif}
  .af-page{border:1px solid var(--line);border-radius:4px;background:var(--panel,#fff);box-shadow:0 1px 4px rgba(0,0,0,.08);padding:26px 30px;margin:4px 0 8px}
  .af-page .af-title{font-size:21px}
  .af-page .meta{font-size:12px;color:var(--muted);border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:10px}
  /* spreadsheet */
  .af-sheet{overflow-x:auto;border:1px solid var(--line);border-radius:6px;margin-top:8px}
  .af-sheet table{border-collapse:collapse;width:100%;font:12.5px "Public Sans",system-ui,sans-serif;font-variant-numeric:tabular-nums}
  .af-sheet td,.af-sheet th{border:1px solid var(--line);padding:4px 9px;white-space:nowrap}
  .af-sheet .rc{background:var(--bg,#f4f6f6);color:var(--muted);font:600 10.5px "IBM Plex Mono",ui-monospace,monospace;text-align:center;min-width:26px}
  .af-sheet .hd{background:var(--accent-soft,#dcefeb);font-weight:700}
  .af-sheet .fx{font:500 12px "IBM Plex Mono",ui-monospace,monospace;color:var(--muted);background:var(--bg);border-bottom:1px solid var(--line);padding:5px 9px;display:flex;gap:8px}
  /* terminal */
  .af-term{background:#0c1412;color:#cfe8e2;border-radius:8px;padding:12px 14px;font:12.5px/1.7 "IBM Plex Mono",ui-monospace,monospace;overflow-x:auto;margin-top:8px}
  .af-term .tm{color:#5cc9b8}.af-term .cm{color:#7d958f}.af-term .okl{color:#7ee2a8}
  /* dashboard */
  .af-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:10px 0}
  .af-tiles>div{border:1px solid var(--line);border-radius:9px;padding:10px 12px;background:var(--bg,#f4f6f6)}
  .af-tiles span{display:block;font-size:11.5px;color:var(--muted)}
  .af-tiles b{font:700 22px "Familjen Grotesk",system-ui,sans-serif;font-variant-numeric:tabular-nums}
  .af-tiles em{display:block;font:500 11px "IBM Plex Mono",ui-monospace,monospace;color:var(--accent,#0f6e64);font-style:normal}
  /* board (stickies) */
  .af-board{background:var(--bg,#f4f6f6);background-image:radial-gradient(var(--line,#d9e1df) 1px,transparent 1px);background-size:16px 16px;border:1px solid var(--line);border-radius:9px;padding:18px;display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}
  .af-sticky{width:132px;min-height:96px;padding:10px;font:600 12px/1.4 "Public Sans",system-ui,sans-serif;color:#1d2b29;box-shadow:0 3px 6px rgba(0,0,0,.18);transform:rotate(-1.2deg)}
  .af-sticky:nth-child(2n){transform:rotate(1.4deg)}
  .af-sticky:nth-child(3n){transform:rotate(-.5deg)}
  /* email */
  .af-mailh{border:1px solid var(--line);border-radius:8px 8px 0 0;background:var(--bg,#f4f6f6);padding:10px 14px;font-size:13px}
  .af-mailh div{display:flex;gap:8px}.af-mailh dt{width:52px;color:var(--muted)}.af-mailh dd{margin:0;font-weight:600}
  .af-mailb{border:1px solid var(--line);border-top:0;border-radius:0 0 8px 8px;padding:14px;font-size:14px}
  /* api */
  .af-api{background:var(--bg,#f4f6f6);border:1px solid var(--line);border-radius:8px;padding:12px 14px;font:12.5px/1.8 "IBM Plex Mono",ui-monospace,monospace;overflow-x:auto;margin-top:8px}
  .af-api i{color:var(--muted);font-style:normal}.af-api b{color:var(--accent,#0f6e64)}
  /* figma frame */
  .af-frame{border:1px solid var(--line);border-radius:9px;background:var(--bg);padding:16px;display:flex;gap:14px;align-items:stretch;margin-top:8px;overflow-x:auto}
  .af-dev{flex:none;width:118px;height:196px;border:2px solid var(--ink,#14211f);border-radius:14px;background:var(--panel,#fff);display:flex;flex-direction:column;gap:5px;padding:9px}
  .af-dev i{display:block;background:var(--line);border-radius:3px;height:9px}
  .af-dev i.b{background:var(--accent,#0f6e64);height:22px;margin-top:auto;border-radius:6px}
  .af-dev i.hero{height:44px;background:var(--accent-soft,#dcefeb)}
  .af-dev em{font:600 9px "Public Sans",system-ui,sans-serif;color:var(--muted);font-style:normal;text-align:center}
  /* governance */
  .af-ai{display:flex;gap:8px;align-items:center;border:1px solid #b7791f;background:rgba(242,193,78,.16);color:#7a5a12;border-radius:7px;padding:7px 11px;font:600 12px "Public Sans",system-ui,sans-serif;margin:8px 0}
  .af-stamp{border:1px solid var(--line);border-left:4px solid #1a7f37;border-radius:6px;padding:8px 12px;margin:10px 0 2px;font-size:12.5px;background:var(--bg,#f4f6f6)}
  .af-stamp.rw{border-left-color:#c2410c}.af-stamp.as{border-left-color:#1f4e8c}
  .af-lab{display:inline-block;font:600 10.5px "IBM Plex Mono",ui-monospace,monospace;background:var(--line,#d9e1df);border-radius:4px;padding:1px 7px;margin:0 4px 4px 0}
  .af-lab.ai{background:rgba(242,193,78,.3);color:#6b4e0e}.af-lab.ok{background:var(--accent-soft,#dcefeb);color:var(--accent,#0f6e64)}
  /* requirement register */
  .af-reqs{border-collapse:collapse;width:100%;font-size:12.5px;margin-top:6px}
  .af-reqs td,.af-reqs th{border:1px solid var(--line,#d9e1df);padding:5px 8px;text-align:left;vertical-align:top}
  .af-reqs th{background:#1d3461;color:#fff;font:600 11px "Public Sans",system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap}
  .af-reqs .rid{font:600 11.5px "IBM Plex Mono",ui-monospace,monospace;white-space:nowrap}
  .msc{font:700 10px "Public Sans",system-ui,sans-serif;border-radius:3px;padding:1px 6px;white-space:nowrap}
  .msc.M{background:#1d3461;color:#fff}.msc.S{background:#3f6bb5;color:#fff}.msc.C{background:#8fa6c8;color:#14211f}.msc.W{background:var(--line);color:var(--ink,#14211f)}
  /* gherkin */
  .af-gk .gk{color:#f2c14e;font-weight:700}
  /* numbered doc sections (Confluence style) */
  .cf-num{counter-reset:cfs}
  .cf-num .af-sec h4{counter-increment:cfs}
  .cf-num .af-sec h4:before{content:counter(cfs) ". ";color:var(--accent,#0f6e64)}
  /* BAS practice-deliverable page */
  .bas-doc{border:1px solid var(--line,#d9e1df);border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);margin:6px 0 8px;background:#f7f9fb;color:#14211f}
  .bas-head{background:#1d3461;color:#fff;padding:14px 46px;text-align:center;position:relative}
  .bas-code{position:absolute;left:10px;top:10px;font:700 10px "IBM Plex Mono",ui-monospace,monospace;background:#f2c14e;color:#1d2b29;border-radius:3px;padding:2px 7px}
  .bas-head h3{margin:0;font:700 19px "Familjen Grotesk",system-ui,sans-serif;text-wrap:balance}
  .bas-head p{margin:5px 0 0;font-size:11.5px;color:#c7d3e8}
  .bas-body{padding:12px 14px;display:grid;gap:10px}
  .bas-sec{background:#fff;border:1px solid #dbe3ea;border-radius:5px;overflow:hidden}
  .bas-sec>h4{margin:0;background:#2a4f8f;color:#fff;font:700 11px "Public Sans",system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;padding:6px 11px}
  .bas-sec>div{padding:9px 12px;font-size:13px}
  .bas-sec .af-sec h4{margin-top:0}
  .bas-foot{background:#1d3461;color:#c7d3e8;font-size:10.5px;padding:7px 14px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}`;

  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tone = (v) => /approved|passing|pass|success|live|done|published|100%|intact|healthy|green|created|scheduled|ok\b/i.test(v) ? "ok" : /draft|pending|required|review|test|assess|waiting/i.test(v) ? "warn" : "mid";
  const pill = (v) => `<span class="af-pill ${tone(v)}">${esc(v)}</span>`;
  const F = (a) => a.fields || {};
  const take = (a, used, keys) => { for (const k of keys) if (F(a)[k] != null) { used.add(k); return F(a)[k]; } return null; };
  const grid = (a, used) => { const en = Object.entries(F(a)).filter(([k]) => !used.has(k)); return en.length ? `<dl class="af-grid">${en.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""; };
  const secs = (a, skipTable) => (a.sections || []).map((s) => `<div class="af-sec">${s.h ? `<h4>${esc(s.h)}</h4>` : ""}${s.text ? `<p>${esc(s.text)}</p>` : ""}${s.items ? `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}${s.reqs ? reqTable(s.reqs) : ""}${s.gherkin ? gherkin(s.gherkin) : ""}${s.stamp ? stamp(s.stamp) : ""}${s.table && !skipTable ? `<table>${s.table.map((r, i) => `<tr>${r.map((c) => i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`).join("")}</tr>`).join("")}</table>` : ""}</div>`).join("");
  const title = (a) => `<h3 class="af-title">${esc(a.title)}</h3>`;
  const stamp = (x) => { const cls = x.kind === "rework" ? "rw" : x.kind === "assurance" ? "as" : ""; const ic = x.kind === "rework" ? "↩" : "✓";
    const lab = x.label || (x.kind === "rework" ? "Sent back for rework" : x.kind === "assurance" ? "Domain assurance approved" : "Approved");
    return `<div class="af-stamp ${cls}"><b>${ic} ${esc(lab)}</b> by ${esc(x.by)}${x.date ? ` on ${esc(x.date)}` : ""}${x.note ? ` · ${esc(x.note)}` : ""}</div>`; };
  const reqTable = (rows) => `<table class="af-reqs"><tr><th>ID</th><th>Requirement</th><th>MoSCoW</th><th>Acceptance</th></tr>${rows.map((r) => `<tr><td class="rid">${esc(r.id)}</td><td>${esc(r.text)}</td><td><span class="msc ${esc((r.m || "M")[0])}">${esc(r.m || "Must")}</span></td><td>${esc(r.accept || "Testable — note drafted")}</td></tr>`).join("")}</table>`;
  const gherkin = (g) => `<div class="af-term af-gk">${g.map((x) => `<div><span class="gk">Given</span> ${esc(x.g)}</div><div><span class="gk">When</span> ${esc(x.w)}</div><div><span class="gk">Then</span> ${esc(x.t)}</div>`).join('<div> </div>')}</div>`;
  const labelList = (a) => String((a.fields || {}).Labels || "").split(/[·,]/).map((x) => x.trim()).filter(Boolean);
  const labChips = (a) => { const ls = labelList(a); return ls.length ? `<div>${ls.map((l) => `<span class="af-lab ${/^ai-/.test(l) ? "ai" : /approved|assured/.test(l) ? "ok" : ""}">${esc(l)}</span>`).join("")}</div>` : ""; };
  const aiBan = (a) => { const ls = labelList(a); return ls.includes("ai-generated") && !ls.some((l) => /ba-approved|domain-assured/.test(l)) ? `<div class="af-ai">⚠ AI-generated draft — a human reviews and approves before this is final.</div>` : ""; };
  const firstItems = (a) => ((a.sections || []).find((s) => s.items) || {}).items || [];
  const firstTable = (a) => ((a.sections || []).find((s) => s.table) || {}).table || null;

  const T = {
    jira(a) { const u = new Set(); const stt = take(a, u, ["Status", "State"]) || "Open";
      u.add("Labels");
      return `<div class="jr-top"><span>${esc(a.id)}</span>${pill(stt)}<span>· ${esc(a.kind)}</span></div>${title(a)}${aiBan(a)}
      <div class="jr-cols"><div>${secs(a) || '<p class="af-sec">No description.</p>'}</div><aside class="jr-side"><h5>Details</h5>${grid(a, u) || '<dl class="af-grid"><dt>Reporter</dt><dd>Muster</dd></dl>'}${labelList(a).length ? `<h5 style="margin-top:12px">Labels</h5>${labChips(a)}` : ""}</aside></div>`; },
    sn(a) { const u = new Set(); const stt = take(a, u, ["State", "Status", "Approval", "Result"]) || "New";
      return `<div class="sn-state"><span>${esc(a.id)}</span>${pill(stt)}<span style="margin-left:auto;font-weight:400;color:var(--muted)">${esc(a.kind)}</span></div>${title(a)}
      <div class="sn-grid">${Object.entries(F(a)).filter(([k]) => !u.has(k)).map(([k, v]) => `<div class="sn-f"><label>${esc(k)}</label><span>${esc(v)}</span></div>`).join("")}</div>${secs(a)}`; },
    gh(a) { const u = new Set(); const br = take(a, u, ["Branch"]) || ""; const checks = take(a, u, ["Checks"]) || ""; const files = take(a, u, ["Files changed"]); const rev = take(a, u, ["Reviewers"]);
      const [from, to] = br.split("→").map((x) => x && x.trim());
      return `${title(a)}<div><span class="gh-badge">⊶ Open</span> ${from ? `<span class="gh-branch">${esc(from)}</span> → <span class="gh-branch">${esc(to || "main")}</span>` : ""}</div>
      <div class="gh-meta">${files ? `<span><b>${esc(files)}</b> files changed</span>` : ""}${rev ? `<span><b>${esc(rev)}</b></span>` : ""}<span>Opened by <b>Muster</b> for the software engineering agent</span></div>
      ${secs(a)}<div class="gh-checks"><div><span class="gh-ok">✓</span> build and unit tests</div><div><span class="gh-ok">✓</span> static analysis</div><div><span class="gh-ok">✓</span> ${esc(checks || "All checks have passed")}</div></div>${grid(a, u)}`; },
    conf(a) { const u = new Set(); const space = take(a, u, ["Space"]) || "Knowledge base"; u.add("Labels"); const ver = take(a, u, ["Version"]) || "v. 1";
      return `<div class="cf-crumb">${esc(space)} / … / <b>${esc(a.title)}</b></div>${title(a)}
      <div class="cf-by"><span class="cf-av">M</span><span>Published by <b>Muster</b> on behalf of the authoring agent · ${esc(ver)} · just now</span>${["Status"].map(k => F(a)[k] ? (u.add(k), pill(F(a)[k])) : "").join("")}</div>
      ${aiBan(a)}<div class="cf-num">${secs(a)}</div>${labChips(a)}${grid(a, u)}`; },
    doc(a) { const u = new Set(); u.add("Labels");
      const code = a.code || (a.kind || "DOC").split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 3);
      const purpose = a.purpose || ((a.sections || [])[0] || {}).text || "";
      const body = (a.sections || []).filter((s) => s.items || s.reqs || s.gherkin || s.stamp || s.table || (s.text && s.text !== purpose)).map((s) => `<div class="bas-sec"><h4>${esc(s.h || a.kind)}</h4><div>${s.text && s.text !== purpose ? `<p style="margin:0 0 6px">${esc(s.text)}</p>` : ""}${s.items ? `<ul style="margin:0;padding-left:18px">${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}${s.reqs ? reqTable(s.reqs) : ""}${s.gherkin ? gherkin(s.gherkin) : ""}${s.stamp ? stamp(s.stamp) : ""}${s.table ? `<table class="af-reqs">${s.table.map((r, i) => `<tr>${r.map((c) => i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`).join("")}</tr>`).join("")}</table>` : ""}</div></div>`).join("");
      return `${aiBan(a)}<div class="bas-doc"><div class="bas-head"><span class="bas-code">${esc(code)}</span><h3>${esc(a.title)}</h3>${purpose ? `<p>${esc(purpose)}</p>` : ""}</div>
      <div class="bas-body">${body || '<div class="bas-sec"><h4>Draft</h4><div>Prepared for review.</div></div>'}</div>
      <div class="bas-foot"><span>${Object.entries(F(a)).slice(0, 3).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join("  ·  ") || "Draft for review"}</span><span>${esc(a.id)} · drafted by the ${esc((F(a)["Created by"] || "authoring agent").replace(/ agent$/, ""))} agent via Muster</span></div></div>${labChips(a)}`; },
    sheet(a) { const t = firstTable(a) || [["Item", "Value"], ...Object.entries(F(a))]; const cols = t[0].length;
      const letters = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));
      return `${title(a)}<div class="af-grid" style="margin:4px 0 0">${Object.entries(F(a)).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</div>
      <div class="af-sheet"><div class="fx"><b>fx</b><span>=SUM(B2:B${t.length - 1})</span></div><table><tr><th class="rc"></th>${letters.map((l) => `<th class="rc">${l}</th>`).join("")}</tr>
      ${t.map((r, i) => `<tr><td class="rc">${i + 1}</td>${r.map((c) => `<td class="${i === 0 ? "hd" : ""}">${esc(c)}</td>`).join("")}${"<td></td>".repeat(cols - r.length)}</tr>`).join("")}</table></div>${secs(a, true)}`; },
    term(a) { const lines = firstItems(a);
      return `${title(a)}<div class="af-term">${Object.entries(F(a)).map(([k, v]) => `<div><span class="cm"># ${esc(k)}: ${esc(v)}</span></div>`).join("")}
      ${lines.map((l) => `<div>${esc(l).replace(/^(\d{2}:\d{2})/, '<span class="tm">$1</span>')}</div>`).join("") || '<div><span class="okl">✓ completed</span></div>'}
      <div><span class="okl">✓ finished with exit code 0</span></div></div>${(a.sections || []).filter((s) => !s.items).map(() => "").join("")}`; },
    dash(a) { const t = firstTable(a); const rows = t ? t.slice(1) : [];
      return `${title(a)}<div class="af-grid" style="margin:4px 0 6px">${Object.entries(F(a)).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <div class="af-tiles">${rows.map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[1] ?? "")}</b><em>${esc(r[2] ?? "")}</em></div>`).join("")}</div>${(a.sections || []).filter((s) => !s.table).map((s) => `<div class="af-sec"><h4>${esc(s.h)}</h4>${s.items ? `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}</div>`).join("")}`; },
    board(a) { const items = firstItems(a); const colors = ["#ffe066", "#b2f2bb", "#ffc9c9", "#a5d8ff", "#eebefa"];
      return `${title(a)}<div class="af-grid" style="margin:0">${Object.entries(F(a)).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <div class="af-board">${items.map((i, n) => `<div class="af-sticky" style="background:${colors[n % colors.length]}">${esc(i)}</div>`).join("") || '<div class="af-sticky" style="background:#ffe066">Workshop output</div>'}</div>`; },
    mail(a) { const u = new Set(); const to = take(a, u, ["To"]); const from = take(a, u, ["From"]) || "Muster"; const sent = take(a, u, ["Sent"]);
      return `<div class="af-mailh"><div><dt>From</dt><dd>${esc(from)}</dd></div><div><dt>To</dt><dd>${esc(to || "Recipients")}</dd></div><div><dt>Subject</dt><dd>${esc(a.title)}</dd></div>${sent ? `<div><dt>Sent</dt><dd>${esc(sent)}</dd></div>` : ""}</div>
      <div class="af-mailb">${(a.sections || []).map((s) => `${s.text ? `<p>${esc(s.text)}</p>` : ""}${s.items ? `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}`).join("") || "<p>See details above.</p>"}<p>— Muster, on behalf of the team</p></div>${grid(a, u)}`; },
    api(a) { return `${title(a)}<div class="af-api"><div>{</div><div>  <b>"id"</b>: <i>"${esc(a.id)}"</i>,</div>${Object.entries(F(a)).map(([k, v]) => `<div>  <b>"${esc(k.toLowerCase().replace(/\s+/g, "_"))}"</b>: <i>"${esc(v)}"</i>,</div>`).join("")}<div>  <b>"livemode"</b>: <i>false</i></div><div>}</div></div>${secs(a)}`; },
    grafana(a) { const u = new Set(); const cond = take(a, u, ["Condition"]);
      return `<div class="jr-top">${pill("Normal")}<span>Alert rule · evaluating every 1h</span></div>${title(a)}
      ${cond ? `<div class="af-term"><div><span class="cm"># condition</span></div><div>WHEN <span class="tm">${esc(cond)}</span> FOR <span class="tm">1h</span> → <span class="okl">notify</span></div></div>` : ""}${grid(a, u)}${secs(a)}`; },
    frame(a) { return `${title(a)}<div class="af-frame">${[["Lodge a claim", "hero"], ["Your details", ""], ["Review & submit", ""]].map(([n, h]) => `<div class="af-dev"><em>${esc(n)}</em>${h ? '<i class="hero"></i>' : "<i></i>"}<i></i><i style="width:70%"></i><i></i><i class="b"></i></div>`).join("")}</div><dl class="af-grid">${Object.entries(F(a)).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>${secs(a)}`; },
    crm(a) { const u = new Set(); const stt = take(a, u, ["Status"]) || "Active";
      return `<div class="jr-top"><span>${esc(a.id)}</span>${pill(stt)}<span>· ${esc(a.kind)}</span></div>${title(a)}<div class="sn-grid">${Object.entries(F(a)).filter(([k]) => !u.has(k)).map(([k, v]) => `<div class="sn-f"><label>${esc(k)}</label><span>${esc(v)}</span></div>`).join("")}</div>${secs(a)}`; },
    gen(a) { const u = new Set(); const stt = take(a, u, ["Status", "State", "Result", "Approval"]);
      return `<div class="jr-top"><span>${esc(a.id)}</span>${stt ? pill(stt) : ""}<span>· ${esc(a.kind)}</span></div>${title(a)}${grid(a, u)}${secs(a)}`; },
  };

  function pickT(a) {
    const k = (a.kind || "").toLowerCase(), s = a.system || "";
    if (s === "GitHub") return T.gh;
    if (/alert rule/.test(k)) return T.grafana;
    if (/dashboard/.test(k)) return T.dash;
    if (/spreadsheet|budget model/.test(k)) return T.sheet;
    if (/email/.test(k)) return T.mail;
    if (/webhook/.test(k)) return T.api;
    if (/prototype/.test(k)) return T.frame;
    if (/board|blueprint/.test(k) || s === "Miro") return T.board;
    if (/release|deployment|platform action|pipeline run|contract deployment/.test(k) || /Kubernetes|Deployment|dbt|Ledger/.test(s)) return T.term;
    if (s === "ServiceNow") return T.sn;
    if (s === "Jira") return T.jira;
    if (s === "Confluence") return T.conf;
    if (/crm/i.test(s) || /campaign|task batch|catalogue/.test(k)) return T.crm;
    if (/document|board paper|plan|checklist|page|official record|knowledge/.test(k) || /Google Drive|Microsoft 365/.test(s)) return T.doc;
    return T.gen;
  }

  let dlg;
  function open(a) {
    if (!dlg) { dlg = document.createElement("dialog"); dlg.className = "af-dlg"; document.body.appendChild(dlg); dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); }
    const [letters, hue, dk] = app(a.system);
    let body; try { body = pickT(a)(a); } catch (e) { body = T.gen(a); }
    dlg.innerHTML = `<div class="af-bar"><span class="af-tile ${dk ? "dk" : ""}" style="--ah:${hue}">${esc(letters)}</span><b>${esc(a.system)}</b><span class="af-k">${esc(a.kind)} · ${esc(a.id)}</span><button class="af-x" aria-label="Close preview">×</button></div>
    <div class="af-body">${body}</div>
    <div class="af-note">Illustrative example created by the demo. In a live deployment this is the real record, page or file in ${esc(a.system)}, created through its own API with its workflow and audit intact — labelled, versioned and gated exactly as shown.</div>`;
    dlg.querySelector(".af-x").onclick = () => dlg.close();
    dlg.showModal();
  }
  function card(a, isNew) {
    const [letters, hue, dk] = app(a.system);
    const b = document.createElement("button"); b.type = "button"; b.className = "af-card" + (isNew ? " new" : "");
    b.innerHTML = `<span class="af-tile ${dk ? "dk" : ""}" style="--ah:${hue}">${esc(letters)}</span><span class="af-b"><span class="af-k">${esc(a.kind)} · ${esc(a.id)}</span><span class="af-t">${esc(a.title)}</span></span>`;
    b.setAttribute("aria-label", `Open ${a.kind} ${a.id}: ${a.title}`);
    b.onclick = () => open(a); return b;
  }
  function chip(a) { const b = document.createElement("button"); b.type = "button"; b.className = "af-chip"; b.textContent = `Open ${a.id}`; b.onclick = () => open(a); return b; }
  window.Artefacts = { card, chip, open };
})();
