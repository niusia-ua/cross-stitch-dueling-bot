<template>
  <div class="bg-elevated rounded-md p-2">
    <div class="flex items-center justify-between">
      <!-- @vue-ignore -->
      <UserInfo v-bind="fromUser" variant="simple" />
      <div class="flex items-center gap-x-1">
        <UButton size="sm" color="success" icon="i-lucide:check" @click="emit('accept', id)" />
        <UButton size="sm" color="error" icon="i-lucide:x" @click="emit('decline', id)" />
      </div>
    </div>
    <NuxtTime class="text-xs text-dimmed" :datetime="createdAt" v-bind="DATETIME_FORMAT_OPTIONS" />
  </div>
</template>

<script setup lang="ts">
  import { DATETIME_FORMAT_OPTIONS } from "~/constants/datetime.js";

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
</script>
