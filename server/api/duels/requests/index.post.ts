import z from "zod";

export default defineEventHandler(async (event) => {
  const { userId: fromUserId } = getJwtAuthData(event);
  const toUserIds = await readValidatedBody(event, z.array(IdSchema).min(1).parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.sendDuelRequests(fromUserId, toUserIds);
});
