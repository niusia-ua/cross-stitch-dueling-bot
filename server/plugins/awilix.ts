import { createDbPool } from "../database/";
import { createDiContainer, type AwilixContainer, type Cradle } from "../di.js";

export default defineNitroPlugin(async (nitroApp) => {
  const pool = await createDbPool();
  const diContainer = createDiContainer(pool);

  nitroApp.hooks.hook("request", (event) => {
    event.context.diContainerScope = diContainer.createScope();
  });
});

declare module "h3" {
  interface H3EventContext {
    diContainerScope: AwilixContainer<Cradle>;
  }
}
