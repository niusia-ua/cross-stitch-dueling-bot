<template>
  <div class="size-full flex flex-col">
    <header class="flex items-center justify-between border-b border-default px-4 py-2">
      <h1 class="text-2xl font-bold">
        <slot name="title" />
      </h1>
      <slot name="header-actions" />
    </header>

    <UContainer as="main" class="grow my-4 overflow-y-auto">
      <slot name="content" />
    </UContainer>

    <footer>
      <UContainer v-if="$slots.footer" class="mb-2">
        <slot name="footer" />
      </UContainer>

      <ClientOnly>
        <LazyNavigationBar v-if="loggedIn" />
      </ClientOnly>
    </footer>
  </div>
</template>

<script setup lang="ts">
  const { loggedIn } = useUserSession();
</script>
