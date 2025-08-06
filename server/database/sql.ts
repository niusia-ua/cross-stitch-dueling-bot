import { createSqlTag } from "slonik";
import z from "zod";

export const sql = createSqlTag({
  typeAliases: {
    id: IdObjectSchema.strict(),
    void: z.object({}).strict(),
  },
});
