import * as slonik from "slonik";
import z from "zod";

import { createCamelCaseKeysInterceptor, createResultParserInterceptor } from "./interceptors/";

export function createDbPool(url: string) {
  return slonik.createPool(url, {
    interceptors: [createCamelCaseKeysInterceptor(), createResultParserInterceptor()],
  });
}
export type DatabasePool = slonik.DatabasePool;

export function createSqlTag() {
  return slonik.createSqlTag({
    typeAliases: {
      id: IdObjectSchema.strict(),
      void: z.object({}).strict(),
    },
  });
}
export type SqlTag = ReturnType<typeof createSqlTag>;

export * from "./utils.js";
