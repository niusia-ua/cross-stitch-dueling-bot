import z from "zod";

const ParamsSchema = z.object({ id: TelegramUserIdSchema });

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, ParamsSchema.parseAsync);
  const data = await readValidatedBody(event, UserDataSchema.omit({ id: true }).parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  return await userService.updateUser(id, data);
});
