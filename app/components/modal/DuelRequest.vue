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
          <UserInfo
            :fullname="row.original.fullname"
            :photo-url="row.original.photoUrl ?? undefined"
            variant="simple"
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
  import { DuelsApi } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();

  const userStore = useUserStore();

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
    () => DuelsApi.getAvailableUsersForDuel(userStore.user?.id),
    {
      server: false,
      lazy: true,
      immediate: false,
    },
  );

  watch(error, (err) => {
    if (err) toast.add({ color: "error", description: fluent.$t("message-fetch-available-users-failure") });
  });

  const rowSelection = ref<Record<number, boolean>>({});

  async function sendDuelRequests() {
    const selectedUsers = Object.keys(rowSelection.value)
      .map((key) => data.value?.[Number(key)])
      .filter((user) => user !== undefined);
    if (selectedUsers.length === 0) {
      toast.add({ color: "warning", description: fluent.$t("message-no-users-selected") });
      return;
    }

    try {
      await DuelsApi.sendDuelRequests(selectedUsers.map((user) => user.id));
      toast.add({ color: "success", description: fluent.$t("message-duel-requests-success") });

      open.value = false;
      rowSelection.value = {};
    } catch (error) {
      console.error("Failed to send duel request:", error);
      toast.add({ color: "error", description: fluent.$t("message-duel-requests-failure") });
    }
  }
</script>

<fluent locale="uk">
dialog-title = Виклик на дуель

table-col-user = Користувач
table-col-stitches-rate = Швидкість вишивання

label-send-duel-request = Кинути виклик

message-fetch-available-users-failure = Не вдалося отримати список доступних для дуелі користувачів
message-no-users-selected = Будь ласка, виберіть користувачів для виклику на дуель

message-duel-requests-success = Виклик(и) на дуель надіслано
message-duel-requests-failure = Не вдалося надіслати виклик(и) на дуель
</fluent>
