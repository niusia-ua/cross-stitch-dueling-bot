<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #content>
      <UserForm v-model:user="user" v-model:settings="settings">
        <template #user-actions>
          <UButton loading-auto variant="ghost" color="neutral" icon="i-lucide:refresh-cw" @click="updateUser" />
        </template>
      </UserForm>
    </template>
    <template #footer>
      <UButton
        loading-auto
        :label="$t('label-update-settings')"
        class="w-full justify-center"
        @click="updateSettings"
      />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  const fluent = useFluent();
  const toast = useToast();
  const confirm = useConfirm();

  const userStore = useUserStore();

  const user = reactive<UserData>({ ...userStore.user! });
  const settings = reactive<UserSettingsData>({ ...userStore.settings! });

  async function updateUser() {
    try {
      const tgUser = Telegram.WebApp.initDataUnsafe.user!;
      await userStore.updateUser({
        fullname: [tgUser.first_name, tgUser.last_name].join(" ").trimEnd(),
        username: tgUser.username ?? null,
        photoUrl: tgUser.photo_url ?? null,
      });
      toast.add({ color: "success", description: fluent.$t("message-user-update-success") });
    } catch (err) {
      console.error(err);
      toast.add({ color: "error", description: fluent.$t("message-user-update-failure") });
    }
  }

  async function updateSettings() {
    try {
      await userStore.updateUserSettings(settings);
      toast.add({ color: "success", description: fluent.$t("message-settings-update-success") });
    } catch (err) {
      console.error(err);
      toast.add({ color: "error", description: fluent.$t("message-settings-update-failure") });
    }
  }

  definePageMeta({
    middleware: ["auth"],
  });

  onBeforeRouteLeave(async () => {
    if (
      settings.stitchesRate !== userStore.settings!.stitchesRate ||
      settings.participatesInWeeklyRandomDuels !== userStore.settings!.participatesInWeeklyRandomDuels
    ) {
      const accepted = await confirm.open({
        title: fluent.$t("title-warning"),
        message: fluent.$t("message-unsaved-changes"),
      }).result;
      if (accepted) await updateSettings();
    }
    return true;
  });
</script>

<fluent locale="uk">
page-title = Профіль

label-update-settings = Оновити налаштування

message-user-update-success = Дані користувача оновлено успішно
message-user-update-failure = Не вдалося оновити дані користувача

message-settings-update-success = Налаштування оновлено успішно
message-settings-update-failure = Не вдалося оновити налаштування

title-warning = Попередження
message-unsaved-changes = У вас є незбережені зміни. Чи хочете ви зберегти їх перед переходом?
</fluent>
