export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) return;

  const gcloudTasksService = event.context.diContainerScope.resolve("gcloudTasksService");
  await gcloudTasksService.validateToken(token);

  const { duelId, userId } = await readValidatedBody(
    event,
    DuelReportSchema.pick({ duelId: true, userId: true }).parseAsync,
  );

  const duelReportsService = event.context.diContainerScope.resolve("duelReportsService");
  return await duelReportsService.sendDuelReportReminder(duelId, userId);
});
