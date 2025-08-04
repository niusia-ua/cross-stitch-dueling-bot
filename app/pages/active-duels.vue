<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #header-actions>
      <UButton loading-auto variant="ghost" color="neutral" icon="i-lucide:refresh-cw" @click="() => refresh()" />
    </template>
    <template #content>
      <UTable sticky :loading="pending" :columns="columns" :data="data" />
    </template>
    <template v-if="loggedIn" #footer>
      <LazyModalDuelReport v-if="ownDuel" :id="ownDuel.id" />
      <LazyModalDuelRequest v-else />
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

  const { loggedIn, session } = useUserSession();

  const UserInfo = resolveComponent("UserInfo");
  const NuxtTime = resolveComponent("NuxtTime");

  const columns = computed<TableColumn<DuelWithParticipantsData>[]>(() => [
    {
      accessorKey: "codeword",
      header: fluent.$t("table-col-codeword"),
      cell: ({ row }) => {
        const value = row.original.codeword;

        // Capitalize the first letter of the codeword.
        return value[0]!.toUpperCase() + value.slice(1);
      },
    },
    {
      accessorKey: "participants",
      header: fluent.$t("table-col-participants"),
      cell: ({ row }) => {
        return h(
          "div",
          { class: "space-y-2" },
          row.original.participants.map((p) =>
            h(UserInfo, {
              key: p.id,
              variant: "simple",
              ...p,
            }),
          ),
        );
      },
    },
    {
      accessorKey: "startedAt",
      header: fluent.$t("table-col-deadline"),
      cell: ({ row }) => {
        // Calculate the deadline based on the duel's startedAt time.
        const datetime = dayjs(row.original.startedAt).add(DUEL_PERIOD, "milliseconds").toDate();

        const absolute = h(NuxtTime, { datetime, ...DEFAULT_DATETIME_FORMAT_OPTIONS });
        const relative = h(NuxtTime, { datetime, relative: true });

        return h("div", [absolute, h("br"), "(", relative, ")"]);
      },
    },
  ]);

  const { data, pending, error, refresh } = await useAsyncData(
    "active-duels",
    () => DuelsApi.getActiveDuelsWithParticipants(),
    {
      lazy: true,
    },
  );
  const ownDuel = computed(() =>
    data.value?.find((duel) => duel.participants.some((p) => p.id === session.value?.user?.id)),
  );

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
