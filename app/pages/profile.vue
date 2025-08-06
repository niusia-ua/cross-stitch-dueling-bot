<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #header-actions>
      <UDropdownMenu :items="userProfileActions">
        <UButton :loading="updatingUser" color="neutral" variant="ghost" icon="i-lucide:menu" />
      </UDropdownMenu>
    </template>

    <template #content>
      <div class="space-y-2">
        <div>
          <div class="flex items-center justify-between">
            <UserInfo v-bind="user" />
            <UBadge
              :color="user.active ? 'success' : 'error'"
              :label="$t(user.active ? 'badge-label-active' : 'badge-label-inactive')"
            />
          </div>

          <i18n path="message-last-updated-at" class="text-xs text-dimmed">
            <template #datetime>
              <NuxtTime :datetime="user.updatedAt" :locale="$selectedLocale" v-bind="DEFAULT_DATETIME_FORMAT_OPTIONS" />
            </template>
          </i18n>
        </div>

        <USeparator decorative />

        <UFormField :label="$t('form-label-stitches-rate')" :description="$t('form-description-stitches-rate')">
          <USelect
            :model-value="settings.stitchesRate"
            :loading="updatingSettings.stitchesRate"
            :items="stitchesRateOptions"
            class="w-full"
            @update:model-value="updateSettings({ stitchesRate: $event })"
          />
        </UFormField>

        <USwitch
          :model-value="settings.participatesInWeeklyRandomDuels"
          :loading="updatingSettings.participatesInWeeklyRandomDuels"
          :label="$t('form-label-participates-in-weekly-random-duels')"
          @update:model-value="updateSettings({ participatesInWeeklyRandomDuels: $event })"
        />

        <i18n path="message-last-updated-at" class="text-xs text-dimmed">
          <template #datetime>
            <NuxtTime
              :datetime="settings.updatedAt"
              :locale="$selectedLocale"
              v-bind="DEFAULT_DATETIME_FORMAT_OPTIONS"
            />
          </template>
        </i18n>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem } from "@nuxt/ui";
  import { DEFAULT_DATETIME_FORMAT_OPTIONS } from "~~/shared/constants/datetime.js";
  import { UsersApi } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();

  const { $selectedLocale } = useNuxtApp();
  const { session, fetch: refreshSession } = useUserSession();

  // Session data is guaranteed to be available after the authenticated middleware is executed.
  const user = computed(() => session.value!.user!);
  const settings = computed(() => session.value!.settings!);

  const stitchesRateOptions = [
    { label: "50-499", value: StitchesRate.Low },
    { label: "500-999", value: StitchesRate.Medium },
    { label: "≥1000", value: StitchesRate.High },
  ];

  const userProfileActions = computed<DropdownMenuItem[][]>(() => [
    [
      {
        icon: "i-lucide:refresh-cw",
        label: fluent.$t("menu-label-sync-with-telegram"),
        onSelect: async () => {
          const tgUser = window.Telegram.WebApp.initDataUnsafe.user!;
          await updateUser({
            fullname: [tgUser.first_name, tgUser.last_name].join(" ").trimEnd(),
            username: tgUser.username ?? null,
            photoUrl: tgUser.photo_url ?? null,
          });
        },
      },
    ],
    [
      {
        icon: user.value.active ? "i-lucide:power-off" : "i-lucide:power",
        label: user.value.active
          ? fluent.$t("menu-label-deactivate-account")
          : fluent.$t("menu-label-activate-account"),
        color: user.value.active ? "error" : "success",
        onSelect: () => updateUser({ active: !user.value.active }),
      },
    ],
  ]);

  const updatingUser = ref(false);
  async function updateUser(data: Partial<UserData>) {
    try {
      updatingUser.value = true;
      await UsersApi.updateUser(user.value.id, data);
      await refreshSession();
    } catch (err) {
      console.error(err);
      toast.add({ color: "error", description: fluent.$t("message-update-failure") });
    } finally {
      updatingUser.value = false;
    }
  }

  const updatingSettings = reactive({
    stitchesRate: false,
    participatesInWeeklyRandomDuels: false,
  });
  async function updateSettings(data: Partial<UserSettingsData>) {
    try {
      // @ts-expect-error We always have valid keys in data.
      for (const key in data) updatingSettings[key] = true;
      await UsersApi.updateUserSettings(user.value.id, data);
      await refreshSession();
    } catch (err) {
      console.error(err);
      toast.add({ color: "error", description: fluent.$t("message-update-failure") });
    } finally {
      // @ts-expect-error We always have valid keys in data.
      for (const key in data) updatingSettings[key] = false;
    }
  }
</script>

<fluent locale="uk">
page-title = Профіль

label-yes = Так
label-no = Ні

badge-label-active = Активний
badge-label-inactive = Неактивний

menu-label-sync-with-telegram = Синхронізувати з Telegram

menu-label-deactivate-account = Деактивувати акаунт
menu-label-activate-account = Активувати акаунт

text-user-settings =
  Участь у щотижневих випадкових дуелях: { $participatesInWeeklyRandomDuels }
  Швидкість вишивання: { $stitchesRate }

form-label-stitches-rate = Швидкість вишивання
form-description-stitches-rate = Середня кількість стібків, яку ви вишиваєте за день.

form-label-participates-in-weekly-random-duels = Брати участь у щотижневих випадкових дуелях

# $datetime is a NuxtTime component
message-last-updated-at = Востаннє оновлено { $datetime }.

message-update-failure = Не вдалося оновити дані
</fluent>
