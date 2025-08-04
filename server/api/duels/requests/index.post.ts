import z from "zod";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const toUserIds = await readValidatedBody(event, z.array(IdSchema).min(1).parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.sendDuelRequests(user.id, toUserIds);
});
