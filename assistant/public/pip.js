/* Pip web widget. Embed on any page:
   <script src="https://YOUR-PIP-HOST/pip.js" data-api="https://YOUR-PIP-HOST" data-token="PIP_WEB_TOKEN" data-user="Jane Citizen" defer></script> */
(function () {
  const me = document.currentScript;
  const API = (me && me.dataset.api) || location.origin;
  const TOKEN = (me && me.dataset.token) || "";
  const USER = (me && me.dataset.user) || "web user";
  let convo = "";
  try { convo = sessionStorage.getItem("pip-convo") || ""; } catch (e) {}
  if (!convo) { convo = "web-" + Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem("pip-convo", convo); } catch (e) {} }

  const css = `
  .pip-root{--pip-bg:#fff;--pip-ink:#14211f;--pip-muted:#5b6b68;--pip-line:#d9e1df;--pip-accent:#0f6e64;--pip-me:#dcefeb;--pip-warn:#fbecd9;
    position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:2147483000;font:14px/1.45 "Public Sans",system-ui,sans-serif;color:var(--pip-ink)}
  @media (prefers-color-scheme:dark){.pip-root{--pip-bg:#152120;--pip-ink:#e3ecea;--pip-muted:#93a6a2;--pip-line:#273634;--pip-accent:#5cc9b8;--pip-me:#183a35;--pip-warn:#3a2a16}}
  .pip-btn{width:84px;height:84px;border:0;background:none;cursor:pointer;padding:0;display:block;margin-left:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.18))}
  .pip-btn:focus-visible{outline:3px solid var(--pip-accent);outline-offset:4px;border-radius:50%}
  .pip-btn svg{width:100%;height:100%;animation:pip-bob 3.2s ease-in-out infinite}
  .pip-btn:hover svg{animation:pip-hop .5s ease}
  .pip-eye{animation:pip-blink 5s infinite;transform-origin:center;transform-box:fill-box}
  @keyframes pip-bob{50%{transform:translateY(-5px)}}
  @keyframes pip-hop{40%{transform:translateY(-14px) rotate(-6deg)}}
  @keyframes pip-blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
  @media (prefers-reduced-motion:reduce){.pip-btn svg,.pip-eye{animation:none}}
  .pip-tip{position:absolute;right:70px;bottom:70px;width:220px;background:var(--pip-bg);border:1px solid var(--pip-line);border-radius:12px 12px 2px 12px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.14)}
  .pip-tip button{font:inherit;font-size:12px;border:0;background:none;color:var(--pip-accent);cursor:pointer;padding:4px 6px 0 0}
  .pip-panel{position:absolute;right:0;bottom:96px;width:min(380px,calc(100vw - 36px));height:min(560px,calc(100vh - 140px));background:var(--pip-bg);border:1px solid var(--pip-line);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden}
  .pip-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--pip-line)}
  .pip-head b{font:700 16px "Familjen Grotesk",system-ui,sans-serif}
  .pip-head span{font-size:12px;color:var(--pip-muted)}
  .pip-head button{margin-left:auto;border:0;background:none;color:var(--pip-muted);font-size:20px;cursor:pointer;line-height:1}
  .pip-log{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
  .pip-msg{max-width:88%;padding:8px 11px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
  .pip-msg.pip{background:transparent;border:1px solid var(--pip-line);border-bottom-left-radius:3px}
  .pip-msg.me{align-self:flex-end;background:var(--pip-me);border-bottom-right-radius:3px}
  .pip-msg.ap{background:var(--pip-warn);border:1px solid var(--pip-line)}
  .pip-msg.ap div{display:flex;gap:6px;margin-top:6px}
  .pip-msg.ap button{font-weight:600;font-size:12px;font-family:inherit;border-radius:6px;padding:4px 10px;cursor:pointer;border:1px solid var(--pip-accent)}
  .pip-ok{background:var(--pip-accent);color:var(--pip-bg)}.pip-no{background:none;color:var(--pip-accent)}
  .pip-typing{color:var(--pip-muted);font-size:12px}
  .pip-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}
  .pip-chips button{font:inherit;font-size:12px;border:1px solid var(--pip-line);background:none;color:var(--pip-ink);border-radius:999px;padding:4px 10px;cursor:pointer}
  .pip-form{display:flex;gap:6px;padding:10px;border-top:1px solid var(--pip-line)}
  .pip-form textarea{flex:1;resize:none;font:inherit;border:1px solid var(--pip-line);border-radius:8px;padding:8px;background:var(--pip-bg);color:var(--pip-ink);min-height:40px;max-height:120px}
  .pip-form button{border:0;background:var(--pip-accent);color:var(--pip-bg);font-weight:600;font-size:13px;font-family:inherit;border-radius:8px;padding:0 14px;cursor:pointer}`;

  const face = (size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs><radialGradient id="pipg" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".55" stop-color="#ffc14d"/><stop offset="1" stop-color="#f08a24"/></radialGradient></defs>
    <path d="M50 4 C56 18 62 20 74 14 C70 27 74 32 88 34 C78 43 78 49 90 58 C76 60 72 65 76 79 C63 74 57 77 52 92 C46 78 40 76 27 82 C30 68 26 62 12 60 C23 51 23 45 11 36 C26 34 30 29 26 15 C38 21 44 18 50 4Z" fill="url(#pipg)" stroke="#d9701a" stroke-width="2" stroke-linejoin="round"/>
    <ellipse class="pip-eye" cx="40" cy="47" rx="6" ry="8" fill="#1d2b29"/><ellipse class="pip-eye" cx="61" cy="47" rx="6" ry="8" fill="#1d2b29"/>
    <circle cx="42" cy="44" r="2" fill="#fff"/><circle cx="63" cy="44" r="2" fill="#fff"/>
    <ellipse cx="31" cy="59" rx="5" ry="3" fill="#ff8a6b" opacity=".6"/><ellipse cx="70" cy="59" rx="5" ry="3" fill="#ff8a6b" opacity=".6"/>
    <path d="M42 61 Q50 69 59 61" fill="none" stroke="#1d2b29" stroke-width="3" stroke-linecap="round"/></svg>`;

  const root = document.createElement("div");
  root.className = "pip-root";
  root.innerHTML = `<style>${css}</style>
    <div class="pip-tip" hidden><div class="pip-tip-text"></div><button data-a="open">Sure, let's go</button><button data-a="later">Not now</button></div>
    <section class="pip-panel" hidden aria-label="Chat with Pip">
      <div class="pip-head">${face(34)}<div><b>Pip</b><br><span>75 SFIA IT experts on call</span></div><button aria-label="Close chat">×</button></div>
      <div class="pip-log" aria-live="polite"></div>
      <div class="pip-chips"></div>
      <form class="pip-form"><textarea id="pip-input" rows="1" placeholder="Ask Pip anything about IT…" aria-label="Message Pip"></textarea><button type="submit">Send</button></form>
    </section>
    <button class="pip-btn" aria-label="Open Pip, your IT helper">${face(84)}</button>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const log = $(".pip-log"), panel = $(".pip-panel"), tip = $(".pip-tip"), input = $("#pip-input");
  const headers = { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}) };

  function add(text, who, approvalId) {
    const d = document.createElement("div");
    d.className = "pip-msg " + who;
    d.textContent = text;
    if (approvalId) {
      const row = document.createElement("div");
      for (const [label, ok] of [["Approve", true], ["Reject", false]]) {
        const b = document.createElement("button");
        b.textContent = label; b.className = ok ? "pip-ok" : "pip-no";
        b.onclick = async () => {
          row.remove();
          const r = await fetch(API + "/api/approvals/" + approvalId, { method: "POST", headers, body: JSON.stringify({ approved: ok, approver: USER }) }).then(r => r.json()).catch(() => ({ result: "Couldn't reach Pip." }));
          add(r.result, "pip"); poll();
        };
        row.appendChild(b);
      }
      d.appendChild(row);
    }
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  const showEvents = (evs) => (evs || []).forEach(e => add(e.text, e.type === "approval" ? "ap" : "pip", e.approvalId));

  async function send(text) {
    if (!text.trim()) return;
    add(text, "me"); input.value = "";
    const t = document.createElement("div"); t.className = "pip-typing"; t.textContent = "Pip is rounding up the experts…"; log.appendChild(t);
    try {
      const r = await fetch(API + "/api/chat", { method: "POST", headers, body: JSON.stringify({ conversationId: convo, user: USER, text }) });
      const j = await r.json();
      t.remove();
      if (!r.ok) return add(j.error || "Something went wrong.", "pip");
      showEvents(j.events); add(j.reply, "pip");
    } catch (e) { t.remove(); add("I can't reach my server right now. Check the connection and try again.", "pip"); }
  }
  async function poll() {
    try { const j = await fetch(API + "/api/events?conversationId=" + convo, { headers }).then(r => r.json()); showEvents(j.events); } catch (e) {}
  }

  const SUGGEST = ["Our student portal is down", "Scope a new CRM for Faculty of Law", "Are we ready for the cyber audit?", "Build a business case for cloud backup"];
  $(".pip-chips").innerHTML = SUGGEST.map(s => `<button type="button">${s}</button>`).join("");
  $(".pip-chips").onclick = (e) => { if (e.target.tagName === "BUTTON") send(e.target.textContent); };

  const open = () => { panel.hidden = false; tip.hidden = true; if (!log.children.length) add("Hi, I'm Pip! Ooh, what are we fixing today? Tell me what you need and I'll call in the right IT expert.", "pip"); input.focus(); };
  $(".pip-btn").onclick = () => (panel.hidden ? open() : (panel.hidden = true));
  $(".pip-head button").onclick = () => (panel.hidden = true);
  $(".pip-form").onsubmit = (e) => { e.preventDefault(); send(input.value); };
  input.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } };
  tip.onclick = (e) => {
    const a = e.target.dataset && e.target.dataset.a;
    if (a === "open") open();
    if (a === "later") { tip.hidden = true; try { sessionStorage.setItem("pip-quiet", "1"); } catch (e) {} }
  };

  // One gentle nudge per session, never repeated after "Not now".
  let quiet = false; try { quiet = sessionStorage.getItem("pip-quiet") === "1"; } catch (e) {}
  if (!quiet) setTimeout(() => {
    if (!panel.hidden) return;
    const hints = { "/incident": "Ooh, looks like an incident page. Want me to get Service Operations on it?", "/project": "Starting a project? I can bring in Business Analysis and Solution Architecture." };
    const k = Object.keys(hints).find(p => location.pathname.includes(p));
    $(".pip-tip-text").textContent = k ? hints[k] : "Psst! Stuck on something IT? I know 75 experts.";
    tip.hidden = false;
  }, 8000);
  setInterval(() => { if (!panel.hidden) poll(); }, 5000);
})();
