export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, IdObjectSchema.parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  return await userService.getUserWithSettings(id);
});
