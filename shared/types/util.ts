import z from "zod";

export const IdSchema = z.coerce.number().int().positive();
export const IdObjectSchema = z.object({ id: IdSchema });
