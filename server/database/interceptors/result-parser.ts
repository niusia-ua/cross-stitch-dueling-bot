import { type Interceptor, type QueryResultRow, SchemaValidationError } from "slonik";

export function createResultParserInterceptor(): Interceptor {
  return {
    name: "result-parser",
    transformRowAsync: async (context, query, row) => {
      if (!context.resultParser) return row;

      const result = await context.resultParser["~standard"].validate(row);
      if (result.issues) {
        throw new SchemaValidationError(query, row, result.issues);
      }

      return result.value as QueryResultRow;
    },
  };
}
