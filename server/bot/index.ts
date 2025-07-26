import { Bot } from "grammy";
import type { UserFromGetMe } from "grammy/types";
import { I18n } from "@grammyjs/i18n";

import type { BotContext } from "./types.js";

export async function setupBot() {
  const config = useRuntimeConfig();

  const bot = new Bot<BotContext>(config.BOT_TOKEN, { botInfo: config.BOT_INFO as unknown as UserFromGetMe });

  bot.use(await setupI18n());

  bot.command("start", async (ctx) => {
    await ctx.setChatMenuButton({
      chat_id: ctx.chat.id,
      menu_button: {
        type: "web_app",
        text: "Menu",
        web_app: { url: config.BOT_WEB_APP_URL },
      },
    });
    await ctx.reply(ctx.t("message-welcome"));
  });

  return bot;
}

async function setupI18n() {
  const storage = useStorage("assets:server");

  const i18n = new I18n({ defaultLocale: "uk" });

  const uk = (await storage.getItem("locales/uk.ftl")) as string;
  await i18n.fluent.addTranslation({ locales: ["uk"], source: uk });

  return i18n;
}
