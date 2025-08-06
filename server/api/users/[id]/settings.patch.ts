export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id: targetUserId } = await getValidatedRouterParams(event, IdObjectSchema.parseAsync);

  if (user.id !== targetUserId) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
      message: "You can only update your own user data",
    });
  }

  const data = await readValidatedBody(event, UserSettingsDataSchema.partial().parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  const result = await userService.updateUserSettings(targetUserId, data);

  await setUserSession(event, { settings: result });
  return result;
});
