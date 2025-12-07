import { createPool } from "slonik";

import { createCamelCaseKeysInterceptor, createResultParserInterceptor } from "./interceptors/";

export function createDbPool() {
  const config = useRuntimeConfig();
  return createPool(config.databaseUrl, {
    interceptors: [createCamelCaseKeysInterceptor(), createResultParserInterceptor()],
  });
}

export * from "./sql.js";
export * from "./utils.js";

export type { DatabasePool } from "slonik";
