<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
  import { FetchError } from "ofetch";

  const fluent = useFluent();
  const toast = useToast();

  const userStore = useUserStore();

  onMounted(async () => {
    try {
      await userStore.authenticateUser(Telegram.WebApp.initData);
    } catch (err) {
      if (err instanceof FetchError) {
        if (err.status === 400) {
          return Telegram.WebApp.showAlert(fluent.$t("message-error-invalid-web-app-data"), () => {
            Telegram.WebApp.close();
          });
        }

        if (err.status === 401) {
          return navigateTo("/registration");
        }
      }

      toast.add({ color: "error", description: fluent.$t("message-error-unknown") });
      console.error(err);
    } finally {
      Telegram.WebApp.ready();
    }
  });
</script>

<fluent locale="uk">
  message-error-invalid-web-app-data = Не валідні дані вебзастосунку. Ми не можемо їм довіряти. Застосунок буде закрито.
  message-error-unknown = Сталася невідома помилка. Будь ласка, спробуйте ще раз пізніше.
</fluent>
