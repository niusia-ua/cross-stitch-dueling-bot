<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
  import { BotApi } from "~/api/";

  const fluent = useFluent();

  const userStore = useUserStore();

  onMounted(async () => {
    const { valid } = await BotApi.validateWebAppData(Telegram.WebApp.initData);
    Telegram.WebApp.ready();

    if (!valid) {
      return Telegram.WebApp.showAlert(fluent.$t("message-invalid-web-app-data"), () => Telegram.WebApp.close());
    }

    const tgUser = Telegram.WebApp.initDataUnsafe.user!;

    await userStore.fetchUser(tgUser.id);
  });
</script>

<fluent locale="uk">
  message-invalid-web-app-data = Не валідні дані вебзастосунку. Ми не можемо їм довіряти. Застосунок буде закрито.
</fluent>
