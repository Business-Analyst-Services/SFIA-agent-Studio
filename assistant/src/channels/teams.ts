// Microsoft Teams via Azure Bot Service. Messages arrive at POST /api/messages; approvals use Adaptive Cards.
import {
  CloudAdapter, ConfigurationBotFrameworkAuthentication, ActivityHandler, CardFactory, TurnContext,
  type ConversationReference,
} from "botbuilder";
import type { Express } from "express";
import { handle } from "../muster.js";
import { resolveApproval, type Notifier, type PendingAction } from "../approvals.js";

export function mountTeams(app: Express) {
  const auth = new ConfigurationBotFrameworkAuthentication(process.env as Record<string, string>);
  const adapter = new CloudAdapter(auth);
  const appId = process.env.MICROSOFT_APP_ID!;
  adapter.onTurnError = async (ctx, err) => { console.error(err); await ctx.sendActivity("Oops, something went wrong on my side. Try again in a moment."); };

  // Send to a conversation later (after approvals finish, or while agents work).
  const proactive = (ref: Partial<ConversationReference>) => (fn: (ctx: TurnContext) => Promise<void>) =>
    adapter.continueConversationAsync(appId, ref, fn);

  const notifierFor = (ref: Partial<ConversationReference>): Notifier => {
    const send = proactive(ref);
    return {
      say: text => send(async ctx => { await ctx.sendActivity(text); }),
      askApproval: (a: PendingAction) => send(async ctx => {
        await ctx.sendActivity({ attachments: [CardFactory.adaptiveCard({
          type: "AdaptiveCard", version: "1.5",
          body: [
            { type: "TextBlock", weight: "Bolder", text: `The ${a.agentId} agent wants to run ${a.tool.name}`, wrap: true },
            { type: "TextBlock", text: `Risk: ${a.tool.risk} · Approval id ${a.id}`, isSubtle: true, wrap: true },
            { type: "TextBlock", text: JSON.stringify(a.input).slice(0, 800), fontType: "Monospace", wrap: true },
          ],
          actions: [
            { type: "Action.Submit", title: "Approve", style: "positive", data: { musterAction: "approve", id: a.id } },
            { type: "Action.Submit", title: "Reject", style: "destructive", data: { musterAction: "reject", id: a.id } },
          ],
        })] });
      }),
    };
  };

  const bot = new ActivityHandler();
  bot.onMessage(async (ctx, next) => {
    const ref = TurnContext.getConversationReference(ctx.activity);
    const user = ctx.activity.from?.name ?? "Teams user";
    const value = ctx.activity.value as { musterAction?: string; id?: string } | undefined;
    if (value?.musterAction && value.id) {
      await ctx.sendActivity(await resolveApproval(value.id, value.musterAction === "approve", user));
      return next();
    }
    const text = TurnContext.removeRecipientMention(ctx.activity)?.trim() ?? ctx.activity.text ?? "";
    await ctx.sendActivities([{ type: "typing" }]);
    const reply = await handle({ conversationId: `teams:${ref.conversation?.id}`, user, text, channel: "teams" }, notifierFor(ref));
    await ctx.sendActivity(reply);
    await next();
  });
  bot.onMembersAdded(async (ctx, next) => {
    if (ctx.activity.membersAdded?.some(m => m.id !== ctx.activity.recipient.id))
      await ctx.sendActivity("G'day, I'm Muster! Tell me what you need and I'll round up the right IT crew for it.");
    await next();
  });

  app.post("/api/messages", async (req, res) => { await adapter.process(req, res, ctx => bot.run(ctx)); });
  console.log("Muster is listening on Teams at /api/messages");
}
