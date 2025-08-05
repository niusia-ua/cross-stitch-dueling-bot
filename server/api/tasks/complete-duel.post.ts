export default defineEventHandler(async (event) => {
  const { id: requestId } = await readValidatedBody(event, IdObjectSchema.parseAsync);

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.completeDuel(requestId);
});
