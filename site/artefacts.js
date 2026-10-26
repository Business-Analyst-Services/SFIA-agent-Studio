/* Shared artefact cards and preview dialog. Exposes window.Artefacts = { card(a), chip(a), open(a) }. */
(function () {
  const ICON = { Jira: "J", Confluence: "C", ServiceNow: "SN", GitHub: "GH", "Google Drive": "G", "Microsoft 365": "M", Grafana: "Gr", Kubernetes: "K8", Deployment: "▲", dbt: "dbt", Snowflake: "❄", "Identity provider": "ID" };
  const css = `
  .af-card{display:flex;gap:10px;align-items:flex-start;text-align:left;width:100%;font:inherit;color:inherit;background:var(--panel,#fff);border:1px solid var(--line,#d9e1df);border-radius:9px;padding:9px 11px;cursor:pointer}
  .af-card:hover{border-color:var(--accent,#0f6e64)}
  .af-card.new{animation:af-in .5s ease}
  @keyframes af-in{from{transform:translateY(6px);opacity:.3}}
  @media (prefers-reduced-motion:reduce){.af-card.new{animation:none}}
  .af-ic{flex:none;width:34px;height:34px;border-radius:7px;background:var(--accent-soft,#dcefeb);color:var(--accent,#0f6e64);display:grid;place-items:center;font:700 11px "IBM Plex Mono",ui-monospace,monospace}
  .af-b{min-width:0}
  .af-k{font:500 11px "IBM Plex Mono",ui-monospace,monospace;color:var(--muted,#5b6b68)}
  .af-t{font-weight:600;font-size:13.5px;line-height:1.35;display:block}
  .af-chip{display:inline-flex;align-items:center;gap:5px;font:600 12px "Public Sans",system-ui,sans-serif;color:var(--accent,#0f6e64);background:var(--accent-soft,#dcefeb);border:0;border-radius:999px;padding:3px 10px;cursor:pointer}
  .af-chip:hover{text-decoration:underline}
  dialog.af-dlg{border:1px solid var(--line,#d9e1df);border-radius:14px;padding:0;width:min(640px,calc(100vw - 32px));max-height:calc(100vh - 48px);background:var(--panel,#fff);color:var(--ink,#14211f);box-shadow:0 20px 60px rgba(0,0,0,.3)}
  dialog.af-dlg::backdrop{background:rgba(10,20,18,.45)}
  .af-h{display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border-bottom:1px solid var(--line,#d9e1df);position:sticky;top:0;background:var(--panel,#fff)}
  .af-h h3{margin:2px 0 0;font:700 19px/1.25 "Familjen Grotesk",system-ui,sans-serif}
  .af-x{margin-left:auto;border:0;background:none;color:var(--muted,#5b6b68);font-size:24px;line-height:1;cursor:pointer}
  .af-body{padding:14px 18px 20px;font-size:14px}
  .af-f{display:grid;grid-template-columns:minmax(110px,auto) 1fr;gap:4px 14px;margin:0 0 12px;font-size:13.5px}
  .af-f dt{color:var(--muted,#5b6b68)} .af-f dd{margin:0;font-weight:600}
  .af-s h4{font:700 14px "Familjen Grotesk",system-ui,sans-serif;margin:14px 0 4px}
  .af-s p{margin:0}.af-s ul{margin:0;padding-left:18px}.af-s li{margin:2px 0}
  .af-s table{border-collapse:collapse;width:100%;font-size:13.5px;font-variant-numeric:tabular-nums}
  .af-s td,.af-s th{border-bottom:1px solid var(--line,#d9e1df);padding:5px 8px;text-align:left}
  .af-s th{color:var(--muted,#5b6b68);font-weight:600}
  .af-note{margin-top:16px;font-size:12px;color:var(--muted,#5b6b68)}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const icon = (a) => ICON[a.system] || a.system.slice(0, 2);

  let dlg;
  function open(a) {
    if (!dlg) { dlg = document.createElement("dialog"); dlg.className = "af-dlg"; document.body.appendChild(dlg); dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); }
    const fields = a.fields ? `<dl class="af-f">${Object.entries(a.fields).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : "";
    const secs = (a.sections || []).map((s) => `<div class="af-s"><h4>${esc(s.h)}</h4>${s.text ? `<p>${esc(s.text)}</p>` : ""}${s.items ? `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}${s.table ? `<table>${s.table.map((r, i) => `<tr>${r.map((c) => i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`).join("")}</tr>`).join("")}</table>` : ""}</div>`).join("");
    dlg.innerHTML = `<div class="af-h"><span class="af-ic">${esc(icon(a))}</span><div><span class="af-k">${esc(a.kind)} · ${esc(a.system)} · ${esc(a.id)}</span><h3>${esc(a.title)}</h3></div><button class="af-x" aria-label="Close preview">×</button></div><div class="af-body">${fields}${secs}<p class="af-note">Illustrative example created by the demo. In a live deployment this is the real record, page or file in ${esc(a.system)}.</p></div>`;
    dlg.querySelector(".af-x").onclick = () => dlg.close();
    dlg.showModal();
  }
  function card(a, isNew) {
    const b = document.createElement("button"); b.type = "button"; b.className = "af-card" + (isNew ? " new" : "");
    b.innerHTML = `<span class="af-ic">${esc(icon(a))}</span><span class="af-b"><span class="af-k">${esc(a.kind)} · ${esc(a.id)}</span><span class="af-t">${esc(a.title)}</span></span>`;
    b.setAttribute("aria-label", `Open ${a.kind} ${a.id}: ${a.title}`);
    b.onclick = () => open(a); return b;
  }
  function chip(a) {
    const b = document.createElement("button"); b.type = "button"; b.className = "af-chip"; b.textContent = `Open ${a.id}`;
    b.onclick = () => open(a); return b;
  }
  window.Artefacts = { card, chip, open };
})();
