/* Site bar: brand + one "Background" menu holding every screen. <script src="nav.js" defer></script> */
(function () {
  const items = [["index.html", "Muster demo"], ["capability-map.html", "Capability map"], ["agents.html", "Role agents"], ["value-streams.html", "Value streams"], ["domains.html", "Domains"], ["integrate.html", "Integrate"], ["https://github.com/Business-Analyst-Services/SFIA-agent-Studio", "GitHub"]];
  const here = location.pathname.split("/").pop() || "index.html";
  const css = `.site-nav{position:sticky;top:0;z-index:100;background:var(--panel,#fff);border-bottom:1px solid var(--line,#d9e1df);
    padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));padding-top:env(safe-area-inset-top,0px)}
  .site-nav>div{max-width:1240px;margin:0 auto;display:flex;align-items:center;gap:14px}
  .site-nav b{font:700 15px "Familjen Grotesk",system-ui,sans-serif;white-space:nowrap;color:var(--ink,#14211f)}
  .site-nav b a{color:inherit;text-decoration:none}
  .site-nav .here{font:600 13px "Public Sans",system-ui,sans-serif;color:var(--muted,#5b6b68);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .site-nav .mwrapN{position:relative;margin-left:auto}
  .site-nav .mre{font:600 13.5px "Public Sans",system-ui,sans-serif;color:var(--ink,#14211f);border:1px solid var(--line,#d9e1df);background:none;border-radius:8px;padding:7px 13px;margin:8px 0;cursor:pointer}
  .site-nav .mre[aria-expanded=true],.site-nav .mre:hover{border-color:var(--accent,#0f6e64);color:var(--accent,#0f6e64)}
  .mmenu{position:absolute;top:calc(100% + 2px);right:0;min-width:210px;background:var(--panel,#fff);border:1px solid var(--line,#d9e1df);border-radius:12px;box-shadow:0 16px 44px rgba(0,0,0,.25);padding:6px;display:none;z-index:110}
  .mmenu.open{display:block}
  .mmenu a{display:block;font:600 13.5px "Public Sans",system-ui,sans-serif;color:var(--ink,#14211f);text-decoration:none;padding:9px 12px;border-radius:8px}
  .mmenu a:hover{background:var(--accent-soft,#dcefeb)}
  .mmenu a[aria-current=page]{color:var(--accent,#0f6e64)}
  .mmenu a[aria-current=page]::after{content:" ✓"}
  .site-nav :focus-visible{outline:2px solid var(--accent,#0f6e64);outline-offset:-2px}`;
  const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  const nav = document.createElement("nav");
  nav.className = "site-nav"; nav.setAttribute("aria-label", "Site");
  nav.innerHTML = `<div><b><a href="index.html">SFIA Agent Studio</a></b><span class="here">${(items.find(([h]) => h === here) || ["", ""])[1]}</span>
    <span class="mwrapN"><button type="button" class="mre" aria-expanded="false" aria-haspopup="true">Background ▾</button>
    <span class="mmenu" role="menu">${items.map(([h, l]) => `<a role="menuitem" href="${h}"${h === here ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</span></span></div>`;
  document.body.prepend(nav);
  const btn = nav.querySelector(".mre"), menu = nav.querySelector(".mmenu");
  const setOpen = (v) => { menu.classList.toggle("open", v); btn.setAttribute("aria-expanded", String(v)); };
  btn.onclick = () => setOpen(!menu.classList.contains("open"));
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
})();
