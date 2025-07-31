import { Composer } from "grammy";
import type { BotContext } from "../types.js";

const composer = new Composer<BotContext>();

composer.command("start", async (ctx) => {
  await ctx.api.setMyCommands(
    [
      { command: "start", description: ctx.t("command-start") },
      { command: "about", description: ctx.t("command-about") },
      { command: "help", description: ctx.t("command-help") },
    ],
    { scope: { type: "chat", chat_id: ctx.chat.id } },
  );

  if (ctx.hasChatType("private")) {
    const config = useRuntimeConfig();

    await ctx.setChatMenuButton({
      chat_id: ctx.chat.id,
      menu_button: {
        type: "web_app",
        text: ctx.t("menu-button-label"),
        web_app: { url: config.BOT_WEB_APP_URL },
      },
    });
    await ctx.reply(ctx.t("private-message-welcome"));
  } else {
    await ctx.reply(ctx.t("group-message-welcome"));
  }
});

composer.command("about", (ctx) => ctx.reply(ctx.t("message-about")));

composer.command("help", (ctx) => ctx.reply(ctx.t("message-help")));

export { composer as commonCommands };
