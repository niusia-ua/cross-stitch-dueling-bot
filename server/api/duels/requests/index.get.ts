export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.getUserDuelRequests(user.id);
});
