import { toCamelCaseKeys } from "es-toolkit";
import type { Interceptor, QueryResultRow } from "slonik";

export function createCamelCaseKeysInterceptor(): Interceptor {
  return {
    name: "camel-case-keys",
    transformRow: (_context, _query, row) => {
      return toCamelCaseKeys(row) as QueryResultRow;
    },
  };
}
