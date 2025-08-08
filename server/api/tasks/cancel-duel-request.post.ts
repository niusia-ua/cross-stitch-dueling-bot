export default defineEventHandler(async (event) => {
  const { id: requestId } = await readValidatedBody(event, IdObjectSchema.parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  await duelsService.removeExpiredDuelRequest(requestId);
});
