import type { UserFromGetMe } from "grammy/types";

declare module "nuxt/schema" {
  interface RuntimeConfig {
    APP_URL: string;

    BOT_TOKEN: string;
    BOT_WEBHOOK_SECRET_TOKEN: string;
    BOT_INFO: UserFromGetMe;

    TARGET_CHAT_ID: number;
    TARGET_THREAD_ID: number;

    DATABASE_URL: string;

    GOOGLE_CLOUD_PROJECT_ID: string;
    GOOGLE_CLOUD_TASKS_LOCATION: string;
  }

  interface PublicRuntimeConfig {
    DEFAULT_TIMEZONE: string;
    DEFAULT_DATETIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions;

    DUEL_REQUEST_VALIDITY_PERIOD: number;
    DUEL_PERIOD: number;

    DUEL_REPORT_REMINDER_TIMEOUTS: number[];
  }
}

export {};
