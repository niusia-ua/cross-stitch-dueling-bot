import { webhookCallback } from "grammy";

import { h3 } from "~~/server/utils/grammy-adapter.js";
import { setupBot } from "~~/server/bot/index.js";

export default defineLazyEventHandler(async () => {
  const config = useRuntimeConfig();

  const bot = await setupBot();
  const callback = webhookCallback(bot, h3, { secretToken: config.BOT_WEBHOOK_SECRET_TOKEN });

  return defineEventHandler(callback);
});
