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
            <UInputNumber v-model="report.stitches" orientation="vertical" :min="0" class="w-full" />
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
  import { DuelReportRequestSchema } from "#shared/types/duel.js";

  import { DuelsApi } from "~/api/";

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
      toast.add({ color: "success", description: fluent.$t("message-send-duel-report-success") });

      open.value = false;
    } catch (err) {
      console.error(err);
      toast.add({ color: "error", description: fluent.$t("message-send-duel-report-failure") });
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

message-send-duel-report-success = Звіт дуелі надіслано успішно!
message-send-duel-report-failure = Не вдалося надіслати звіт дуелі
</fluent>
