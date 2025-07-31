export default defineEventHandler(async (event) => {
  const { userId } = getJwtAuthData(event);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.getUserDuelRequests(userId);
});
