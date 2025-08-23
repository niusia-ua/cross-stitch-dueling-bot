export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) return;

  const gcloudTasksService = event.context.diContainerScope.resolve("gcloudTasksService");
  await gcloudTasksService.validateToken(token);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.createWeeklyRandomDuels();
});
