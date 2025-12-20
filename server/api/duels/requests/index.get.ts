export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const duelRequestsService = event.context.diContainerScope.resolve("duelRequestsService");
  return await duelRequestsService.getDuelRequestsForUser(user.id);
});
