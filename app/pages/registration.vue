<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #content>
      <div class="space-y-2">
        <UUser
          :name="user.fullname"
          :description="user.username ? `@${user.username}` : undefined"
          :avatar="user.photoUrl ? { src: user.photoUrl } : undefined"
        />

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
      <UButton loading-auto :label="$t('button-label-register')" class="w-full justify-center" @click="register" />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import { UsersApi } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();

  const stitchesRateOptions = [
    { label: "50-499", value: StitchesRate.Low },
    { label: "500-999", value: StitchesRate.Medium },
    { label: "≥1000", value: StitchesRate.High },
  ];

  // At this point, the Telegram user data must be available.
  const tgUser = window.Telegram.WebApp.initDataUnsafe.user!;

  const user = reactive<Omit<UserData, "active">>({
    username: tgUser.username ?? null,
    fullname: [tgUser.first_name, tgUser.last_name].join(" ").trimEnd(),
    photoUrl: tgUser.photo_url ?? null,
  });
  const settings = reactive<UserSettingsData>({
    stitchesRate: StitchesRate.Low,
    participatesInWeeklyRandomDuels: true,
  });

  async function register() {
    try {
      await UsersApi.createUser(tgUser.id, user, settings);
      await navigateTo("/profile");
      toast.add({ color: "success", description: fluent.$t("message-registration-success") });
    } catch (err) {
      toast.add({ color: "error", description: fluent.$t("message-registration-failure") });
      console.error(err);
    }
  }
</script>

<fluent locale="uk">
page-title = Реєстрація

form-label-stitches-rate = Швидкість вишивання
form-description-stitches-rate = Середня кількість стібків, яку ви вишиваєте за день.

form-label-participates-in-weekly-random-duels = Брати участь у щотижневих випадкових дуелях

button-label-register = Зареєструватися

message-registration-success = Вітаємо! Ви успішно зареєструвалися.
message-registration-failure = Не вдалося зареєструватися.
</fluent>
