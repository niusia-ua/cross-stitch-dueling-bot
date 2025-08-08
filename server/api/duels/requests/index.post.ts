import z from "zod";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const toUserIds = await readValidatedBody(event, z.array(IdSchema).min(1).parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");

  const participatesInDuel = await duelsService.checkUserParticipationInDuel(user.id);
  if (participatesInDuel) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "You are already participating in the duel.",
    });
  }

  await duelsService.sendDuelRequests(user.id, toUserIds);
});
