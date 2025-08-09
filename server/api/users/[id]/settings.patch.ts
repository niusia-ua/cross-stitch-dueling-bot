export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id: targetUserId } = await getValidatedRouterParams(event, IdObjectSchema.parseAsync);

  const data = await readValidatedBody(event, UserSettingsDataSchema.partial().parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  const result = await userService.updateUserSettings(user.id, targetUserId, data);

  await setUserSession(event, { settings: result });
  return result;
});
