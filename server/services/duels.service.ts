import { sample } from "es-toolkit";

import type {
  UsersService,
  NotificationsService,
  GoogleCloudTasksService,
  GoogleCloudStorageService,
} from "~~/server/services/";
import type { DuelsRepository } from "~~/server/repositories/";
import { dayjs } from "~~/server/utils/datetime.js";

interface Dependencies {
  duelsRepository: DuelsRepository;
  usersService: UsersService;
  notificationsService: NotificationsService;

  gcloudTasksService: GoogleCloudTasksService;
  gcloudStorageService: GoogleCloudStorageService;
}

/** Duel service for managing duel-related operations. */
export class DuelsService {
  #config = useRuntimeConfig();

  #duelsRepository: DuelsRepository;
  #usersService: UsersService;
  #notificationsService: NotificationsService;

  #gcloudTasksService: GoogleCloudTasksService;
  #gcloudStorageService: GoogleCloudStorageService;

  constructor({
    duelsRepository,
    usersService,
    notificationsService,
    gcloudTasksService,
    gcloudStorageService,
  }: Dependencies) {
    this.#duelsRepository = duelsRepository;
    this.#usersService = usersService;
    this.#notificationsService = notificationsService;

    this.#gcloudTasksService = gcloudTasksService;
    this.#gcloudStorageService = gcloudStorageService;
  }

