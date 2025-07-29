<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex items-center justify-between">
      <!-- @vue-ignore -->
      <UserInfo v-bind="user" />
      <div class="flex items-center gap-x-1">
        <slot name="user-actions" />
      </div>
    </div>

    <USeparator decorative />

    <UFormField :label="$t('form-label-stitches-rate')" :description="$t('form-description-stitches-rate')">
      <USelect v-model="settings.stitchesRate" :items="stitchesRateOptions" class="w-full" />
    </UFormField>

    <USwitch
      v-model="settings.participatesInWeeklyRandomDuels"
      :label="$t('form-label-participates-in-weekly-random-duels')"
    />
  </div>
</template>

<script setup lang="ts">
  const user = defineModel<UserData>("user", { required: true });
  const settings = defineModel<UserSettingsData>("settings", { required: true });

  const stitchesRateOptions = [
    { label: "50-499", value: StitchesRate.Low },
    { label: "500-999", value: StitchesRate.Medium },
    { label: "≥1000", value: StitchesRate.High },
  ];
</script>

<fluent locale="uk">
form-label-stitches-rate = Швидкість вишивання
form-description-stitches-rate = Середня кількість стібків, яку ви вишиваєте за день.

form-label-participates-in-weekly-random-duels = Брати участь у щотижневих випадкових дуелях
</fluent>
