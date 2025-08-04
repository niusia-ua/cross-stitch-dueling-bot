<template>
  <div class="flex items-center justify-center border-t border-default py-2">
    <UNavigationMenu
      :items="navigationItems"
      type="single"
      :ui="{
        root: 'w-full [&>div]:not-last:w-full',
        list: 'w-full justify-evenly',
        item: 'p-0',
        link: 'flex-col gap-0.5 before:bg-transparent hover:before:bg-transparent font-normal text-xs',
      }"
    />
  </div>
</template>

<script setup lang="ts">
  import type { NavigationMenuItem } from "@nuxt/ui";

  const fluent = useFluent();

  const { session } = useUserSession();
  const user = computed(() => session.value?.user);

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
        to: "/profile",
        icon: "i-lucide:user",
        label: fluent.$t("label-nav-profile"),
        avatar: user.value?.photoUrl
          ? {
              src: user.value.photoUrl,
              alt: user.value.fullname,
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
