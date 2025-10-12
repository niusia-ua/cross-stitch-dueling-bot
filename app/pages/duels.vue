<template>
  <NuxtLayout name="main">
    <template #header>{{ $t("page-title") }}</template>
    <template #header-actions>
      <UDropdownMenu :items="menuOptions">
        <UButton color="neutral" variant="ghost" icon="i-lucide:ellipsis-vertical" />
      </UDropdownMenu>
    </template>
    <template #content>
      <UTable sticky :loading="pending" :columns="columns" :data="data" :sorting="sorting" />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
  import type { SortingState } from "@tanstack/vue-table";

  import { DuelsApi } from "~/api/index.js";

  const fluent = useFluent();
  const toast = useToast();

  const config = useRuntimeConfig();
  const { $selectedLocale } = useNuxtApp();

  const UButton = resolveComponent("UButton");
  const UUser = resolveComponent("UUser");
  const NuxtTime = resolveComponent("NuxtTime");

  const columns = computed<TableColumn<ActiveDuelRecord>[]>(() => [
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
          ...config.public.DEFAULT_DATETIME_FORMAT_OPTIONS,
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
  ]);
</script>

<fluent locale="uk">
page-title = Активні дуелі

menu-opt-refresh = Оновити

table-col-codeword = КС
table-col-participants = Учасники
table-col-deadline = Дедлайн

message-error-title = Сталася помилка
message-error-description-failed-to-fetch-active-duels = Не вдалося отримати список активних дуелей.
</fluent>
