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

  const { $selectedLocale } = useNuxtApp();
  const { loggedIn, session } = useUserSession();

  const UUser = resolveComponent("UUser");
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
          row.original.participants.map((user) =>
            h(UUser, {
              key: user.id,
              size: "sm",
              name: user.fullname,
              description: getStitchesRateLabel(user.stitchesRate),
              avatar: user.photoUrl ? { src: user.photoUrl } : undefined,
            }),
          ),
        );
      },
    },
    {
      accessorKey: "startedAt",
      header: fluent.$t("table-col-deadline"),
      cell: ({ row }) => {
        // Calculate the deadline based on the duel's starting time.
        const datetime = dayjs(row.original.startedAt).add(DUEL_PERIOD, "milliseconds").toDate();

        const absolute = h(NuxtTime, { datetime, locale: $selectedLocale.value, ...DEFAULT_DATETIME_FORMAT_OPTIONS });
        const relative = h(NuxtTime, { datetime, locale: $selectedLocale.value, relative: true });

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
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-failed-to-fetch-active-duels"),
      });
    }
  });
</script>

<fluent locale="uk">
page-title = Активні дуелі

table-col-codeword = КС
table-col-participants = Учасники
table-col-deadline = Дедлайн

message-error-title = Сталася помилка
message-error-description-failed-to-fetch-active-duels = Не вдалося отримати список активних дуелей.
</fluent>
