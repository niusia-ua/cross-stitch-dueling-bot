import z from "zod";

const ArchivedDuelsRequestSchema = z.object({
  year: z.coerce.number().int().min(2025),
  month: z.coerce.number().int().min(1).max(12),
});

export default defineEventHandler(async (event) => {
  const { year, month } = await getValidatedQuery(event, ArchivedDuelsRequestSchema.parse);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.getCompletedDuelsByMonth(year, month);
});
