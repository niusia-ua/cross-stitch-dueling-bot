export default defineEventHandler(async (event) => {
  const duelsService = event.context.diContainerScope.resolve("duelsService");
  return await duelsService.getDuelsRating();
});
