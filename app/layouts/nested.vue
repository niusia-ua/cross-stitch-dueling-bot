<template>
  <div class="size-full flex flex-col">
    <header class="flex items-center justify-between border-b border-default px-4 py-2">
      <UButton variant="ghost" color="neutral" icon="i-lucide:arrow-left" @click="() => router.back()" />
      <h1 class="text-2xl font-bold">
        <slot name="header" />
      </h1>
      <slot name="header-actions" />
    </header>

    <UContainer as="main" class="grow my-4 overflow-y-auto">
      <slot name="content" />
    </UContainer>
  </div>
</template>

<script setup lang="ts">
  const router = useRouter();
</script>
