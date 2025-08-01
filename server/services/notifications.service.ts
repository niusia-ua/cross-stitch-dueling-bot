import type { BotApi, BotI18n } from "~~/server/bot/";

interface Dependencies {
  botApi: BotApi;
  botI18n: BotI18n;
}

export class NotificationsService {
  #botApi: BotApi;
  #botI18n: BotI18n;

  constructor({ botApi, botI18n }: Dependencies) {
    this.#botApi = botApi;
    this.#botI18n = botI18n;
  }

  private mentionUser(user: MinimalUserData, options?: { skipFormatting?: boolean }) {
    const { id, fullname } = user;
    if (options?.skipFormatting) return fullname;
    return `<a href="tg://user?id=${id}">${fullname}</a>`;
  }

  async notifyUserDuelRequested(toUserId: number, fromUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-requested", { user: this.mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUserDuelRequestAccepted(toUserId: number, fromUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-request-accepted", { user: this.mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUserDuelRequestDeclined(toUserId: number, fromUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-request-declined", { user: this.mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUsersDuelRequestExpired(fromUser: MinimalUserData, toUser: MinimalUserData) {
    const message = this.#botI18n.t("uk", "message-duel-request-expired", {
      fromUser: this.mentionUser(fromUser),
      toUser: this.mentionUser(toUser),
    });
    await this.#botApi.sendMessage(fromUser.id, message);
    await this.#botApi.sendMessage(toUser.id, message);
  }
}

type MinimalUserData = Pick<User, "id" | "fullname">;
