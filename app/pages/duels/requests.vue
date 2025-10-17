<template>
  <NuxtLayout>
    <template #header>
      <div class="flex items-center justify-between gap-x-2">
        <UButton icon="i-lucide:arrow-left" color="neutral" variant="ghost" @click="router.back()" />
        <h1 class="text-2xl font-bold">{{ $t("page-title") }}</h1>
        <UDropdownMenu :items="menuOptions" class="ml-auto">
          <UButton color="neutral" variant="ghost" icon="i-lucide:ellipsis-vertical" />
        </UDropdownMenu>
      </div>
    </template>

    <template #content>
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
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";

  import { DuelsApi, FetchError, type ApiError } from "~/api/";

  definePageMeta({
    middleware: [
      async () => {
        try {
          const userParticipatesInDuel = await DuelsApi.getUserDuelParticipation();
          if (userParticipatesInDuel) return navigateTo("/duels");
        } catch (error) {
          console.error("Failed to get user duel participation:", error);
          return navigateTo("/duels");
        }
      },
    ],
  });

  const router = useRouter();
  const fluent = useFluent();
  const toast = useToast();

  const { session } = useUserSession();

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
  const rowSelection = ref<Record<number, boolean>>({});

  const { data, pending, error, refresh } = await useAsyncData(
    "available-users",
    () => DuelsApi.getAvailableUsersForDuel(session.value?.user?.id),
    {
      lazy: true,
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

  const menuOptions = computed<DropdownMenuItem[][]>(() => [
    [
      {
        icon: "i-lucide:refresh-cw",
        label: fluent.$t("menu-opt-refresh"),
        onSelect: () => refresh(),
      },
    ],
  ]);

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
      router.push("/duels");
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
page-title = Виклик на дуель

menu-opt-refresh = Оновити

table-col-user = Користувач
table-col-stitches-rate = Швидкість вишивання

label-send-duel-request = Кинути виклик

message-success-title = Успіх
message-success-description-duel-requests-sent = Виклик(и) на дуель надіслано.

message-error-title = Сталася помилка
message-error-description-already-in-duel = Ви не можете переглянути цю сторінку, оскільки вже берете участь у дуелі.
message-error-description-failed-to-fetch-available-users = Не вдалося отримати список доступних для дуелі користувачів.
message-error-description-you-already-in-duel = Ви не можете кинути виклик(и), оскільки вже берете участь у дуелі.
message-error-description-cant-duel-the-day-before-weekly-random-duels = Ви не можете кинути виклик(и) напередодні щотижневих випадкових дуелей.
message-error-description-no-users-selected = Будь ласка, виберіть користувачів для виклику на дуель.
message-error-description-unknown =
  Не вдалося надіслати виклик на дуель.
  Будь ласка, спробуйте ще раз.
</fluent>
