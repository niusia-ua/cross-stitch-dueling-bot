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
      <UTable sticky :loading="pending" :columns="columns" :data="data" />
    </template>

    <template #footer>
      <div class="flex items-center gap-x-4">
        <UButton
          :disabled="!canGoPrev || pending"
          block
          size="sm"
          color="neutral"
          variant="soft"
          leading-icon="i-lucide:chevron-left"
          class="text-nowrap"
          @click="goToPrevMonth"
        >
          {{ prevMonthLabel }}
        </UButton>
        <div class="text-xs font-medium text-primary text-nowrap">{{ currentMonthLabel }}</div>
        <UButton
          :disabled="!canGoNext || pending"
          block
          size="sm"
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide:chevron-right"
          class="text-nowrap"
          @click="goToNextMonth"
        >
          {{ nextMonthLabel }}
        </UButton>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
  import { capitalize } from "es-toolkit";

  import { DuelsApi, UsersApi } from "~/api/index.js";

  const router = useRouter();

  const fluent = useFluent();
  const toast = useToast();

  const config = useRuntimeConfig();
  const { $selectedLocale } = useNuxtApp();

  const UIcon = resolveComponent("UIcon");
  const UUser = resolveComponent("UUser");
  const NuxtTime = resolveComponent("NuxtTime");

  // Current year and month state.
  const now = new Date();
  const currentYear = ref(now.getFullYear());
  const currentMonth = ref(now.getMonth() + 1); // 1-12

  // Fetch users and create a map for quick user lookup.
  const { data: users } = await useAsyncData("users", () => UsersApi.getAllUsers(), { lazy: true });
  const usersMap = computed(() => {
    if (!users.value) return new Map();
    return new Map(users.value.map((user) => [user.id, user]));
  });

  // Fetch duels and transform them to include user information.
  const {
    data: duels,
    pending,
    error,
    refresh,
  } = await useAsyncData(
    () => `archived-duels-${currentYear.value}-${currentMonth.value}`,
    () => DuelsApi.getArchivedDuels(currentYear.value, currentMonth.value),
    {
      lazy: true,
      watch: [currentYear, currentMonth],
    },
  );
  const data = computed(() => {
    if (!duels.value || !usersMap.value.size) return [];
    return duels.value.map((duel) => ({
      ...duel,
      participants: duel.participants.map((userId) => usersMap.value.get(userId)).filter(Boolean),
    }));
  });

  watch(error, (err) => {
    if (err) {
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-failed-to-fetch-archived-duels"),
      });
    }
  });

  const columns = computed<TableColumn<(typeof data.value)[number]>[]>(() => [
    {
      accessorKey: "codeword",
      header: fluent.$t("table-col-codeword"),
      cell: ({ row }) => capitalize(row.original.codeword),
    },
    {
      accessorKey: "participants",
      header: fluent.$t("table-col-participants"),
      cell: ({ row }) => {
        const winnerId = row.original.winnerId;
        return h(
          "div",
          { class: "space-y-2" },
          row.original.participants.map((user) => {
            return h(
              "div",
              { key: user.id, class: "flex items-center gap-x-2" },
              [
                h(UUser, {
                  size: "sm",
                  name: user.fullname,
                  description: getStitchesRateLabel(user.stitchesRate),
                  avatar: user.photoUrl ? { src: user.photoUrl } : undefined,
                }),
                user.id === winnerId
                  ? h(UIcon, {
                      name: "i-lucide:trophy",
                      class: "size-4 text-yellow-500 flex-shrink-0",
                    })
                  : null,
              ].filter(Boolean),
            );
          }),
        );
      },
    },
    {
      accessorKey: "completedAt",
      header: fluent.$t("table-col-completed-at"),
      cell: ({ row }) => {
        const absolute = h(NuxtTime, {
          datetime: row.original.completedAt,
          locale: $selectedLocale.value,
          ...config.public.DEFAULT_DATETIME_FORMAT_OPTIONS,
        });
        const relative = h(NuxtTime, {
          datetime: row.original.completedAt,
          locale: $selectedLocale.value,
          relative: true,
        });
        return h("div", [absolute, h("br"), "(", relative, ")"]);
      },
    },
  ]);

  const currentMonthLabel = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value - 1);
    return capitalize(date.toLocaleDateString($selectedLocale.value, { year: "numeric", month: "short" }));
  });
  const prevMonthLabel = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value - 2);
    return capitalize(date.toLocaleDateString($selectedLocale.value, { year: "numeric", month: "short" }));
  });
  const nextMonthLabel = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value);
    return capitalize(date.toLocaleDateString($selectedLocale.value, { year: "numeric", month: "short" }));
  });
  const canGoNext = computed(() => {
    const next = new Date(currentYear.value, currentMonth.value);
    return next <= now;
  });
  const canGoPrev = computed(() => {
    // The bot was first introduced in May 2025.
    return currentYear.value > 2025 || (currentYear.value === 2025 && currentMonth.value > 5);
  });

  function goToPrevMonth() {
    if (!canGoPrev.value) return;
    if (currentMonth.value === 1) {
      currentMonth.value = 12;
      currentYear.value -= 1;
    } else currentMonth.value -= 1;
  }

  function goToNextMonth() {
    if (!canGoNext.value) return;
    if (currentMonth.value === 12) {
      currentMonth.value = 1;
      currentYear.value += 1;
    } else currentMonth.value += 1;
  }

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
page-title = Архів дуелей

menu-opt-refresh = Оновити

table-col-codeword = КС
table-col-participants = Учасники
table-col-completed-at = Завершено

message-error-title = Сталася помилка
message-error-description-failed-to-fetch-archived-duels = Не вдалося отримати архів дуелей.
</fluent>
