/* Site menu: primary pages at top, the rest in a More dropdown. Add <script src="nav.js" defer></script>. */
(function () {
  const primary = [["index.html", "Muster demo"], ["capability-map.html", "Capability map"]];
  const more = [["agents.html", "Role agents"], ["value-streams.html", "Value streams"], ["domains.html", "Domains"], ["integrate.html", "Integrate"]];
  const here = location.pathname.split("/").pop() || "index.html";
  const css = `.site-nav{position:sticky;top:0;z-index:40;background:var(--panel,#fff);border-bottom:1px solid var(--line,#d9e1df);
    padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));padding-top:env(safe-area-inset-top,0px)}
  .site-nav>div{max-width:1240px;margin:0 auto;display:flex;align-items:center;gap:2px;overflow-x:auto;scrollbar-width:none}
  .site-nav .gh{padding-right:0}
  .site-nav b{font:700 15px "Familjen Grotesk",system-ui,sans-serif;margin-right:14px;white-space:nowrap;color:var(--ink,#14211f)}
  .site-nav b a{color:inherit;text-decoration:none}
  .site-nav a.pg,.site-nav button.mre{font:600 13.5px "Public Sans",system-ui,sans-serif;color:var(--muted,#5b6b68);text-decoration:none;padding:13px 10px;border:0;background:none;border-bottom:2px solid transparent;white-space:nowrap;cursor:pointer}
  .site-nav a.pg:hover,.site-nav button.mre:hover{color:var(--ink,#14211f)}
  .site-nav a.pg[aria-current=page]{color:var(--ink,#14211f);border-bottom-color:var(--accent,#0f6e64)}
  .site-nav .gh{margin-left:auto}
  .mwrap{position:relative}
  .mre[aria-expanded=true]{color:var(--ink,#14211f)}
  .mmenu{position:absolute;top:calc(100% - 4px);left:0;min-width:190px;background:var(--panel,#fff);border:1px solid var(--line,#d9e1df);border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.18);padding:6px;display:none;z-index:50}
  .mmenu.open{display:block}
  .mmenu a{display:block;font:600 13.5px "Public Sans",system-ui,sans-serif;color:var(--ink,#14211f);text-decoration:none;padding:8px 11px;border-radius:7px}
  .mmenu a:hover{background:var(--accent-soft,#dcefeb)}
  .mmenu a[aria-current=page]{color:var(--accent,#0f6e64)}
  @media(max-width:560px){.site-nav a.pg[href="capability-map.html"]{display:none}}
  .site-nav :focus-visible{outline:2px solid var(--accent,#0f6e64);outline-offset:-2px}`;
  const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  const link = ([h, l], cls) => `<a class="${cls}" href="${h}"${h === here ? ' aria-current="page"' : ""}>${l}</a>`;
  const nav = document.createElement("nav");
  nav.className = "site-nav"; nav.setAttribute("aria-label", "Site");
  nav.innerHTML = `<div><b><a href="index.html">SFIA Agent Studio</a></b>${primary.map((p) => link(p, "pg")).join("")}
    <span class="mwrap"><button type="button" class="mre" aria-expanded="false" aria-haspopup="true">More ▾</button>
    <span class="mmenu" role="menu">${more.map((p) => link(p, "")).join("")}</span></span>
    <a class="pg gh" href="https://github.com/Business-Analyst-Services/SFIA-agent-Studio">GitHub</a></div>`;
  document.body.prepend(nav);
  const btn = nav.querySelector(".mre"), menu = nav.querySelector(".mmenu");
  const setOpen = (v) => { menu.classList.toggle("open", v); btn.setAttribute("aria-expanded", String(v)); };
  btn.onclick = () => setOpen(!menu.classList.contains("open"));
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  if (more.some(([h]) => h === here)) { btn.textContent = (more.find(([h]) => h === here) || [])[1] + " ▾"; btn.style.color = "var(--ink,#14211f)"; btn.style.borderBottom = "2px solid var(--accent,#0f6e64)"; }
})();
