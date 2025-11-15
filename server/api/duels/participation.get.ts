import z from "zod";

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);
  const { userId, duelId } = await getValidatedQuery(
    event,
    z.object({
      userId: IdSchema.optional(),
      duelId: IdSchema.optional(),
    }).parseAsync,
  );

  const targetUserId = userId ?? user?.id;
  if (!targetUserId) {
    throw createApiError({
      code: ApiErrorCode.BadRequest,
      message: "User is not authenticated and userId is not provided",
    });
  }

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  const participation = await duelsService.getUserDuelParticipation(targetUserId, duelId);

  return { participation };
});
