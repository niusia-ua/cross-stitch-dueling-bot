import { type Interceptor, type QueryResultRow, SchemaValidationError } from "slonik";

export function createResultParserInterceptor(): Interceptor {
  return {
    name: "result-parser",
    transformRowAsync: async (context, query, row) => {
      if (!context.resultParser) return row;

      const validationResult = await context.resultParser.safeParseAsync(row);
      if (!validationResult.success) {
        throw new SchemaValidationError(query, row, validationResult.error.issues);
      }

      return validationResult.data as QueryResultRow;
    },
  };
}
