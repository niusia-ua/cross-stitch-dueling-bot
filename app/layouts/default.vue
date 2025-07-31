<template>
  <div class="size-full flex flex-col">
    <header class="border-b border-default px-4 py-2">
      <h1 class="text-2xl font-bold">
        <slot name="title" />
      </h1>
    </header>

    <UContainer as="main" class="grow my-4">
      <slot name="content" />
    </UContainer>

    <footer>
      <UContainer v-if="$slots.footer" class="mb-2">
        <slot name="footer" />
      </UContainer>

      <div class="flex items-center justify-center border-t border-default py-2">
        <UNavigationMenu :items="navigationItems" type="single" :ui="{ list: 'gap-x-2', item: 'p-0' }" />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import type { NavigationMenuItem } from "@nuxt/ui";

  const userStore = useUserStore();

  const navigationItems = computed<NavigationMenuItem[][]>(() => [
    [
      { to: "/rating", icon: "i-lucide:sparkles" },
      { to: "/active-duels", icon: "i-lucide:swords" },
      { to: "/notifications", icon: "i-lucide:bell" },
      {
        to: userStore.isAuthenticated ? "/profile" : "/registration",
        icon: "i-lucide:user",
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
