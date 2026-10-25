// Gmail: Pip watches a label, answers each new thread, and writes a draft reply (or sends, if allowed).
import { google, type gmail_v1 } from "googleapis";
import { handle } from "../pip.js";
import type { Notifier, PendingAction } from "../approvals.js";

const header = (m: gmail_v1.Schema$Message, name: string) => m.payload?.headers?.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

function bodyText(p?: gmail_v1.Schema$MessagePart): string {
  if (!p) return "";
  if (p.mimeType === "text/plain" && p.body?.data) return Buffer.from(p.body.data, "base64url").toString("utf8");
  for (const part of p.parts ?? []) { const t = bodyText(part); if (t) return t; }
  return "";
}
// Drop quoted history so Pip only reads the newest message.
const latest = (t: string) => t.split(/\r?\n(?:On .+wrote:|>)/)[0].trim().slice(0, 8000);

export async function startGmail() {
  const auth = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  const gmail = google.gmail({ version: "v1", auth });
  const label = process.env.GMAIL_WATCH_LABEL ?? "Ask-Pip";
  const mode = process.env.GMAIL_REPLY_MODE === "send" ? "send" : "draft";
  const me = (await gmail.users.getProfile({ userId: "me" })).data.emailAddress ?? "";

  async function reply(orig: gmail_v1.Schema$Message, text: string) {
    const subject = header(orig, "Subject");
    const raw = Buffer.from([
      `To: ${header(orig, "Reply-To") || header(orig, "From")}`,
      `Subject: ${/^re:/i.test(subject) ? subject : `Re: ${subject}`}`,
      `In-Reply-To: ${header(orig, "Message-ID")}`,
      `References: ${[header(orig, "References"), header(orig, "Message-ID")].filter(Boolean).join(" ")}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      text,
    ].join("\r\n")).toString("base64url");
    const message = { raw, threadId: orig.threadId };
    if (mode === "send") await gmail.users.messages.send({ userId: "me", requestBody: message });
    else await gmail.users.drafts.create({ userId: "me", requestBody: { message } });
  }

  const notifierFor = (orig: gmail_v1.Schema$Message): Notifier => ({
    say: text => reply(orig, text),
    askApproval: (a: PendingAction) => reply(orig,
      `The ${a.agentId} agent wants to run ${a.tool.name} (${a.tool.risk}).\n\nInput: ${JSON.stringify(a.input).slice(0, 800)}\n\nReply "approve ${a.id}" or "reject ${a.id}".`),
  });

  async function poll() {
    try {
      const list = await gmail.users.messages.list({ userId: "me", q: `label:${label} is:unread -from:${me}`, maxResults: 10 });
      for (const { id } of list.data.messages ?? []) {
        const { data: m } = await gmail.users.messages.get({ userId: "me", id: id!, format: "full" });
        await gmail.users.messages.modify({ userId: "me", id: id!, requestBody: { removeLabelIds: ["UNREAD"] } });
        const text = `Subject: ${header(m, "Subject")}\n\n${latest(bodyText(m.payload))}`;
        const answer = await handle({ conversationId: `gmail:${m.threadId}`, user: header(m, "From"), text, channel: "gmail" }, notifierFor(m));
        await reply(m, `${answer}\n\n— Pip, your IT helper`);
      }
    } catch (e) { console.error("Gmail poll failed:", e instanceof Error ? e.message : e); }
  }
  await poll();
  setInterval(poll, Number(process.env.GMAIL_POLL_SECONDS ?? 60) * 1000);
  console.log(`Pip is watching Gmail label "${label}" (${mode} mode)`);
}
