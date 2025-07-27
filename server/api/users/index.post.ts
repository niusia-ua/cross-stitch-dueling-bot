export default defineEventHandler(async (event) => {
  const { user, settings } = await readValidatedBody(event, UserAndSettingsDataSchema.parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  return await userService.createUser(user, settings);
});
