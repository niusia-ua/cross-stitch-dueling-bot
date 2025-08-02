export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const userStore = useUserStore();
  if (!userStore.isAuthenticated) {
    return navigateTo("/registration");
  }
});
