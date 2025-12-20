import z from "zod";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const toUserIds = await readValidatedBody(event, z.array(IdSchema).min(1).parseAsync);

  const duelRequestsService = event.context.diContainerScope.resolve("duelRequestsService");
  await duelRequestsService.sendDuelRequests(user.id, toUserIds);
});
