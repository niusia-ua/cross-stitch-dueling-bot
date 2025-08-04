<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #content>
      <UserForm v-model:user="user" v-model:settings="settingsData">
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
  import { UsersApi } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();
  const confirm = useConfirm();

  const { session, fetch: refreshSession } = useUserSession();

  // Session data is guaranteed to be available after the authenticated middleware is executed.
  const user = computed(() => session.value!.user!);
  const settings = computed(() => session.value!.settings!);

  // Create a reactive object for modifying settings in the form.
  const settingsData = reactive({
    stitchesRate: settings.value.stitchesRate,
    participatesInWeeklyRandomDuels: settings.value.participatesInWeeklyRandomDuels,
  });

  async function updateUser() {
    try {
      const tgUser = Telegram.WebApp.initDataUnsafe.user!;

      await UsersApi.updateUser(user.value.id, {
        fullname: [tgUser.first_name, tgUser.last_name].join(" ").trimEnd(),
        username: tgUser.username ?? null,
        photoUrl: tgUser.photo_url ?? null,
      });
      await refreshSession();

      toast.add({ color: "success", description: fluent.$t("message-user-update-success") });
    } catch (err) {
      console.error(err);
      toast.add({ color: "error", description: fluent.$t("message-user-update-failure") });
    }
  }

  async function updateSettings() {
    try {
      await UsersApi.updateUserSettings(user.value.id, settingsData);
      await refreshSession();
      toast.add({ color: "success", description: fluent.$t("message-settings-update-success") });
    } catch (err) {
      console.error(err);
      toast.add({ color: "error", description: fluent.$t("message-settings-update-failure") });
    }
  }

  onBeforeRouteLeave(async () => {
    if (
      settings.value.stitchesRate !== settingsData.stitchesRate ||
      settings.value.participatesInWeeklyRandomDuels !== settingsData.participatesInWeeklyRandomDuels
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
