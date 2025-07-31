import z from "zod";

export default defineEventHandler(async (event) => {
  const { excludeUserId } = await getValidatedQuery(event, z.object({ excludeUserId: IdSchema.optional() }).parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.getAvailableUsersForDuel({ excludeUserId });
});
