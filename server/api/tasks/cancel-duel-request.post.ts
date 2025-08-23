export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) return;

  const gcloudTasksService = event.context.diContainerScope.resolve("gcloudTasksService");
  await gcloudTasksService.validateToken(token);

  const { id: requestId } = await readValidatedBody(event, IdObjectSchema.parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  await duelsService.removeExpiredDuelRequest(requestId);
});
