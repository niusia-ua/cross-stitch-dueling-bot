export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) return;

  const gcloudTasksService = event.context.diContainerScope.resolve("gcloudTasksService");
  await gcloudTasksService.validateToken(token);

  // Cloud Scheduler doesn't support `L` to run the job on the last day of the month.
  // So we run the job on `28-31` (all possible last days) and programatically check if we should actually proceed.
  if (!isLastDayOfMonth()) return;

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.publishMonthlyRatingAndWinners();
});
