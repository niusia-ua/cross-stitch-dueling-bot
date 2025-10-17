<template>
  <!-- @vue-ignore -->
  <UApp :locale="nuxtLocales[$selectedLocale.value]" :toaster="{ position: 'top-center' }">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
  import { uk } from "@nuxt/ui/locale";

  const nuxtLocales = { uk } as const;

  const { $selectedLocale, $changeLocale } = useNuxtApp();

  onMounted(() => {
    $changeLocale(window.Telegram.WebApp.initDataUnsafe.user?.language_code);
    window.Telegram.WebApp.ready();
  });
</script>
