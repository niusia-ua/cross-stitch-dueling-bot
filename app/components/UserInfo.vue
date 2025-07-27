<template>
  <div class="flex items-center gap-x-2">
    <UAvatar :src="photoUrl" :alt="fullname" :size="variant === 'default' ? 'lg' : 'sm'" class="select-none" />
    <div>
      <p :class="{ 'text-lg font-bold': variant === 'default' }">{{ fullname }}</p>
      <p v-if="username" class="text-xs text-dimmed">@{{ username }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface UserInfoProps {
    fullname: string;
    username?: string;
    photoUrl?: string;
    variant?: "default" | "simple";
  }

  const { fullname, username = undefined, photoUrl = undefined, variant = "default" } = defineProps<UserInfoProps>();
</script>
