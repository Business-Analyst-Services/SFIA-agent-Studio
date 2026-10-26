/* Shared top menu for the SFIA Agent Studio site. Add <script src="nav.js" defer></script> to a page. */
(function () {
  const pages = [["index.html", "Role agents"], ["capability-map.html", "Capability map"], ["muster.html", "Muster demo"], ["integrate.html", "Integrate"]];
  const here = location.pathname.split("/").pop() || "index.html";
  const css = `.site-nav{position:sticky;top:0;z-index:20;background:var(--panel,#fff);border-bottom:1px solid var(--line,#d9e1df);
    padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));padding-top:env(safe-area-inset-top,0px)}
  .site-nav div{max-width:1280px;margin:0 auto;display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none}
  .site-nav b{font:700 15px "Familjen Grotesk",system-ui,sans-serif;margin-right:14px;white-space:nowrap;color:var(--ink,#14211f)}
  .site-nav a{font:600 13.5px "Public Sans",system-ui,sans-serif;color:var(--muted,#5b6b68);text-decoration:none;padding:13px 10px;border-bottom:2px solid transparent;white-space:nowrap}
  .site-nav a:hover{color:var(--ink,#14211f)}
  .site-nav a[aria-current=page]{color:var(--ink,#14211f);border-bottom-color:var(--accent,#0f6e64)}
  .site-nav .gh{margin-left:auto}`;
  const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  const nav = document.createElement("nav");
  nav.className = "site-nav"; nav.setAttribute("aria-label", "Site");
  nav.innerHTML = `<div><b>SFIA Agent Studio</b>${pages.map(([h, l]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ""}>${l}</a>`).join("")}<a class="gh" href="https://github.com/Business-Analyst-Services/SFIA-agent-Studio">GitHub</a></div>`;
  document.body.prepend(nav);
})();
