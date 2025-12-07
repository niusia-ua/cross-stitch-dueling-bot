import type { UserFromGetMe } from "grammy/types";

declare module "nuxt/schema" {
  interface RuntimeConfig {
    appUrl: string;
    databaseUrl: string;

    telegram: {
      bot: {
        token: string;
        info: UserFromGetMe;
        webhookSecretToken: string;
      };

      targetChatId: number;
      targetThreadId: number;
    };

    gcloud: {
      useEmulators: boolean;
      projectId: string;
      serviceAccountEmail: string;
      tasksLocation: string;
    };
  }

  interface PublicRuntimeConfig {
    datetime: {
      defaultTimezone: string;
      defaultFormatOptions: Intl.DateTimeFormatOptions;
    };

    duelPeriod: number;
    duelRequestValidityPeriod: number;

    duelReportReminderTimeouts: number[];
  }
}

export {};
