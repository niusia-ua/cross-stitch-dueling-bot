import type { TelegramService } from "~~/server/infra/telegram/";
import type { GoogleCloudTasksService } from "~~/server/infra/gcloud/";
import type { UsersService } from "~~/server/modules/users/";
import type { DuelsService } from "~~/server/modules/duels/";
import type { DuelRequestsRepository } from "./duel-requests.repository.js";

export class DuelRequestsService {
  #telegramService: TelegramService;

  #gcloudTasksService: GoogleCloudTasksService;

  #usersService: UsersService;
  #duelsService: DuelsService;
  #duelRequestsRepository: DuelRequestsRepository;

  constructor({
    telegramService,
    gcloudTasksService,
    usersService,
    duelsService,
    duelRequestsRepository,
  }: ServiceDependencies) {
    this.#telegramService = telegramService;

    this.#gcloudTasksService = gcloudTasksService;

    this.#usersService = usersService;
    this.#duelsService = duelsService;
    this.#duelRequestsRepository = duelRequestsRepository;
  }

  /**
   * Retrieves the duel requests for a specific user.
   * @param userId The ID of the user.
   * @returns The duel requests for the user.
   */
  async getDuelRequestsForUser(userId: number) {
    return await this.#duelRequestsRepository.getDuelRequestsByUserId(userId);
  }

  /**
   * Sends duel requests from one user to multiple users.
   * @param fromUserId The ID of the user sending the requests.
   * @param toUserIds The IDs of the users receiving the requests.
   */
  async sendDuelRequests(fromUserId: number, toUserIds: number[]) {
    const participatesInDuel = await this.#duelsService.getUserDuelParticipation(fromUserId);
    if (participatesInDuel) {
      // Users can't send duel requests if they are already in a duel.
      throw createApiError({
        code: ApiErrorCode.UserAlreadyInDuel,
        message: "You are already participating in a duel.",
      });
    }

    if (isItTheDayBeforeWeeklyRandomDuels()) {
      // Users can't send duel requests the day before weekly random duels.
      throw createApiError({
        code: ApiErrorCode.CantDuelTheDayBeforeWeeklyRandomDuels,
        message: "You can't duel the day before weekly random duels.",
      });
    }

    const result = await this.#duelRequestsRepository.createDuelRequests(fromUserId, toUserIds);
    if (result.length) {
      // The number of the created duel requests may be less than the number of users requested.
      // If the another user has already been requested a duel, that request will be ignored to avoid duplicates.
      const fromUser = await this.#usersService.getUserIdAndFullname(fromUserId);
      await Promise.all(
        result.map(async (request) => {
          const messageId = await this.#telegramService.notifyUserDuelRequested(request.toUserId, fromUser!);
          await this.#duelRequestsRepository.setDuelRequestMessageId(request.id, messageId);
          await this.#gcloudTasksService.scheduleDuelRequestCancellation(request.id);
        }),
      );
    }
  }

  /**
   * Handles a duel request by accepting or declining it.
   * @param userId The ID of the user handling the request.
   * @param requestId The ID of the duel request.
   * @param action The action to perform (accept or decline).
   */
  async handleDuelRequest(userId: number, requestId: number, action: DuelRequestAction) {
    const participatesInDuel = await this.#duelsService.getUserDuelParticipation(userId);
    if (participatesInDuel) {
      // Users can't handle duel requests if they are already in a duel.
      await this.#duelRequestsRepository.removeDuelRequest(requestId);
      throw createApiError({
        code: ApiErrorCode.UserAlreadyInDuel,
        message: "You are already participating in a duel.",
      });
    }

    if (isItTheDayBeforeWeeklyRandomDuels()) {
      throw createApiError({
        code: ApiErrorCode.CantDuelTheDayBeforeWeeklyRandomDuels,
        message: "You can't duel the day before weekly random duels.",
      });
    }

    const duelRequest = await this.#duelRequestsRepository.getDuelRequestById(requestId);
    if (!duelRequest) {
      throw createApiError({
        code: ApiErrorCode.NotFound,
        message: "Duel request not found",
      });
    }
    if (duelRequest.toUserId !== userId) {
      throw createApiError({
        code: ApiErrorCode.NotAllowed,
        message: "You are not allowed to handle this duel request.",
      });
    }

    if (action === DuelRequestAction.Accept) return await this.#acceptDuelRequest(requestId);
    if (action === DuelRequestAction.Decline) return await this.#declineDuelRequest(requestId);
  }

  /**
   * Accepts a duel request.
   * @param requestId The ID of the duel request.
   */
  async #acceptDuelRequest(requestId: number) {
    const result = await this.#duelRequestsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;

      // Check if the user who sent the request is already in a duel.
      const fromUserParticipatesInDuel = await this.#duelsService.getUserDuelParticipation(fromUser.id);
      if (fromUserParticipatesInDuel) {
        throw createApiError({
          code: ApiErrorCode.OtherUserAlreadyInDuel,
          message: "The other user is already participating in a duel.",
        });
      }

      await this.#duelsService.createDuel(fromUser, toUser);

      await this.#telegramService.notifyUserDuelRequestAccepted(fromUser.id, toUser);
      await this.#deleteSiblingRequests(fromUser.id, requestId, fromUser);
    }
  }

  /**
   * Declines a duel request.
   * @param requestId The ID of the duel request.
   */
  async #declineDuelRequest(requestId: number) {
    const result = await this.#duelRequestsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;
      await this.#telegramService.notifyUserDuelRequestDeclined(fromUser.id, toUser);
    }
  }

  /**
   * Removes an expired duel request.
   * @param requestId The ID of the duel request.
   */
  async removeExpiredDuelRequest(requestId: number) {
    const request = await this.#duelRequestsRepository.removeDuelRequest(requestId);
    if (request) {
      const { fromUser, toUser, telegramMessageId } = request;
      await this.#telegramService.notifyUserDuelRequestExpired(fromUser.id, toUser);

      if (telegramMessageId !== null) {
        await this.#telegramService.notifyUserDuelRequestInvalidated(toUser.id, telegramMessageId, fromUser);
      }
    }
  }

  /**
   * Deletes all sibling duel requests and edits their Telegram messages.
   * @param fromUserId The ID of the user who sent the requests.
   * @param acceptedRequestId The ID of the request that was accepted.
   * @param fromUser The user who sent the requests.
   */
  async #deleteSiblingRequests(fromUserId: number, acceptedRequestId: number, fromUser: UserIdAndFullname) {
    const siblingRequests = await this.#duelRequestsRepository.getSiblingRequests(fromUserId, acceptedRequestId);
    if (siblingRequests.length === 0) return;

    await Promise.all(
      siblingRequests
        .filter((req) => req.telegramMessageId !== null)
        .map(async (req) => {
          await this.#telegramService.notifyUserDuelRequestInvalidated(req.toUserId, req.telegramMessageId!, fromUser);
          await this.#duelRequestsRepository.removeDuelRequest(req.id);
        }),
    );
  }
}
