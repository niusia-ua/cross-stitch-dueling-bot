<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #header-actions>
      <UButton loading-auto variant="ghost" color="neutral" icon="i-lucide:refresh-cw" @click="() => refresh()" />
    </template>
    <template #content>
      <UTable sticky :loading="pending" :columns="columns" :data="data">
        <template #participants-cell="{ row }">
          <UserInfo
            v-for="p in row.original.participants"
            :key="p.id"
            :fullname="p.fullname"
            :photo-url="p.photoUrl ?? undefined"
            variant="simple"
          />
        </template>

        <template #startedAt-cell="{ row }">
          <NuxtTime
            :datetime="dayjs(row.original.startedAt).add(DUEL_PERIOD, 'milliseconds').toDate()"
            v-bind="DATETIME_FORMAT_OPTIONS"
          />
        </template>
      </UTable>
    </template>
    <template #footer>
      <ModalDuelRequest />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { TableColumn } from "@nuxt/ui";

  import { DUEL_PERIOD } from "#shared/constants.js";
  import { DATETIME_FORMAT_OPTIONS } from "~/constants/datetime.js";
  import { dayjs } from "~/utils/datetime.js";

  import { DuelsApi } from "~/api/index.js";

  const fluent = useFluent();
  const toast = useToast();

  const { data, pending, error, refresh } = await useAsyncData(
    "active-duels",
    () => DuelsApi.getActiveDuelsWithParticipants(),
    {
      lazy: true,
    },
  );
  const columns = computed<TableColumn<DuelWithParticipantsData>[]>(() => [
    { accessorKey: "codeword", header: fluent.$t("table-col-codeword") },
    { accessorKey: "participants", header: fluent.$t("table-col-participants") },
    { accessorKey: "startedAt", header: fluent.$t("table-col-deadline") },
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
