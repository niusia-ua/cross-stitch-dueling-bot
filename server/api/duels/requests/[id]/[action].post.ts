import z from "zod";

const ParamsSchema = z.object({
  id: IdSchema,
  action: z.nativeEnum(DuelRequestAction),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id: requestId, action } = await getValidatedRouterParams(event, ParamsSchema.parseAsync);

  const duelRequestsService = event.context.diContainerScope.resolve("duelRequestsService");
  await duelRequestsService.handleDuelRequest(user.id, requestId, action);
});
