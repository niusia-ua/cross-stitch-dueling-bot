import z from "zod";

const ParamsSchema = z.object({ id: TelegramUserIdSchema });

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, ParamsSchema.parseAsync);

  const userService = event.context.diContainerScope.resolve("usersService");
  return await userService.getUserWithSettings(id);
});
