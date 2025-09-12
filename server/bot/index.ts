import type { H3Event } from "h3";
import { Bot, Api, webhookCallback, BotError } from "grammy";
import { I18n } from "@grammyjs/i18n";
import { autoRetry } from "@grammyjs/auto-retry";
import { autoQuote } from "@roziscoding/grammy-autoquote";

import { disableLinkPreview, parseMode } from "./plugins/";
import { commands } from "./commands/";
import { h3 } from "./utils/";
import type { BotContext } from "./types.js";

export async function createBotWebhookHandler() {
  const config = useRuntimeConfig();

  const bot = new Bot<BotContext>(config.BOT_TOKEN, { botInfo: config.BOT_INFO });
  configureBotApi(bot.api);

  bot.chatType(["group", "supergroup"]).use(autoQuote());

  bot.use(await createBotI18n());

  bot
    .drop(async (ctx) => {
      const isGroup = ctx.hasChatType(["group", "supergroup"]);

      if (isGroup && ctx.chat.id !== config.TARGET_CHAT_ID) {
        await ctx.reply(ctx.t("message-error-not-target-chat"));
        return true;
      }

      if (isGroup && ctx.message?.message_thread_id !== config.TARGET_THREAD_ID) {
        return true;
      }

      return false;
    })
    .use(commands);

  const handleUpdate = webhookCallback(bot, h3, { secretToken: config.BOT_WEBHOOK_SECRET_TOKEN });
  return async (event: H3Event) => {
    try {
      return await handleUpdate(event);
    } catch (err) {
      if (err instanceof BotError) {
        const { error, ctx } = err;
        console.error(`Error while handling update ${ctx.update.update_id}`, error);

        try {
          await ctx.reply(ctx.t("message-error-unknown"));
        } catch (err) {
          console.error("Failed to send error message:", err);
        }
      } else console.error("Unknown error:", err);
    }
    return new Response(null, { status: 200 });
  };
}

export function createBotApi() {
  const config = useRuntimeConfig();

  const api = new Api(config.BOT_TOKEN);
  configureBotApi(api);

  return api;
}

function configureBotApi(api: Api) {
  api.config.use(autoRetry());
  api.config.use(parseMode("HTML"));
  api.config.use(disableLinkPreview());
}

export async function createBotI18n() {
  const storage = useStorage("assets:server");
  const decoder = new TextDecoder();

  const i18n = new I18n({ defaultLocale: "uk" });

  const uk = (await storage.getItem<Uint8Array>("locales/uk.ftl"))!;
  await i18n.fluent.addTranslation({ locales: ["uk"], source: decoder.decode(uk) });

  return i18n;
}

export type { Api as BotApi } from "grammy";
export type { I18n as BotI18n } from "@grammyjs/i18n";
