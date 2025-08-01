import { DEFAULT_DATETIME_FORMAT_OPTIONS } from "#shared/constants/datetime.js";

import type { BotApi, BotI18n } from "~~/server/bot/";

interface Dependencies {
  botApi: BotApi;
  botI18n: BotI18n;
}

export class NotificationsService {
  #botApi: BotApi;
  #botI18n: BotI18n;

  #datetimeFormatter = new Intl.DateTimeFormat("uk", DEFAULT_DATETIME_FORMAT_OPTIONS);

  #TARGET_CHAT_ID: number;
  #TARGET_THREAD_ID: number;

  constructor({ botApi, botI18n }: Dependencies) {
    this.#botApi = botApi;
    this.#botI18n = botI18n;

    const config = useRuntimeConfig();
    this.#TARGET_CHAT_ID = config.TARGET_CHAT_ID;
    this.#TARGET_THREAD_ID = config.TARGET_THREAD_ID;
  }

  async notifyUserDuelRequested(toUserId: number, fromUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-requested", { user: mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUserDuelRequestAccepted(toUserId: number, fromUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-request-accepted", { user: mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUserDuelRequestDeclined(toUserId: number, fromUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-request-declined", { user: mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUsersDuelRequestExpired(fromUser: MinimalUserData, toUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-request-expired", {
      fromUser: mentionUser(fromUser),
      toUser: mentionUser(toUser),
    });
    await this.#botApi.sendMessage(fromUser.id, message);
    await this.#botApi.sendMessage(toUser.id, message);
  }

  async announceDuel(codeword: string, deadline: Date, user1: MinimalUserData, user2: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-announcement", {
      codeword,
      deadline: this.#datetimeFormatter.format(deadline),
      user1: mentionUser(user1),
      user2: mentionUser(user2),
    });
    await this.#botApi.sendMessage(this.#TARGET_CHAT_ID, message, {
      reply_parameters: { message_id: this.#TARGET_THREAD_ID },
    });
  }
}

type MinimalUserData = Pick<User, "id" | "fullname">;
function mentionUser(user: MinimalUserData, options?: { skipFormatting?: boolean }) {
  const { id, fullname } = user;
  if (options?.skipFormatting) return fullname;
  return `<a href="tg://user?id=${id}">${fullname}</a>`;
}
