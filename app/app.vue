<template>
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
  onMounted(() => {
    Telegram.WebApp.ready();
  });
</script>

<fluent locale="uk">
message-error-invalid-web-app-data = Не валідні дані вебзастосунку. Ми не можемо їм довіряти. Застосунок буде закрито.
message-error-unknown = Сталася невідома помилка. Будь ласка, спробуйте ще раз пізніше.
</fluent>
