<template>
  <div class="bg-elevated rounded-md p-2">
    <div class="flex items-center justify-between">
      <UUser size="sm" :name="fromUser.fullname" :avatar="fromUser.photoUrl ? { src: fromUser.photoUrl } : undefined" />
      <div class="flex items-center gap-x-1">
        <UButton size="sm" color="success" icon="i-lucide:check" @click="emit('accept', id)" />
        <UButton size="sm" color="error" icon="i-lucide:x" @click="emit('decline', id)" />
      </div>
    </div>
    <NuxtTime
      relative
      :locale="$selectedLocale"
      :datetime="createdAt"
      v-bind="config.public.DEFAULT_DATETIME_FORMAT_OPTIONS"
      class="text-xs text-dimmed"
    />
  </div>
</template>

<script setup lang="ts">
  // For some reason, Vue can't resolve the auto-imported `UserDuelRequest` type.
  // It throws an error: `[@vue/compiler-sfc] Unresolvable type reference or unsupported built-in utility type`.
  interface DuelRequestProps {
    id: number;
    fromUser: {
      fullname: string;
      photoUrl?: string | null;
    };
    createdAt: Date;
  }

  const { id, fromUser, createdAt } = defineProps<DuelRequestProps>();
  const emit = defineEmits<{
    accept: [id: number];
    decline: [id: number];
  }>();

  const config = useRuntimeConfig();
  const { $selectedLocale } = useNuxtApp();
</script>
