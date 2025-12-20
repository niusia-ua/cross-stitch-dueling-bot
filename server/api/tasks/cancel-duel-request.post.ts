export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) return;

  const gcloudTasksService = event.context.diContainerScope.resolve("gcloudTasksService");
  await gcloudTasksService.validateToken(token);

  const { id: requestId } = await readValidatedBody(event, IdObjectSchema.parseAsync);

  const duelRequestsService = event.context.diContainerScope.resolve("duelRequestsService");
  await duelRequestsService.removeExpiredDuelRequest(requestId);
});
