/* Muster web widget. Embed on any page:
   <script src="https://YOUR-MUSTER-HOST/muster.js" data-api="https://YOUR-MUSTER-HOST" data-token="MUSTER_WEB_TOKEN" data-user="Jane Citizen" defer></script> */
(function () {
  const me = document.currentScript;
  const API = (me && me.dataset.api) || location.origin;
  const TOKEN = (me && me.dataset.token) || "";
  const USER = (me && me.dataset.user) || "web user";
  let convo = "";
  try { convo = sessionStorage.getItem("muster-convo") || ""; } catch (e) {}
  if (!convo) { convo = "web-" + Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem("muster-convo", convo); } catch (e) {} }

  const css = `
  .muster-root{--muster-bg:#fff;--muster-ink:#14211f;--muster-muted:#5b6b68;--muster-line:#d9e1df;--muster-accent:#0f6e64;--muster-me:#dcefeb;--muster-warn:#fbecd9;
    position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:2147483000;font:14px/1.45 "Public Sans",system-ui,sans-serif;color:var(--muster-ink)}
  @media (prefers-color-scheme:dark){.muster-root{--muster-bg:#152120;--muster-ink:#e3ecea;--muster-muted:#93a6a2;--muster-line:#273634;--muster-accent:#5cc9b8;--muster-me:#183a35;--muster-warn:#3a2a16}}
  .muster-btn{width:84px;height:84px;border:0;background:none;cursor:pointer;padding:0;display:block;margin-left:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.18))}
  .muster-btn:focus-visible{outline:3px solid var(--muster-accent);outline-offset:4px;border-radius:50%}
  .muster-btn svg{width:100%;height:100%;animation:muster-bob 3.2s ease-in-out infinite}
  .muster-btn:hover svg{animation:muster-hop .5s ease}
  .muster-eye{animation:muster-blink 5s infinite;transform-origin:center;transform-box:fill-box}
  @keyframes muster-bob{50%{transform:translateY(-5px)}}
  @keyframes muster-hop{40%{transform:translateY(-14px) rotate(-6deg)}}
  @keyframes muster-blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
  @media (prefers-reduced-motion:reduce){.muster-btn svg,.muster-eye{animation:none}}
  .muster-tip{position:absolute;right:70px;bottom:70px;width:220px;background:var(--muster-bg);border:1px solid var(--muster-line);border-radius:12px 12px 2px 12px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.14)}
  .muster-tip button{font:inherit;font-size:12px;border:0;background:none;color:var(--muster-accent);cursor:pointer;padding:4px 6px 0 0}
  .muster-panel{position:absolute;right:0;bottom:96px;width:min(380px,calc(100vw - 36px));height:min(560px,calc(100vh - 140px));background:var(--muster-bg);border:1px solid var(--muster-line);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden}
  .muster-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--muster-line)}
  .muster-head b{font:700 16px "Familjen Grotesk",system-ui,sans-serif}
  .muster-head span{font-size:12px;color:var(--muster-muted)}
  .muster-head button{margin-left:auto;border:0;background:none;color:var(--muster-muted);font-size:20px;cursor:pointer;line-height:1}
  .muster-log{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
  .muster-msg{max-width:88%;padding:8px 11px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
  .muster-msg.muster{background:transparent;border:1px solid var(--muster-line);border-bottom-left-radius:3px}
  .muster-msg.me{align-self:flex-end;background:var(--muster-me);border-bottom-right-radius:3px}
  .muster-msg.ap{background:var(--muster-warn);border:1px solid var(--muster-line)}
  .muster-msg.ap div{display:flex;gap:6px;margin-top:6px}
  .muster-msg.ap button{font-weight:600;font-size:12px;font-family:inherit;border-radius:6px;padding:4px 10px;cursor:pointer;border:1px solid var(--muster-accent)}
  .muster-ok{background:var(--muster-accent);color:var(--muster-bg)}.muster-no{background:none;color:var(--muster-accent)}
  .muster-typing{color:var(--muster-muted);font-size:12px}
  .muster-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}
  .muster-chips button{font:inherit;font-size:12px;border:1px solid var(--muster-line);background:none;color:var(--muster-ink);border-radius:999px;padding:4px 10px;cursor:pointer}
  .muster-form{display:flex;gap:6px;padding:10px;border-top:1px solid var(--muster-line)}
  .muster-form textarea{flex:1;resize:none;font:inherit;border:1px solid var(--muster-line);border-radius:8px;padding:8px;background:var(--muster-bg);color:var(--muster-ink);min-height:40px;max-height:120px}
  .muster-form button{border:0;background:var(--muster-accent);color:var(--muster-bg);font-weight:600;font-size:13px;font-family:inherit;border-radius:8px;padding:0 14px;cursor:pointer}`;

  const face = (size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs><radialGradient id="musterg" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#d9733d"/><stop offset="1" stop-color="#a84a22"/></radialGradient></defs>
    <path d="M24 46 L18 6 L44 30 Z" fill="#9c4320" stroke="#7a3216" stroke-width="2" stroke-linejoin="round"/>
    <path d="M76 46 L82 6 L56 30 Z" fill="#9c4320" stroke="#7a3216" stroke-width="2" stroke-linejoin="round"/>
    <path d="M26 38 L22 15 L38 31 Z" fill="#e9a37a"/><path d="M74 38 L78 15 L62 31 Z" fill="#e9a37a"/>
    <path d="M50 24 C72 24 82 40 81 56 C80 74 66 86 50 86 C34 86 20 74 19 56 C18 40 28 24 50 24Z" fill="url(#musterg)" stroke="#7a3216" stroke-width="2"/>
    <path d="M50 52 C62 52 70 60 69 70 C68 80 60 85 50 85 C40 85 32 80 31 70 C30 60 38 52 50 52Z" fill="#f0b98c"/>
    <ellipse class="muster-eye" cx="38" cy="47" rx="5" ry="6.5" fill="#1d2b29"/><ellipse class="muster-eye" cx="62" cy="47" rx="5" ry="6.5" fill="#1d2b29"/>
    <circle cx="39.5" cy="44.5" r="1.8" fill="#fff"/><circle cx="63.5" cy="44.5" r="1.8" fill="#fff"/>
    <path d="M44 60 C44 56 56 56 56 60 C56 64 52 66 50 66 C48 66 44 64 44 60Z" fill="#1d2b29"/>
    <path d="M50 66 L50 70 M42 71 Q50 77 58 71" fill="none" stroke="#1d2b29" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M47 73 Q50 81 53 73 Z" fill="#e8687a"/>
    <path d="M28 84 Q50 94 72 84 L74 90 Q50 100 26 90 Z" fill="#0f6e64"/><circle cx="50" cy="94" r="4" fill="#f2c14e" stroke="#c99a2a"/></svg>`;

  const root = document.createElement("div");
  root.className = "muster-root";
  root.innerHTML = `<style>${css}</style>
    <div class="muster-tip" hidden><div class="muster-tip-text"></div><button data-a="open">Sure, let's go</button><button data-a="later">Not now</button></div>
    <section class="muster-panel" hidden aria-label="Chat with Muster">
      <div class="muster-head">${face(34)}<div><b>Muster</b><br><span>Rounds up 75 SFIA IT experts</span></div><button aria-label="Close chat">×</button></div>
      <div class="muster-log" aria-live="polite"></div>
      <div class="muster-chips"></div>
      <form class="muster-form"><textarea id="muster-input" rows="1" placeholder="Ask Muster anything about IT…" aria-label="Message Muster"></textarea><button type="submit">Send</button></form>
    </section>
    <button class="muster-btn" aria-label="Open Muster, your IT helper">${face(84)}</button>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const log = $(".muster-log"), panel = $(".muster-panel"), tip = $(".muster-tip"), input = $("#muster-input");
  const headers = { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}) };

  function add(text, who, approvalId) {
    const d = document.createElement("div");
    d.className = "muster-msg " + who;
    d.textContent = text;
    if (approvalId) {
      const row = document.createElement("div");
      for (const [label, ok] of [["Approve", true], ["Reject", false]]) {
        const b = document.createElement("button");
        b.textContent = label; b.className = ok ? "muster-ok" : "muster-no";
        b.onclick = async () => {
          row.remove();
          const r = await fetch(API + "/api/approvals/" + approvalId, { method: "POST", headers, body: JSON.stringify({ approved: ok, approver: USER }) }).then(r => r.json()).catch(() => ({ result: "Couldn't reach Muster." }));
          add(r.result, "muster"); poll();
        };
        row.appendChild(b);
      }
      d.appendChild(row);
    }
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  const showEvents = (evs) => (evs || []).forEach(e => add(e.text, e.type === "approval" ? "ap" : "muster", e.approvalId));

  async function send(text) {
    if (!text.trim()) return;
    add(text, "me"); input.value = "";
    const t = document.createElement("div"); t.className = "muster-typing"; t.textContent = "Muster is rounding up the crew…"; log.appendChild(t);
    try {
      const r = await fetch(API + "/api/chat", { method: "POST", headers, body: JSON.stringify({ conversationId: convo, user: USER, text }) });
      const j = await r.json();
      t.remove();
      if (!r.ok) return add(j.error || "Something went wrong.", "muster");
      showEvents(j.events); add(j.reply, "muster");
    } catch (e) { t.remove(); add("I can't reach my server right now. Check the connection and try again.", "muster"); }
  }
  async function poll() {
    try { const j = await fetch(API + "/api/events?conversationId=" + convo, { headers }).then(r => r.json()); showEvents(j.events); } catch (e) {}
  }

  const SUGGEST = ["Our student portal is down", "Scope a new CRM for the legal team", "Are we ready for the cyber audit?", "Build a business case for cloud backup"];
  $(".muster-chips").innerHTML = SUGGEST.map(s => `<button type="button">${s}</button>`).join("");
  $(".muster-chips").onclick = (e) => { if (e.target.tagName === "BUTTON") send(e.target.textContent); };

  const open = () => { panel.hidden = false; tip.hidden = true; if (!log.children.length) add("G'day, I'm Muster! Tell me what you need and I'll round up the right IT crew for it.", "muster"); input.focus(); };
  $(".muster-btn").onclick = () => (panel.hidden ? open() : (panel.hidden = true));
  $(".muster-head button").onclick = () => (panel.hidden = true);
  $(".muster-form").onsubmit = (e) => { e.preventDefault(); send(input.value); };
  input.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } };
  tip.onclick = (e) => {
    const a = e.target.dataset && e.target.dataset.a;
    if (a === "open") open();
    if (a === "later") { tip.hidden = true; try { sessionStorage.setItem("muster-quiet", "1"); } catch (e) {} }
  };

  // One gentle nudge per session, never repeated after "Not now".
  let quiet = false; try { quiet = sessionStorage.getItem("muster-quiet") === "1"; } catch (e) {}
  if (!quiet) setTimeout(() => {
    if (!panel.hidden) return;
    const hints = { "/incident": "Looks like an incident page. Want me to get Service Operations on it?", "/project": "Starting a project? I can bring in Business Analysis and Solution Architecture." };
    const k = Object.keys(hints).find(p => location.pathname.includes(p));
    $(".muster-tip-text").textContent = k ? hints[k] : "Stuck on something IT? I can muster 75 experts.";
    tip.hidden = false;
  }, 8000);
  setInterval(() => { if (!panel.hidden) poll(); }, 5000);
})();
