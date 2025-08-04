export default defineEventHandler(async (event) => {
  const { user, settings } = await readValidatedBody(event, UserAndSettingsDataSchema.parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  const result = await userService.createUser(user, settings);

  await setUserSession(event, result);
  return result;
});
