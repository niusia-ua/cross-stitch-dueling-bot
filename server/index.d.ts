import type { UserFromGetMe } from "grammy/types";

declare module "nuxt/schema" {
  interface RuntimeConfig {
    BOT_TOKEN: string;
    BOT_WEBHOOK_SECRET_TOKEN: string;
    BOT_INFO: UserFromGetMe;
    BOT_WEB_APP_URL: string;

    TARGET_CHAT_ID: number;
    TARGET_THREAD_ID: number;

    JWT_SECRET: string;

    DATABASE_URL: string;
  }
}

export {};
