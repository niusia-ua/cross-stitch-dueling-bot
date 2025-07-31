<template>
  <NuxtLayout>
    <template #title>{{ $t("page-title") }}</template>
    <template #content>
      <UProgress v-if="pending" size="xs" />
      <div v-if="data?.length" class="flex flex-col gap-y-2">
        <DuelRequest
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
  import { DuelRequestAction } from "#shared/types/duel.js";
  import { DuelsApi } from "~/api/";

  const fluent = useFluent();
  const toast = useToast();

  const { data, pending, error } = await useAsyncData("notifications", () => DuelsApi.getUserDuelRequests(), {
    lazy: true,
  });

  watch(error, (err) => {
    if (err) {
      toast.add({ color: "error", description: fluent.$t("message-fetch-notifications-failure") });
    }
  });

  async function handleDuelRequest(requestId: number, action: DuelRequestAction) {
    try {
      await DuelsApi.handleDuelRequest(requestId, action);
      toast.add({ color: "success", description: fluent.$t(`message-duel-request-${action}-success`) });

      // Remove the processed request from the local data.
      data.value = data.value!.filter((request) => request.id !== requestId);
    } catch (err) {
      console.error("Failed to process duel request:", err);
      toast.add({ color: "error", description: fluent.$t(`message-duel-request-${action}-failure`) });
    }
  }
</script>

<fluent locale="uk">
page-title = Повідомлення

message-fetch-notifications-failure = Не вдалося отримати список повідомлень
message-no-notifications = Немає нових повідомлень

message-duel-request-accept-success = Запит на дуель прийнято
message-duel-request-accept-failure = Не вдалося прийняти запит на дуель

message-duel-request-decline-success = Запит на дуель відхилено
message-duel-request-decline-failure = Не вдалося відхилити запит на дуель
</fluent>
