import { setupBotApi, setupI18n } from "../bot/";
import { createDbPool } from "../database/";
import { createDiContainer, type AwilixContainer, type Cradle } from "../di.js";

export default defineNitroPlugin(async (nitroApp) => {
  const pool = await createDbPool();
  const botApi = await setupBotApi();
  const botI18n = await setupI18n();

  const diContainer = createDiContainer(pool, { botApi, botI18n });
  nitroApp.hooks.hook("request", (event) => {
    event.context.diContainerScope = diContainer.createScope();
  });
});

declare module "h3" {
  interface H3EventContext {
    diContainerScope: AwilixContainer<Cradle>;
  }
}
