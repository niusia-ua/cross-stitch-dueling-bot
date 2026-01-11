export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) return;

  const gcloudTasksService = event.context.diContainerScope.resolve("gcloudTasksService");
  await gcloudTasksService.validateToken(token);

  const { id: duelId } = await readValidatedBody(event, IdObjectSchema.parseAsync);

  const gcloudStorageService = event.context.diContainerScope.resolve("gcloudStorageService");
  return await gcloudStorageService.deleteDuelReportPhotos(duelId);
});
