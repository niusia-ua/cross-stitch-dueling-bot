<template>
  <UModal
    v-model:open="open"
    fullscreen
    :title="$t('dialog-title')"
    @after:enter="() => execute()"
    @after:leave="() => clear()"
  >
    <UButton icon="i-lucide:sword" :label="$t('label-send-duel-request')" class="w-full justify-center" />

    <template #body>
      <UTable v-model:row-selection="rowSelection" sticky :loading="pending" :data="data" :columns="columns">
        <template #selection-header="{ table }">
          <UCheckbox
            :model-value="table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected()"
            @update:model-value="(value) => table.toggleAllPageRowsSelected(!!value)"
          />
        </template>
        <template #selection-cell="{ row }">
          <UCheckbox :model-value="row.getIsSelected()" @update:model-value="(value) => row.toggleSelected(!!value)" />
        </template>

        <template #user-cell="{ row }">
          <UUser
            size="sm"
            :name="row.original.fullname"
            :avatar="row.original.photoUrl ? { src: row.original.photoUrl } : undefined"
          />
        </template>
      </UTable>
    </template>

    <template #footer>
      <UButton
        loading-auto
        icon="i-lucide:sword"
        :label="$t('label-send-duel-request')"
        class="w-full justify-center"
        @click="sendDuelRequests"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
  import type { TableColumn } from "@nuxt/ui";

  import { DuelsApi, FetchError, type ApiError } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();

  const { session } = useUserSession();

  const open = ref(false);

  const columns = computed<TableColumn<UserAvailableForDuel>[]>(() => [
    { id: "selection" },
    { id: "user", header: fluent.$t("table-col-user") },
    {
      accessorKey: "stitchesRate",
      header: fluent.$t("table-col-stitches-rate"),
      cell: ({ row }) => {
        return getStitchesRateLabel(row.original.stitchesRate);
      },
    },
  ]);

  const { data, pending, error, execute, clear } = await useAsyncData(
    "available-users",
    () => DuelsApi.getAvailableUsersForDuel(session.value?.user?.id),
    {
      server: false,
      lazy: true,
      immediate: false,
    },
  );

  watch(error, (err) => {
    if (err) {
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-failed-to-fetch-available-users"),
      });
    }
  });

  const rowSelection = ref<Record<number, boolean>>({});

  async function sendDuelRequests() {
    const selectedUsers = Object.keys(rowSelection.value)
      .map((key) => data.value?.[Number(key)])
      .filter((user) => user !== undefined);
    if (selectedUsers.length === 0) {
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-no-users-selected"),
      });
      return;
    }

    try {
      await DuelsApi.sendDuelRequests(selectedUsers.map((user) => user.id));
      toast.add({
        color: "success",
        title: fluent.$t("message-success-title"),
        description: fluent.$t("message-success-description-duel-requests-sent"),
      });

      open.value = false;
      rowSelection.value = {};
    } catch (error) {
      if (error instanceof FetchError) {
        const data = (error as ApiError).data?.data;

        if (data?.code === ApiErrorCode.UserAlreadyInDuel) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-you-already-in-duel"),
          });
          return;
        }

        if (data?.code === ApiErrorCode.CantDuelTheDayBeforeWeeklyRandomDuels) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-cant-duel-the-day-before-weekly-random-duels"),
          });
          return;
        }
      }

      console.error("Failed to send duel request:", error);
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-unknown"),
      });
    }
  }
</script>

<fluent locale="uk">
dialog-title = Виклик на дуель

table-col-user = Користувач
table-col-stitches-rate = Швидкість вишивання

label-send-duel-request = Кинути виклик

message-success-title = Успіх
message-success-description-duel-requests-sent = Виклик(и) на дуель надіслано.

message-error-title = Сталася помилка
message-error-description-failed-to-fetch-available-users = Не вдалося отримати список доступних для дуелі користувачів.
message-error-description-you-already-in-duel = Ви не можете кинути виклик(и), оскільки вже берете участь у дуелі.
message-error-description-cant-duel-the-day-before-weekly-random-duels = Ви не можете кинути виклик(и) напередодні щотижневих випадкових дуелей.
message-error-description-no-users-selected = Будь ласка, виберіть користувачів для виклику на дуель.
message-error-description-unknown =
  Не вдалося надіслати виклик на дуель.
  Будь ласка, спробуйте ще раз.
</fluent>
