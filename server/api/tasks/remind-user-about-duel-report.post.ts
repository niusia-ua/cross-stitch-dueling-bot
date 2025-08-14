export default defineEventHandler(async (event) => {
  const { duelId, userId } = await readValidatedBody(
    event,
    DuelReportSchema.pick({ duelId: true, userId: true }).parseAsync,
  );

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.sendDuelReportReminder(duelId, userId);
});
