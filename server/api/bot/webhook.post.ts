import { createBotWebhookHandler } from "~~/server/bot/";

export default defineLazyEventHandler(async () => {
  const handleUpdate = await createBotWebhookHandler();
  return defineEventHandler(handleUpdate);
});
