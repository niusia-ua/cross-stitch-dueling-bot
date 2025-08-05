<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #content>
      <UserForm v-model:user="user" v-model:settings="settings" />
    </template>
    <template #footer>
      <UButton loading-auto :label="$t('label-register')" class="w-full justify-center" @click="register" />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import { UsersApi } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();

  // At this point, the Telegram user data must be available.
  const tgUser = window.Telegram.WebApp.initDataUnsafe.user!;

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

  async function register() {
    try {
      await UsersApi.createUser(user, settings);
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

label-register = Зареєструватися

message-registration-success = Вітаємо! Ви успішно зареєструвалися.
message-registration-failure = Не вдалося зареєструватися.
</fluent>
