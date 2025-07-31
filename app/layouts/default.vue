<template>
  <div class="size-full flex flex-col">
    <header class="flex items-center justify-between border-b border-default px-4 py-2">
      <h1 class="text-2xl font-bold">
        <slot name="title" />
      </h1>
      <slot name="header-actions" />
    </header>

    <UContainer as="main" class="grow my-4">
      <slot name="content" />
    </UContainer>

    <footer>
      <UContainer v-if="$slots.footer" class="mb-2">
        <slot name="footer" />
      </UContainer>

      <div class="flex items-center justify-center border-t border-default py-2">
        <UNavigationMenu
          :items="navigationItems"
          type="single"
          :ui="{
            root: 'w-full [&>div]:not-last:w-full',
            list: 'w-full justify-evenly',
            item: 'p-0',
            link: 'flex-col gap-0.5 font-normal text-xs',
          }"
        />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import type { NavigationMenuItem } from "@nuxt/ui";

  const fluent = useFluent();

  const userStore = useUserStore();

  const navigationItems = computed<NavigationMenuItem[][]>(() => [
    [
      {
        to: "/rating",
        icon: "i-lucide:sparkles",
        label: fluent.$t("label-nav-rating"),
      },
      {
        to: "/active-duels",
        icon: "i-lucide:swords",
        label: fluent.$t("label-nav-active-duels"),
      },
      {
        to: "/notifications",
        icon: "i-lucide:bell",
        label: fluent.$t("label-nav-notifications"),
      },
      {
        to: userStore.isAuthenticated ? "/profile" : "/registration",
        icon: "i-lucide:user",
        label: userStore.isAuthenticated ? fluent.$t("label-nav-profile") : fluent.$t("label-nav-registration"),
        avatar:
          userStore.isAuthenticated && userStore.user?.photoUrl
            ? {
                src: userStore.user.photoUrl,
                alt: userStore.user.fullname,
              }
            : undefined,
      },
    ],
  ]);
</script>

<fluent locale="uk">
label-nav-rating = Рейтинг
label-nav-active-duels = Активні дуелі
label-nav-notifications = Повідомлення
label-nav-profile = Профіль
label-nav-registration = Реєстрація
</fluent>
