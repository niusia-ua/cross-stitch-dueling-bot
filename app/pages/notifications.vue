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
      <UProgress v-if="pending" size="xs" />
      <div v-if="data?.length" class="flex flex-col gap-y-2">
        <NotificationDuelRequest
          v-for="request in data"
          :key="request.id"
          v-bind="request"
          @accept="handleDuelRequest(request.id, DuelRequestAction.Accept)"
          @decline="handleDuelRequest(request.id, DuelRequestAction.Decline)"
        />
      </div>
      <div v-else class="text-center text-dimmed">
        {{ $t("message-no-notifications") }}
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem } from "@nuxt/ui";

  import { DuelRequestAction } from "#shared/types/duels.js";

  import { DuelsApi, FetchError, type ApiError } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();

  const { data, pending, error, refresh } = await useAsyncData("notifications", () => DuelsApi.getUserDuelRequests(), {
    lazy: true,
  });

  watch(error, (err) => {
    if (err) {
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-failed-to-fetch-notifications"),
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

  async function handleDuelRequest(requestId: number, action: DuelRequestAction) {
    try {
      await DuelsApi.handleDuelRequest(requestId, action);
      toast.add({
        color: "success",
        title: fluent.$t("message-success-title"),
        description:
          action === DuelRequestAction.Accept
            ? fluent.$t("message-success-description-duel-request-accepted")
            : fluent.$t("message-success-description-duel-request-declined"),
      });

      // Remove the processed request from the local data.
      data.value = data.value!.filter((request) => request.id !== requestId);
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

        if (data?.code === ApiErrorCode.NotFound) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-duel-request-not-found"),
          });
          return;
        }

        if (data?.code === ApiErrorCode.NotAllowed) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-handle-duel-request-not-allowed"),
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

        if (data?.code === ApiErrorCode.OtherUserAlreadyInDuel) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-other-user-already-in-duel"),
          });
          return;
        }
      }

      console.error("Failed to handle duel request:", error);
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-unknown"),
      });
    }
  }
</script>

<fluent locale="uk">
page-title = Повідомлення

menu-opt-refresh = Оновити

message-no-notifications = Немає нових повідомлень.

message-success-title = Успіх
message-success-description-duel-request-accepted = Виклик на дуель прийнято.
message-success-description-duel-request-declined = Виклик на дуель відхилено.

message-error-title = Сталася помилка
message-error-description-failed-to-fetch-notifications = Не вдалося отримати список повідомлень.
message-error-description-you-already-in-duel = Ви не можете прийняти або відхилити цей виклик, оскільки вже берете участь у дуелі.
message-error-description-cant-duel-the-day-before-weekly-random-duels = Ви не можете прийняти або відхилити виклик на дуель напередодні щотижневих випадкових дуелей.
message-error-description-duel-request-not-found = Запит на дуель більше не дійсний.
message-error-description-handle-duel-request-not-allowed = Вам не дозволено обробляти цей виклик на дуель.
message-error-description-other-user-already-in-duel = Користувач, який надіслав виклик, вже бере участь у іншій дуелі.
message-error-description-unknown =
  Не вдалося прийняти або відхилити виклик на дуель.
  Будь ласка, спробуйте ще раз.
</fluent>
