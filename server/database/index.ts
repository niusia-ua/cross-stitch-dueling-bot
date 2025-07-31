import { createPool, createSqlTag } from "slonik";
import z from "zod";

import { createCamelCaseKeysInterceptor, createResultParserInterceptor } from "./interceptors/";

export function createDbPool() {
  const config = useRuntimeConfig();
  return createPool(config.DATABASE_URL, {
    interceptors: [createCamelCaseKeysInterceptor(), createResultParserInterceptor()],
  });
}

export const sql = createSqlTag({
  typeAliases: {
    id: IdObjectSchema.strict(),
    void: z.object({}).strict(),
  },
});

export type { DatabasePool } from "slonik";
