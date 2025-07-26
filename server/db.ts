import { createPool, createSqlTag } from "slonik";
import z from "zod";

export function createDbPool() {
  const config = useRuntimeConfig();
  return createPool(config.DATABASE_URL);
}

export const sql = createSqlTag({
  typeAliases: {
    id: z.object({ id: z.number() }).strict(),
    void: z.object({}).strict(),
  },
});

export type { DatabasePool } from "slonik";
