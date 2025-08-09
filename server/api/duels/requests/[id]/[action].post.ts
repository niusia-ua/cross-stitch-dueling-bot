import z from "zod";

const ParamsSchema = z.object({
  id: IdSchema,
  action: z.nativeEnum(DuelRequestAction),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id: requestId, action } = await getValidatedRouterParams(event, ParamsSchema.parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  await duelsService.handleDuelRequest(user.id, requestId, action);
});
