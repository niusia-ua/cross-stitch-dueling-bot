import { createPool, createSqlTag } from "slonik";
import { createFieldNameTransformationInterceptor } from "slonik-interceptor-field-name-transformation";
import z from "zod";

import { createResultParserInterceptor } from "./interceptors/";

export function createDbPool() {
  const config = useRuntimeConfig();
  return createPool(config.DATABASE_URL, {
    interceptors: [
      createFieldNameTransformationInterceptor({ test: (field) => /^[a-z0-9_]+$/.test(field.name) }),
      createResultParserInterceptor(),
    ],
  });
}

export const sql = createSqlTag({
  typeAliases: {
    id: IdObjectSchema.strict(),
    void: z.object({}).strict(),
  },
});

export type { DatabasePool } from "slonik";
