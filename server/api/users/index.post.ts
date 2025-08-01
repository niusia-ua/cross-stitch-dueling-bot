export default defineEventHandler(async (event) => {
  const { user, settings } = await readValidatedBody(event, UserAndSettingsDataSchema.parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  const result = await userService.createUser(user, settings);

  setJwtAuthData(event, { userId: result.user.id });
  return result;
});
