export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id: duelId } = await getValidatedRouterParams(event, IdObjectSchema.parseAsync);

  const formData = await readFormData(event);
  const report = await DuelReportRequestSchema.parseAsync({
    photos: formData.getAll("photos"),
    stitches: formData.get("stitches"),
    additionalInfo: formData.get("additionalInfo"),
  });

  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.createDuelReport(duelId, user.id, report);
});
