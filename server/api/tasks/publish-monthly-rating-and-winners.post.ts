export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) return;

  const gcloudTasksService = event.context.diContainerScope.resolve("gcloudTasksService");
  await gcloudTasksService.validateToken(token);

  const duelsRatingService = event.context.diContainerScope.resolve("duelsRatingService");
  return await duelsRatingService.publishMonthlyRatingAndWinners();
});