  /**
   * Retrieves the list of active duels with their participants.
   * @returns The list of active duels with participants.
   */
  async getActiveDuelsWithParticipants() {
    const duels = await this.#duelsRepository.getActiveDuelsWithParticipants();
    return duels.map<ActiveDuelRecord>(({ startedAt, ...duel }) => ({
      ...duel,
      deadline: dayjs(startedAt).add(this.#config.public.DUEL_PERIOD, "milliseconds").toDate(),
    }));
  }

  /**
   * Retrieves the list of users who are available for a duel.
   * @param options.excludeUserId The user ID to exclude from the results.
   * @returns The list of available users for a duel.
   */
  async getAvailableUsersForDuel(options?: {
    /** The user ID to exclude from the results */
    excludeUserId?: number;
  }) {
    const result = await this.#duelsRepository.getAvailableUsersForDuel();
    return result.filter((user) => user.id !== options?.excludeUserId);
  }

  /**
   * Retrieves the duel requests for a specific user.
   * @param userId The ID of the user.
   * @returns The duel requests for the user.
   */
  async getDuelRequestsForUser(userId: number) {
    return await this.#duelsRepository.getDuelRequestsByUserId(userId);
  }

  /**
   * Sends duel requests from one user to multiple users.
   * @param fromUserId The ID of the user sending the requests.
   * @param toUserIds The IDs of the users receiving the requests.
   */
  async sendDuelRequests(fromUserId: number, toUserIds: number[]) {
    const participatesInDuel = await this.#duelsRepository.checkUserParticipationInDuel(fromUserId);
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

    const result = await this.#duelsRepository.createDuelRequests(fromUserId, toUserIds);
    if (result.length) {
      // The number of the created duel requests may be less than the number of users requested.
      // If the another user has already been requested a duel, that request will be ignored to avoid duplicates.
      const fromUser = await this.#usersService.getUserIdAndFullname(fromUserId);
      await Promise.all(
        result.map(async (request) => {
          await this.#notificationsService.notifyUserDuelRequested(request.toUserId, fromUser!);
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
    const participatesInDuel = await this.#duelsRepository.checkUserParticipationInDuel(userId);
    if (participatesInDuel) {
      // Users can't handle duel requests if they are already in a duel.
      await this.#duelsRepository.removeDuelRequest(requestId);
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

    const duelRequest = await this.#duelsRepository.getDuelRequestById(requestId);
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

    if (action === DuelRequestAction.Accept) return await this.acceptDuelRequest(requestId);
    if (action === DuelRequestAction.Decline) return await this.declineDuelRequest(requestId);
  }

  /**
   * Accepts a duel request.
   * @param requestId The ID of the duel request.
   */
  private async acceptDuelRequest(requestId: number) {
    const result = await this.#duelsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;

      // Check if the user who sent the request is already in a duel.
      const fromUserParticipatesInDuel = await this.#duelsRepository.checkUserParticipationInDuel(fromUser.id);
      if (fromUserParticipatesInDuel) {
        throw createApiError({
          code: ApiErrorCode.OtherUserAlreadyInDuel,
          message: "The other user is already participating in a duel.",
        });
      }

      await this.createDuel(fromUser, toUser);
      await this.#notificationsService.notifyUserDuelRequestAccepted(fromUser.id, toUser);
    }
  }

  /**
   * Declines a duel request.
   * @param requestId The ID of the duel request.
   */
  private async declineDuelRequest(requestId: number) {
    const result = await this.#duelsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;
      await this.#notificationsService.notifyUserDuelRequestDeclined(fromUser.id, toUser);
    }
  }

  /**
   * Removes an expired duel request.
   * @param requestId The ID of the duel request.
   */
  async removeExpiredDuelRequest(requestId: number) {
    const result = await this.#duelsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;
      await this.#notificationsService.notifyUsersDuelRequestExpired(fromUser, toUser);
    }
  }

  /**
   * Creates a duel between two users.
   * @param user1 The first user.
   * @param user2 The second user.
   */
  private async createDuel(user1: UserIdAndFullname, user2: UserIdAndFullname) {
    const codeword = await getRandomCodeword();
    const duel = await this.#duelsRepository.createDuel(codeword, user1.id, user2.id);
    const deadline = dayjs(duel.startedAt).add(this.#config.public.DUEL_PERIOD, "milliseconds").toDate();

    await this.#notificationsService.announceDuel(codeword, deadline, user1, user2);

    await this.#gcloudTasksService.scheduleDuelCompletion(duel.id);
    await this.#gcloudTasksService.scheduleDuelReportReminder(duel.id, user1.id);
    await this.#gcloudTasksService.scheduleDuelReportReminder(duel.id, user2.id);
  }

  async createWeeklyRandomDuels() {
    const pairs = createUserPairs(await this.#usersService.getUsersForWeeklyRandomDuels());

    const codeword = await getRandomCodeword();
    const duels = await this.#duelsRepository.createWeeklyRandomDuels(
      codeword,
      pairs.map((pair) => pair.map((user) => user.id)),
    );
    const deadline = dayjs(duels[0].startedAt).add(this.#config.public.DUEL_PERIOD, "milliseconds").toDate();

    await this.#notificationsService.announceWeeklyRandomDuels(codeword, deadline, pairs);
    await Promise.all(
      duels.flatMap((duel, i) => [
        this.#gcloudTasksService.scheduleDuelCompletion(duel.id, { delay: i * 30_000 }), // Delay the completion of each duel by 30 seconds.
        ...pairs[i]!.map((user) => this.#gcloudTasksService.scheduleDuelReportReminder(duel.id, user.id)),
      ]),
    );
  }

  /**
   * Completes a duel.
   * @param duelId The ID of the duel.
   */
  async completeDuel(duelId: number) {
    const duel = await this.#duelsRepository.getFullDuelInfoById(duelId);
    if (!duel || duel.completedAt !== null) return;

    const { codeword, participants, reports } = duel;
    const photos = await Promise.all(
      participants.map((p) => this.#gcloudStorageService.downloadDuelReportPhotos(duel.id, p.id)),
    );

    // Determine the winner based on the reports.
    const highestScore = Math.max(...reports.filter((r) => r !== null).map((r) => r.stitches));
    const winnerIndex = sample(reports.map((r, i) => (r?.stitches === highestScore ? i : -1)).filter((i) => i !== -1));
    const winner = winnerIndex !== undefined ? participants[winnerIndex] : null;

    await this.#duelsRepository.completeDuel(duel.id, winner?.id);
    await this.#notificationsService.postDuelResults(codeword, participants, reports, photos, winner);
  }

  /**
   * Creates a duel report.
   * @param duelId The ID of the duel being reported.
   * @param userId The ID of the user reporting the duel.
   * @param report The report data.
   */
  async createDuelReport(duelId: number, userId: number, reportRequest: DuelReportRequest) {
    const participatesInDuel = await this.#duelsRepository.checkUserParticipationInDuel(userId, duelId);
    if (!participatesInDuel) {
      throw createApiError({
        code: ApiErrorCode.NotAllowed,
        message: "You are not allowed to report this duel.",
      });
    }

    const duel = await this.#duelsRepository.getDuelById(duelId);
    if (!duel) {
      throw createApiError({
        code: ApiErrorCode.NotFound,
        message: "Duel not found.",
      });
    }
    if (duel.completedAt !== null) {
      throw createApiError({
        code: ApiErrorCode.DuelNotActive,
        message: "Duel not active.",
      });
    }

    const createdReport = await this.#duelsRepository.createDuelReport(duelId, userId, reportRequest);
    const uploadedPhotos = await this.#gcloudStorageService.uploadDuelReportPhotos(
      duelId,
      userId,
      reportRequest.photos,
    );

    const user = (await this.#usersService.getUserIdAndFullname(userId))!;
    await this.#notificationsService.sendReportPreview(user, createdReport, uploadedPhotos);
  }

  async sendDuelReportReminder(duelId: number, userId: number) {
    const duelReport = await this.#duelsRepository.getDuelReport(duelId, userId);
    if (duelReport !== null) return;

    const duel = await this.#duelsRepository.getDuelById(duelId);
    if (!duel) return;

    const deadline = dayjs(duel.startedAt).add(this.#config.public.DUEL_PERIOD, "milliseconds").toDate();

    await this.#notificationsService.remindUserAboutDuelReport(userId, deadline);
  }

  /** Retrieves the duels rating information in the current month for all active users. */
  async getDuelsRating() {
    return await this.#duelsRepository.getDuelsRating();
  }

  /** Publishes the monthly rating and celebrates the winners. */
  async publishMonthlyRatingAndWinners() {
    await this.#duelsRepository.refreshDuelsRating();

    const rating = await this.#duelsRepository.getDuelsRating();
    const winners = getRatingWinners(rating);

    await this.#notificationsService.postMonthlyRatingAndWinners(rating, winners);
  }
}
