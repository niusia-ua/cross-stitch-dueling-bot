<template>
  <UModal v-model:open="open" fullscreen :title="$t('dialog-title')" @after:leave="() => clear()">
    <UButton icon="i-lucide:file-plus" :label="$t('label-send-duel-report')" class="w-full justify-center" />

    <template #body>
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
  </UModal>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from "@nuxt/ui";

  import { DuelReportRequestSchema } from "#shared/types/duels.js";
  import { DuelsApi, FetchError, type ApiError } from "~/api/";

  interface DuelReportProps {
    /** The ID of the duel. */
    id: number;
  }

  const toast = useToast();
  const fluent = useFluent();

  const { id } = defineProps<DuelReportProps>();

  const open = ref(false);
  const report = reactive<DuelReportRequest>({
    photos: [],
    stitches: 0,
    additionalInfo: null,
  });

  async function handleSubmit(e: FormSubmitEvent<DuelReportRequest>) {
    try {
      await DuelsApi.sendDuelReport(id, e.data);
      toast.add({
        color: "success",
        title: fluent.$t("message-success-title"),
        description: fluent.$t("message-success-description-duel-report-submitted"),
      });

      open.value = false;
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
        description: fluent.$t("message-error-description-unknown"),
      });
    }
  }

  function clear() {
    report.photos = [];
    report.stitches = 0;
    report.additionalInfo = null;
  }
</script>

<fluent locale="uk">
dialog-title = Звіт дуелі

form-field-photos-label = Фото прогресу
form-field-photos-description = Натисніть, щоб завантажити фото

form-field-stitches-label = Кількість стібків

form-field-additional-info-label = Додаткова інформація
form-field-additional-info-hint = Необов'язково

label-send-duel-report = Надіслати звіт

message-success-title = Успіх
message-success-description-duel-report-submitted = Звіт дуелі надіслано успішно!

message-error-title = Сталася помилка
message-error-description-duel-report-not-allowed = Вам не дозволено надсилати звіт цієї дуелі.
message-error-description-duel-not-found = Дуель не знайдено.
message-error-description-duel-not-active = Дуель вже завершена.
message-error-description-unknown =
  Не вдалося надіслати звіт дуелі.
  Будь ласка, спробуйте ще раз.
</fluent>
