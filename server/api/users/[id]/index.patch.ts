export default defineEventHandler(async (event) => {
  const { userId } = getJwtAuthData(event);
  const { id: targetUserId } = await getValidatedRouterParams(event, IdObjectSchema.parseAsync);
  if (userId !== targetUserId) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
      message: "You can only update your own user data",
    });
  }

  const data = await readValidatedBody(event, UserDataSchema.omit({ id: true }).parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  return await userService.updateUser(targetUserId, data);
});
