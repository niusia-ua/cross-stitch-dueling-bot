export default defineEventHandler(async (event) => {
  const usersService = event.context.diContainerScope.resolve("usersService");
  return await usersService.getAllUsersWithSettings();
});
