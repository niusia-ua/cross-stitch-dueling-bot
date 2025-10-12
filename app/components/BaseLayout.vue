<template>
  <div class="size-full flex flex-col">
    <header v-if="$slots.header" class="border-b border-default px-4 py-2">
      <slot name="header" />
    </header>

    <UContainer as="main" class="grow my-4 overflow-y-auto">
      <slot name="content" />
    </UContainer>

    <footer v-if="$slots.footer" class="border-t border-default px-4 py-2">
      <slot name="footer" />
    </footer>
  </div>
</template>
