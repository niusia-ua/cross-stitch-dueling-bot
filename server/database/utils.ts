import { snakeCase } from "es-toolkit";
import type { ValueExpression } from "slonik";

import { sql } from "./sql.js";

/**
 * Generates a SQL fragment for a partial update statement.
 * This function creates a SQL fragment that can be used in an UPDATE statement to set only the fields that are present in the provided data object.
 * @param data - An object where keys are column names (they will be automatically converted to the `snake_case`) and values are the values to set.
 * @returns A SQL fragment for the UPDATE statement.
 */
export function partialUpdateSet(data: Record<string, ValueExpression>) {
  return sql.join(
    Object.entries(data).map(([key, value]) => sql.fragment`${sql.identifier([snakeCase(key)])} = ${value}`),
    sql.fragment`,`,
  );
}
