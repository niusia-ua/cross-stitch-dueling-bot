export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id: duelId } = await getValidatedRouterParams(event, IdObjectSchema.parseAsync);

  const formData = await readFormData(event);
  const report = await DuelReportRequestSchema.parseAsync({
    photos: formData.getAll("photos"),
    stitches: formData.get("stitches"),
    additionalInfo: formData.get("additionalInfo"),
  });

  const duelReportsService = event.context.diContainerScope.resolve("duelReportsService");
  return await duelReportsService.createDuelReport(duelId, user.id, report);
});
