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
      <UTable sticky :loading="pending" :columns="columns" :data="data" />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";

  import { DuelsApi } from "~/api/index.js";

  const fluent = useFluent();
  const toast = useToast();

  const UUser = resolveComponent("UUser");

  const columns = computed<TableColumn<DuelsRatingWithUsersInfo>[]>(() => [
    {
      header: fluent.$t("table-col-rank"),
      cell: ({ row }) => row.index + 1,
    },
    {
      header: fluent.$t("table-col-user"),
      cell: ({ row }) => {
        const user = row.original.user;
        return h(UUser, {
          key: user.id,
          size: "sm",
          name: user.fullname,
          description: getStitchesRateLabel(user.stitchesRate),
          avatar: user.photoUrl ? { src: user.photoUrl } : undefined,
        });
      },
    },
    {
      accessorKey: "totalDuelsParticipated",
      header: fluent.$t("table-col-duels-participated"),
    },
    {
      accessorKey: "totalDuelsWon",
      header: fluent.$t("table-col-duels-won"),
    },
  ]);

  const { data, pending, error, refresh } = await useAsyncData("duels-rating", () => DuelsApi.getDuelsRating(), {
    lazy: true,
  });

  watch(error, (err) => {
    if (err) {
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-failed-to-fetch-duels-rating"),
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
page-title = Рейтинг

menu-opt-refresh = Оновити

table-col-rank = Місце
table-col-user = Користувач
table-col-duels-participated = Зіграно
table-col-duels-won = Переможено

message-error-title = Сталася помилка
message-error-description-failed-to-fetch-duels-rating = Не вдалося отримати рейтинг дуелей.
</fluent>
