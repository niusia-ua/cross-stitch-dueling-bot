import { createBotApi, createBotI18n } from "../bot/";
import { createDbPool, createSqlTag } from "../database/";
import { createDiContainer, type AwilixContainer, type Cradle } from "../di.js";

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig();

  const db = await createDbPool(config.databaseUrl);
  const sql = createSqlTag();

  const botApi = await createBotApi();
  const botI18n = await createBotI18n();

  const diContainer = createDiContainer({ db, sql }, { botApi, botI18n });
  nitroApp.hooks.hook("request", (event) => {
    event.context.diContainerScope = diContainer.createScope();
  });
});

declare module "h3" {
  interface H3EventContext {
    diContainerScope: AwilixContainer<Cradle>;
  }
}
