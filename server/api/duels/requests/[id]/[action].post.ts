import z from "zod";

const ParamsSchema = z.object({
  id: IdSchema,
  action: z.nativeEnum(DuelRequestAction),
});

export default defineEventHandler(async (event) => {
  const { userId } = getJwtAuthData(event);
  const { id: requestId, action } = await getValidatedRouterParams(event, ParamsSchema.parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");

  const duelRequest = await duelsService.getDuelRequest(requestId);
  if (!duelRequest) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "Duel request not found",
    });
  }
  if (duelRequest.toUserId !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "You are not authorized to handle this duel request",
    });
  }

  if (action === DuelRequestAction.Accept) await duelsService.acceptDuelRequest(requestId);
  if (action === DuelRequestAction.Decline) await duelsService.declineDuelRequest(requestId);
});
