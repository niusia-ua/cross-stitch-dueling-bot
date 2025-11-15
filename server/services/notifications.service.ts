import { zip } from "es-toolkit";
import { InlineKeyboard, InputFile, InputMediaBuilder, type RawApi } from "grammy";
import type { InputMediaPhoto, Message } from "grammy/types";

import type { BotApi, BotI18n } from "~~/server/bot/";
import type { UserIdAndFullname } from "~~/shared/types/users.js";

interface Dependencies {
  botApi: BotApi;
  botI18n: BotI18n;
}

export class NotificationsService {
  #botApi: BotApi;
  #botI18n: BotI18n;

  #config = useRuntimeConfig();
  #datetimeFormatter = new Intl.DateTimeFormat("uk", this.#config.public.DEFAULT_DATETIME_FORMAT_OPTIONS);

  constructor({ botApi, botI18n }: Dependencies) {
    this.#botApi = botApi;
    this.#botI18n = botI18n;
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
      chat_id: this.#config.TARGET_CHAT_ID,
      message_thread_id: this.#config.TARGET_THREAD_ID,
      text: message,
    });
  }

  /** Send a private message with a media group (an album). */
  #sendPrivateMediaMessage(chatId: number, media: InputMediaPhoto[], options?: SendMessageOptions) {
    return this.#botApi.sendMediaGroup(chatId, media, options);
  }

  /** Send a group message with a media group (an album). */
  #sendGroupMediaMessage(media: InputMediaPhoto[], options?: SendMessageOptions) {
    // Use the Raw API call to ensure that the `chat_id` and `message_thread_id` are set correctly.
    return this.#botApi.raw.sendMediaGroup({
      ...options,
      chat_id: this.#config.TARGET_CHAT_ID,
      message_thread_id: this.#config.TARGET_THREAD_ID,
      media,
    });
  }

  /** Send a private message with a sticker to a user. */
  #sendPrivateSticker(chatId: number, photo: InputFile) {
    return this.#botApi.sendSticker(chatId, photo);
  }

  /**
   * Notifies a user that they have been requested to a duel.
   * @param toUserId The ID of the user who received the notification.
   * @param fromUser The user who sent the duel request.
   */
  async notifyUserDuelRequested(toUserId: number, fromUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-requested", { user: mentionUser(fromUser) });
    const keyboard = new InlineKeyboard().webApp(
      this.#botI18n.t("uk", "label-open"),
      new URL("/notifications", this.#config.APP_URL).href,
    );
    await this.#sendPrivateMessage(toUserId, message, { reply_markup: keyboard });
  }

  /**
   * Notifies a user that their duel request has been accepted.
   * @param toUserId The ID of the user who received the notification.
   * @param fromUser The user who sent the duel request.
   */
  async notifyUserDuelRequestAccepted(toUserId: number, fromUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-request-accepted", { user: mentionUser(fromUser) });
    await this.#sendPrivateMessage(toUserId, message);
  }

  /**
   * Notifies a user that their duel request has been declined.
   * @param toUserId The ID of the user who received the notification.
   * @param fromUser The user who sent the duel request.
   */
  async notifyUserDuelRequestDeclined(toUserId: number, fromUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-request-declined", { user: mentionUser(fromUser) });
    await this.#sendPrivateMessage(toUserId, message);
  }

  /**
   * Notifies both users about an expired duel request.
   * @param fromUser The user who sent the duel request.
   * @param toUser The user who received the duel request.
   */
  async notifyUsersDuelRequestExpired(fromUser: UserIdAndFullname, toUser: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-request-expired", {
      fromUser: mentionUser(fromUser),
      toUser: mentionUser(toUser),
    });
    await this.#sendPrivateMessage(fromUser.id, message);
    await this.#sendPrivateMessage(toUser.id, message);
  }

  async remindUserAboutDuelReport(userId: number, deadline: Date) {
    const message = this.#botI18n.t("uk", "message-duel-report-reminder", {
      deadline: this.#datetimeFormatter.format(deadline),
    });
    await this.#sendPrivateMessage(userId, message);
  }

  /**
   * Announces a duel in the group chat.
   * @param codeword The codeword for the duel.
   * @param deadline The deadline for the duel.
   * @param user1 The first participant in the duel.
   * @param user2 The second participant in the duel.
   */
  async announceDuel(codeword: string, deadline: Date, user1: UserIdAndFullname, user2: UserIdAndFullname) {
    const message = this.#botI18n.t("uk", "message-duel-announcement", {
      codeword,
      deadline: this.#datetimeFormatter.format(deadline),
      user1: mentionUser(user1),
      user2: mentionUser(user2),
    });
    await this.#sendGroupMessage(message);
  }

  /**
   * Announces weekly random duels.
   * @param codeword The codeword for the duels.
   * @param deadline The deadline for the duels.
   * @param pairs The pairs of users participating in the duels.
   */
  async announceWeeklyRandomDuels(codeword: string, deadline: Date, pairs: UserIdAndFullname[][]) {
    const mentionedPairs = pairs.map((pair, i) => `${i + 1}. ${pair.map((user) => mentionUser(user)).join(", ")}.`);
    const formattedDeadline = this.#datetimeFormatter.format(deadline);

    const message = this.#botI18n.t("uk", "message-weekly-random-duels-announcement", {
      codeword,
      deadline: formattedDeadline,
      pairs: mentionedPairs.join("\n"),
    });
    await this.#sendGroupMessage(message);

    // Notify each user in the pair about the weekly random duel start.
    await Promise.all(
      pairs.flatMap(async (pair, i) => {
        const message = this.#botI18n.t("uk", "message-weekly-random-duels-started", {
          codeword,
          deadline: formattedDeadline,
          pair: mentionedPairs[i],
        });
        return pair.map((user) => this.#sendPrivateMessage(user.id, message));
      }),
    );
  }

  /**
   * Posts the results of a duel (users' reports and the winner) in the group chat.
   * @param codeword The codeword for the duel.
   * @param participants The participants in the duel.
   * @param reports The reports for each participant.
   * @param photos The photos for each report.
   * @param winner The winner of the duel.
   */
  async postDuelResults(
    codeword: string,
    participants: readonly UserIdAndFullname[],
    reports: readonly (DuelReportData | null)[],
    photos: InputFileSource[][],
    winner: UserIdAndFullname | null,
  ) {
    // Get a funny sticker for those who haven't sent a report.
    const storage = useStorage("assets:server");
    const sticker = (await storage.getItemRaw<Uint8Array>("images/sticker.webp"))!;

    // Post a message with the duel overview.
    await this.#sendGroupMessage(
      this.#botI18n.t(
        "uk",
        winner !== null ? "message-duel-completed-with-winner" : "message-duel-completed-without-winner",
        {
          codeword,
          participants: participants.map((p) => mentionUser(p)).join(", "),
          winner: winner ? mentionUser(winner) : "",
        },
      ),
    );

    // Post each report.
    await Promise.allSettled(
      zip(participants, reports).flatMap<Promise<Message | Message[]>>(([user, report], i) => {
        if (!report || report.stitches === 0) {
          return [
            // Send a message about the lack of report.
            this.#sendGroupMessage(this.#botI18n.t("uk", "message-duel-no-report", { user: mentionUser(user) }), {
              disable_notification: true,
            }),
            // Send a funny sticker to this user.
            this.#sendPrivateSticker(user.id, new InputFile(sticker)),
          ];
        }

        const caption = this.#botI18n.t(
          "uk",
          report.additionalInfo !== null
            ? "message-duel-report-with-additional-info"
            : "message-duel-report-without-additional-info",
          {
            user: mentionUser(user),
            stitches: report.stitches,
            additionalInfo: report.additionalInfo ?? "",
          },
        );
        const media = photos[i].map((buffer, i) => {
          return InputMediaBuilder.photo(new InputFile(buffer), {
            // Attach a caption only to the first photo.
            // This way, the caption will be shown for the entire album.
            caption: i === 0 ? caption : undefined,
          });
        });

        return this.#sendGroupMediaMessage(media, { disable_notification: true });
      }),
    );
  }

  /**
   * Send the report preview to the user in a private chat.
   * @param userId The ID of the user to send the report preview to.
   * @param report The report data to send.
   * @param photos The photos to send as a media group.
   */
  sendReportPreview(user: UserIdAndFullname, report: DuelReportData, photos: InputFileSource[]) {
    const caption = this.#botI18n.t(
      "uk",
      report.additionalInfo !== null
        ? "message-duel-report-with-additional-info"
        : "message-duel-report-without-additional-info",
      {
        user: mentionUser(user),
        stitches: report.stitches,
        additionalInfo: report.additionalInfo ?? "",
      },
    );
    const media = photos.map((buffer, i) => {
      return InputMediaBuilder.photo(new InputFile(buffer), {
        // Attach a caption only to the first photo.
        // This way, the caption will be shown for the entire album.
        caption: i === 0 ? caption : undefined,
      });
    });

    return this.#sendPrivateMediaMessage(user.id, media);
  }

  /**
   * Posts the monthly rating and winners celebration in the group chat.
   * @param rating The rating records.
   * @param winners The winners.
   */
  async postMonthlyRatingAndWinners<T extends DuelsRatingWithUsersInfo>(rating: readonly T[], winners: readonly T[]) {
    // Get the month in a genitive case.
    const month = this.#datetimeFormatter.formatToParts(new Date()).find((part) => part.type === "month")!.value;

    const ratingMessage = this.#botI18n.t("uk", "message-monthly-rating", {
      month,
      rating: rating
        .map((record, i) => {
          const user = mentionUser(record.user, { skipFormatting: true });
          const stitchesRate = getStitchesRateLabel(record.user.stitchesRate);
          return `${i + 1}. ${user} (${stitchesRate}) — ${record.totalDuelsParticipated}/${record.totalDuelsWon}`;
        })
        .join("\n"),
    });
    await this.#sendGroupMessage(ratingMessage);

    const winnersMessage = this.#botI18n.t("uk", "message-monthly-winners", {
      month,
      winners: winners.map((w) => mentionUser(w.user)).join(", "),
    });
    await this.#sendGroupMessage(winnersMessage);
  }
}

function mentionUser(user: UserIdAndFullname, options?: { skipFormatting?: boolean }) {
  const { id, fullname } = user;
  if (options?.skipFormatting) return fullname;
  return `<a href="tg://user?id=${id}">${fullname}</a>`;
}

type SendMessageOptions = Omit<Parameters<RawApi["sendMessage"]>[0], "chat_id" | "text">;

type InputFileSource = ConstructorParameters<typeof InputFile>[0];
