<template>
  <NuxtLayout>
    <template #title>Реєстрація</template>
    <template #content>
      <div class="flex flex-col gap-y-2">
        <!-- @vue-ignore -->
        <UserInfo v-bind="user" />

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
    <template #footer>
      <UButton loading-auto :label="$t('form-label-register')" class="w-full justify-center" @click="register" />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  const fluent = useFluent();
  const toast = useToast();

  const userStore = useUserStore();

  // At this point, the Telegram user data must be available.
  const tgUser = Telegram.WebApp.initDataUnsafe.user!;

  const user = reactive<UserData>({
    id: tgUser.id,
    username: tgUser.username ?? null,
    fullname: [tgUser.first_name, tgUser.last_name].join(" ").trimEnd(),
    photoUrl: tgUser.photo_url ?? null,
  });
  const settings = reactive<UserSettingsData>({
    stitchesRate: StitchesRate.Low,
    participatesInWeeklyRandomDuels: true,
  });

  const stitchesRateOptions = [
    { label: "50-499", value: StitchesRate.Low },
    { label: "500-999", value: StitchesRate.Medium },
    { label: "≥1000", value: StitchesRate.High },
  ];

  async function register() {
    try {
      await userStore.registerUser(user, settings);

      toast.add({ color: "success", description: fluent.$t("message-registration-success") });
      navigateTo("/profile");
    } catch (e) {
      toast.add({ color: "error", description: fluent.$t("message-registration-failure") });
      console.error(e);
    }
  }
</script>

<fluent locale="uk">
form-label-stitches-rate = Швидкість вишивання
form-description-stitches-rate = Середня кількість стібків, яку ви вишиваєте за день.
form-label-participates-in-weekly-random-duels = Брати участь у щотижневих випадкових дуелях
form-label-register = Зареєструватися

message-registration-success = Вітаємо! Ви успішно зареєструвалися.
message-registration-failure = Не вдалося зареєструватися.
</fluent>
