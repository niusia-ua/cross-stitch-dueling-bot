export default defineEventHandler(async (event) => {
  const duelsRatingService = event.context.diContainerScope.resolve("duelsRatingService");
  return await duelsRatingService.getDuelsRating();
});
