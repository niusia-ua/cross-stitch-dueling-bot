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

  private mentionUser(user: Pick<UserData, "id" | "fullname">, options?: { skipFormatting?: boolean }) {
    const { id, fullname } = user;
    if (options?.skipFormatting) return fullname;
    return `<a href="tg://user?id=${id}">${fullname}</a>`;
  }

  async notifyUserDuelRequested(toUserId: number, fromUser: Pick<UserData, "id" | "fullname">) {
    const message = this.#botI18n.t("uk", "message-duel-requested", { user: this.mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUserDuelAccepted(toUserId: number, fromUser: Pick<UserData, "id" | "fullname">) {
    const message = this.#botI18n.t("uk", "message-duel-request-accepted", { user: this.mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }

  async notifyUserDuelDeclined(toUserId: number, fromUser: Pick<UserData, "id" | "fullname">) {
    const message = this.#botI18n.t("uk", "message-duel-request-declined", { user: this.mentionUser(fromUser) });
    await this.#botApi.sendMessage(toUserId, message);
  }
}
