<template>
  <NuxtLayout name="main">
    <template #header>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ $t("page-title") }}</h1>
        <UDropdownMenu :items="menuOptions">
          <UButton color="neutral" variant="ghost" icon="i-lucide:ellipsis-vertical" />
        </UDropdownMenu>
      </div>
    </template>

    <template #content>
      <div class="h-full flex flex-col gap-y-2">
        <div class="grow overflow-y-auto">
          <UTable sticky :loading="pending" :columns="columns" :data="data" :sorting="sorting" />
        </div>

        <ClientOnly v-if="loggedIn">
          <UButton
            v-if="ownDuel"
            :to="`/duels/${ownDuel.id}/report`"
            icon="i-lucide:file-plus"
            :label="$t('label-send-duel-report')"
            class="w-full justify-center"
          />
          <UButton
            v-else
            to="/duels/requests"
            icon="i-lucide:sword"
            :label="$t('label-send-duel-request')"
            class="w-full justify-center"
          />
        </ClientOnly>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
  import type { SortingState } from "@tanstack/vue-table";
  import { capitalize } from "es-toolkit";

  import { DuelsApi } from "~/api/index.js";

  const fluent = useFluent();
  const toast = useToast();

  const config = useRuntimeConfig();
  const { $selectedLocale } = useNuxtApp();
  const { loggedIn, session } = useUserSession();

  const UButton = resolveComponent("UButton");
  const UUser = resolveComponent("UUser");
  const NuxtTime = resolveComponent("NuxtTime");

  const columns = computed<TableColumn<ActiveDuelRecord>[]>(() => [
    {
      accessorKey: "codeword",
      header: fluent.$t("table-col-codeword"),
      cell: ({ row }) => capitalize(row.original.codeword),
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
      accessorKey: "deadline",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return h(UButton, {
          color: "neutral",
          variant: "ghost",
          label: fluent.$t("table-col-deadline"),
          icon: isSorted
            ? isSorted === "asc"
              ? "i-lucide:arrow-up-narrow-wide"
              : "i-lucide:arrow-down-wide-narrow"
            : "i-lucide:arrow-up-down",
          onClick: () => column.toggleSorting(isSorted === "asc"),
        });
      },
      cell: ({ row }) => {
        const absolute = h(NuxtTime, {
          datetime: row.original.deadline,
          locale: $selectedLocale.value,
          ...config.public.datetime.defaultFormatOptions,
        });
        const relative = h(NuxtTime, {
          datetime: row.original.deadline,
          locale: $selectedLocale.value,
          relative: true,
        });
        return h("div", [absolute, h("br"), "(", relative, ")"]);
      },
    },
  ]);
  const sorting = ref<SortingState>([{ id: "deadline", desc: false }]);

  const { data, pending, error, refresh } = await useAsyncData("active-duels", () => DuelsApi.getActiveDuels(), {
    lazy: true,
  });
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

  const menuOptions = computed<DropdownMenuItem[][]>(() => [
    [
      {
        icon: "i-lucide:refresh-cw",
        label: fluent.$t("menu-opt-refresh"),
        onSelect: () => refresh(),
      },
    ],
    [
      {
        icon: "i-lucide:archive",
        label: fluent.$t("menu-opt-archive"),
        to: "/duels/archive",
      },
    ],
  ]);
</script>

<fluent locale="uk">
page-title = Дуелі

menu-opt-refresh = Оновити
menu-opt-archive = Архів

table-col-codeword = КС
table-col-participants = Учасники
table-col-deadline = Дедлайн

label-send-duel-request = Кинути виклик
label-send-duel-report = Надіслати звіт

message-error-title = Сталася помилка
message-error-description-failed-to-fetch-active-duels = Не вдалося отримати список активних дуелей.
</fluent>
