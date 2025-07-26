<template>
  <h1>{{ $t("message-welcome") }}</h1>
</template>

<script setup lang="ts">
  import { BotApi } from "~/api/index.js";

  const fluent = useFluent();

  onMounted(async () => {
    const { valid } = await BotApi.validateWebAppData(Telegram.WebApp.initData);

    if (!valid) {
      return Telegram.WebApp.showAlert(fluent.$t("message-invalid-web-app-data"), () => Telegram.WebApp.close());
    }

    Telegram.WebApp.ready();
  });
</script>

<fluent locale="uk">
message-welcome = Ласкаво просимо! Все працює.
message-invalid-web-app-data = Не валідні дані вебзастосунку. Ми не можемо їм довіряти. Застосунок буде закрито.
</fluent>
