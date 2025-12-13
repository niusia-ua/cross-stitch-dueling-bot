<template>
  <NuxtLayout>
    <template #header>
      <div class="flex items-center gap-x-2">
        <UButton icon="i-lucide:arrow-left" color="neutral" variant="ghost" @click="router.back()" />
        <h1 class="text-2xl font-bold">{{ $t("page-title") }}</h1>
      </div>
    </template>

    <template #content>
      <UForm
        :schema="DuelReportRequestSchema"
        :state="report"
        class="h-full flex flex-col gap-y-2"
        @submit="handleSubmit"
      >
        <div class="grow space-y-2 overflow-y-auto">
          <UFormField name="photos" :label="$t('form-field-photos-label')">
            <UFileUpload
              v-model="report.photos"
              multiple
              layout="list"
              accept="image/*"
              :description="$t('form-field-photos-description')"
            />
          </UFormField>

          <UFormField name="stitches" :label="$t('form-field-stitches-label')">
            <UInputNumber
              v-model="report.stitches"
              orientation="vertical"
              :min="0"
              :step-snapping="false"
              class="w-full"
            />
          </UFormField>

          <UFormField
            name="additionalInfo"
            :label="$t('form-field-additional-info-label')"
            :hint="$t('form-field-additional-info-hint')"
          >
            <UTextarea v-model="report.additionalInfo" autoresize class="w-full" />
          </UFormField>
        </div>

        <UButton
          loading-auto
          type="submit"
          icon="i-lucide:file-up"
          :label="$t('label-send-duel-report')"
          class="w-full justify-center"
        />
      </UForm>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from "@nuxt/ui";

  import { DuelReportRequestSchema } from "#shared/types/duels";
  import { DuelsApi, FetchError, type ApiError } from "~/api/";

  definePageMeta({
    validate: (route) => IdSchema.safeParse(route.params.id).success,
    middleware: [
      async (to) => {
        const duelId = Number(to.params.id);
        try {
          const userParticipatesInDuel = await DuelsApi.getUserDuelParticipation({ duelId });
          if (!userParticipatesInDuel) return navigateTo("/duels");
        } catch (error) {
          console.error("Failed to get user duel participation:", error);
          return navigateTo("/duels");
        }
      },
    ],
  });

  const route = useRoute();
  const router = useRouter();
  const toast = useToast();
  const fluent = useFluent();

  const report = reactive<DuelReportRequest>({
    photos: [],
    stitches: 0,
    additionalInfo: null,
  });

  async function handleSubmit(e: FormSubmitEvent<DuelReportRequest>) {
    try {
      await DuelsApi.sendDuelReport(Number(route.params.id), e.data);
      toast.add({
        color: "success",
        title: fluent.$t("message-success-title"),
        description: fluent.$t("message-success-description-duel-report-submitted"),
      });
      router.push("/duels");
    } catch (error) {
      if (error instanceof FetchError) {
        const data = (error as ApiError).data?.data;

        if (data?.code === ApiErrorCode.NotAllowed) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-duel-report-not-allowed"),
          });
          return;
        }

        if (data?.code === ApiErrorCode.NotFound) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-duel-report-not-found"),
          });
          return;
        }

        if (data?.code === ApiErrorCode.DuelNotActive) {
          console.error(data.message, data.details);
          toast.add({
            color: "error",
            title: fluent.$t("message-error-title"),
            description: fluent.$t("message-error-description-duel-not-active"),
          });
          return;
        }
      }

      console.error("Failed to submit duel report:", error);
      toast.add({
        color: "error",
        title: fluent.$t("message-error-title"),
        description: fluent.$t("message-error-description-unknown", {
          error: error instanceof Error ? error.message : String(error),
        }),
        actions: [
          {
            label: "Copy Error",
            color: "neutral",
            variant: "outline",
            async onClick(e) {
              e?.stopPropagation();
              try {
                const errorDetails =
                  error instanceof Error
                    ? `${error.message}\n\n${error.stack || "No stack trace available"}`
                    : String(error);
                await navigator.clipboard.writeText(errorDetails);
              } catch (error) {
                console.error("Failed to copy error to clipboard:", error);
              }
            },
          },
        ],
      });
    }
  }
</script>

<fluent locale="uk">
page-title = Звіт дуелі

form-field-photos-label = Фото прогресу
form-field-photos-description = Натисніть, щоб завантажити фото

form-field-stitches-label = Кількість стібків

form-field-additional-info-label = Додаткова інформація
form-field-additional-info-hint = Необов'язково

label-send-duel-report = Надіслати звіт

message-success-title = Успіх
message-success-description-duel-report-submitted = Звіт дуелі надіслано успішно!

message-error-title = Сталася помилка
message-error-description-duel-not-found = Дуель не знайдено.
message-error-description-not-participant = Ви не можете надіслати звіт, оскільки не берете участь у цій дуелі.
message-error-description-duel-report-not-allowed = Вам не дозволено надсилати звіт цієї дуелі.
message-error-description-duel-not-active = Дуель вже завершена.
message-error-description-unknown =
  Не вдалося надіслати звіт дуелі: { $error }.
  Будь ласка, спробуйте ще раз.
</fluent>
