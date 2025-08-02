import { InlineKeyboard, type RawApi } from "grammy";
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

  #webAppUrl: string;
  #targetChatId: number;
  #targetThreadId: number;

  constructor({ botApi, botI18n }: Dependencies) {
    this.#botApi = botApi;
    this.#botI18n = botI18n;

    const config = useRuntimeConfig();
    this.#webAppUrl = config.APP_URL;
    this.#targetChatId = config.TARGET_CHAT_ID;
    this.#targetThreadId = config.TARGET_THREAD_ID;
  }

  /** Send a private message to a user. */
  #sendPrivateMessage(chatId: number, message: string, options?: SendMessageOptions) {
    return this.#botApi.sendMessage(chatId, message, options);
  }

  /** Send a group message. */
  #sendGroupMessage(message: string, options?: SendMessageOptions) {
    // Use the Raw API call to ensure that the `chat_id` and `message_thread_id` are set correctly.
    return this.#botApi.raw.sendMessage({
      ...options,
      chat_id: this.#targetChatId,
      message_thread_id: this.#targetThreadId,
      text: message,
    });
  }

  async notifyUserDuelRequested(toUserId: number, fromUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-requested", { user: mentionUser(fromUser) });
    const keyboard = new InlineKeyboard().webApp(this.#botI18n.t("uk", "label-open"), this.#webAppUrl);
    await this.#sendPrivateMessage(toUserId, message, { reply_markup: keyboard });
  }

  async notifyUserDuelRequestAccepted(toUserId: number, fromUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-request-accepted", { user: mentionUser(fromUser) });
    await this.#sendPrivateMessage(toUserId, message);
  }

  async notifyUserDuelRequestDeclined(toUserId: number, fromUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-request-declined", { user: mentionUser(fromUser) });
    await this.#sendPrivateMessage(toUserId, message);
  }

  async notifyUsersDuelRequestExpired(fromUser: UserIdAndFullname, toUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-request-expired", {
      fromUser: mentionUser(fromUser),
      toUser: mentionUser(toUser),
    });
    await this.#sendPrivateMessage(fromUser.id, message);
    await this.#sendPrivateMessage(toUser.id, message);
  }

  async announceDuel(codeword: string, deadline: Date, user1: UserIdAndFullname, user2: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-announcement", {
      codeword,
      deadline: this.#datetimeFormatter.format(deadline),
      user1: mentionUser(user1),
      user2: mentionUser(user2),
    });
    await this.#sendGroupMessage(message);
  }
}

function mentionUser(user: UserIdAndFullname, options?: { skipFormatting?: boolean }) {
  const { id, fullname } = user;
  if (options?.skipFormatting) return fullname;
  return `<a href="tg://user?id=${id}">${fullname}</a>`;
}

type SendMessageOptions = Omit<Parameters<RawApi["sendMessage"]>[0], "chat_id" | "text">;
