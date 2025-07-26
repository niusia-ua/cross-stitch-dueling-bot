import { validateWebAppData } from "@grammyjs/validator";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);

  const initData = new URLSearchParams(getQuery(event));
  return { valid: validateWebAppData(config.BOT_TOKEN, initData) };
});
