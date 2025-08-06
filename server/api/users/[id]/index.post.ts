import z from "zod";

const BodySchema = z.object({
  user: UserDataSchema.omit({ active: true }),
  settings: UserSettingsDataSchema,
});

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, IdObjectSchema.parseAsync);
  const { user, settings } = await readValidatedBody(event, BodySchema.parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  const result = await userService.createUser(id, user, settings);

  await setUserSession(event, result);
  return result;
});
