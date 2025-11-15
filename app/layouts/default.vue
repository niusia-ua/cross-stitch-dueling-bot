<template>
  <BaseLayout v-bind="$attrs">
    <!-- Pass all slots. -->
    <template v-for="(_, name) in $slots" #[name]>
      <slot :name="name" />
    </template>
  </BaseLayout>
</template>
