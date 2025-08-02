<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #header-actions>
      <UButton loading-auto variant="ghost" color="neutral" icon="i-lucide:refresh-cw" @click="() => refresh()" />
    </template>
    <template #content>
      <UTable sticky :loading="pending" :columns="columns" :data="data">
        <template #participants-cell="{ row }">
          <div class="space-y-1">
            <UserInfo
              v-for="p in row.original.participants"
              :key="p.id"
              :fullname="p.fullname"
              :photo-url="p.photoUrl ?? undefined"
              variant="simple"
            />
          </div>
        </template>

        <template #deadline-cell="{ row }">
          <NuxtTime
            :datetime="dayjs(row.original.startedAt).add(DUEL_PERIOD, 'milliseconds').toDate()"
            v-bind="DEFAULT_DATETIME_FORMAT_OPTIONS"
          />
        </template>
      </UTable>
    </template>
    <template v-if="userStore.isAuthenticated" #footer>
      <ModalDuelRequest />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { TableColumn } from "@nuxt/ui";

  import { dayjs } from "#shared/utils/datetime.js";
  import { DUEL_PERIOD } from "#shared/constants/duels.js";
  import { DEFAULT_DATETIME_FORMAT_OPTIONS } from "#shared/constants/datetime.js";

  import { DuelsApi } from "~/api/index.js";

  const fluent = useFluent();
  const toast = useToast();

  const userStore = useUserStore();

  const { data, pending, error, refresh } = await useAsyncData(
    "active-duels",
    () => DuelsApi.getActiveDuelsWithParticipants(),
    {
      lazy: true,
    },
  );
  const columns = computed<TableColumn<DuelWithParticipantsData>[]>(() => [
    {
      accessorKey: "codeword",
      header: fluent.$t("table-col-codeword"),
      cell: ({ row }) => {
        const value = row.original.codeword;
        return value[0]!.toUpperCase() + value.slice(1);
      },
    },
    { accessorKey: "participants", header: fluent.$t("table-col-participants") },
    {
      id: "deadline",
      accessorKey: "startedAt",
      header: fluent.$t("table-col-deadline"),
    },
  ]);

  watch(error, (err) => {
    if (err) {
      toast.add({ color: "error", description: fluent.$t("message-fetch-active-duels-failure") });
    }
  });
</script>

<fluent locale="uk">
page-title = Активні дуелі

message-fetch-active-duels-failure = Не вдалося отримати список активних дуелей

table-col-codeword = КС
table-col-participants = Учасники
table-col-deadline = Дедлайн
</fluent>
