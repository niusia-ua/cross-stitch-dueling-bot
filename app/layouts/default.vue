<template>
  <div class="size-full flex flex-col">
    <header class="border-b border-default px-4 py-2">
      <h1 class="text-2xl font-bold">
        <slot name="header" />
      </h1>
    </header>

    <UContainer as="main" class="grow my-4 overflow-y-auto">
      <slot name="content" />
    </UContainer>

    <footer>
      <UContainer v-if="$slots.footer" class="mb-2">
        <slot name="footer" />
      </UContainer>
    </footer>
  </div>
</template>
