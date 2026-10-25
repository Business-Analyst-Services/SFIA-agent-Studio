// Slack: mention @Pip in a channel or DM it. Replies go in thread; approvals get buttons.
import bolt from "@slack/bolt";
import { handle } from "../pip.js";
import { resolveApproval, type Notifier, type PendingAction } from "../approvals.js";

const { App } = bolt;

export async function startSlack() {
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
  });

  const notifierFor = (channel: string, thread_ts: string): Notifier => ({
    say: async text => { await app.client.chat.postMessage({ channel, thread_ts, text }); },
    askApproval: async (a: PendingAction) => {
      const text = `:raised_hand: The *${a.agentId}* agent wants to run \`${a.tool.name}\` (${a.tool.risk}).`;
      await app.client.chat.postMessage({
        channel, thread_ts, text,
        blocks: [
          { type: "section", text: { type: "mrkdwn", text: `${text}\n\`\`\`${JSON.stringify(a.input, null, 1).slice(0, 2500)}\`\`\`` } },
          { type: "actions", elements: [
            { type: "button", style: "primary", text: { type: "plain_text", text: "Approve" }, action_id: "pip_approve", value: a.id },
            { type: "button", style: "danger", text: { type: "plain_text", text: "Reject" }, action_id: "pip_reject", value: a.id },
          ] },
          { type: "context", elements: [{ type: "mrkdwn", text: `Approval id ${a.id}` }] },
        ],
      });
    },
  });

  async function respond(channel: string, ts: string, thread_ts: string | undefined, userId: string, text: string) {
    const thread = thread_ts ?? ts;
    const info = await app.client.users.info({ user: userId }).catch(() => null);
    const user = info?.user?.real_name ?? userId;
    const reply = await handle({ conversationId: `slack:${channel}:${thread}`, user, text: text.replace(/<@[A-Z0-9]+>/g, "").trim(), channel: "slack" }, notifierFor(channel, thread));
    await app.client.chat.postMessage({ channel, thread_ts: thread, text: reply });
  }

  app.event("app_mention", async ({ event }) => {
    await respond(event.channel, event.ts, event.thread_ts, event.user ?? "unknown", event.text);
  });
  app.message(async ({ message }) => {
    const m = message as { channel_type?: string; subtype?: string; bot_id?: string; channel: string; ts: string; thread_ts?: string; user?: string; text?: string };
    if (m.channel_type !== "im" || m.subtype || m.bot_id || !m.text) return;
    await respond(m.channel, m.ts, m.thread_ts, m.user ?? "unknown", m.text);
  });

  for (const [actionId, approved] of [["pip_approve", true], ["pip_reject", false]] as const) {
    app.action(actionId, async ({ ack, body, action, client }) => {
      await ack();
      const id = (action as { value?: string }).value ?? "";
      const result = await resolveApproval(id, approved, body.user.name ?? body.user.id);
      const b = body as { channel?: { id: string }; message?: { ts: string } };
      if (b.channel && b.message) await client.chat.update({ channel: b.channel.id, ts: b.message.ts, text: `${approved ? "Approved" : "Rejected"} by <@${body.user.id}>: ${result}`, blocks: [] });
    });
  }

  await app.start();
  console.log("Pip is listening on Slack (Socket Mode)");
}
