import { FetchError } from "ofetch";
import { AuthApi } from "~/api/";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const toast = useToast();

  const { loggedIn, fetch: refreshSession } = useUserSession();
  if (!loggedIn.value && to.path !== "/registration") {
    try {
      await AuthApi.auth(Telegram.WebApp.initData);
      await refreshSession();
    } catch (err) {
      if (err instanceof FetchError) {
        if (err.status === 400) {
          return Telegram.WebApp.showAlert("The provided Web App init data is invalid. Please restart the app.", () => {
            Telegram.WebApp.close();
          });
        }

        if (err.status === 401) {
          toast.add({ color: "error", description: "You are not authorized. Please log in and try again." });
          return navigateTo("/registration");
        }
      }

      console.error("Unknown error:", err);
      throw err;
    }
  }
});
