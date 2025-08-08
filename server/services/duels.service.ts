import { sample } from "es-toolkit";
import { DUEL_PERIOD } from "#shared/constants/duels.js";

import type {
  UsersService,
  NotificationsService,
  GoogleCloudTasksService,
  GoogleCloudStorageService,
} from "~~/server/services/";
import type { DuelsRepository } from "~~/server/repositories/";

interface Dependencies {
  duelsRepository: DuelsRepository;
  usersService: UsersService;
  notificationsService: NotificationsService;

  gcloudTasksService: GoogleCloudTasksService;
  gcloudStorageService: GoogleCloudStorageService;
}

export class DuelsService {
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

  async getActiveDuelsWithParticipants() {
    return await this.#duelsRepository.getActiveDuelsWithParticipants();
  }

  async getAvailableUsersForDuel(options?: {
    /** The user ID to exclude from the results */
    excludeUserId?: number;
  }) {
    const result = await this.#duelsRepository.getAvailableUsersForDuel();
    return result.filter((user) => user.id !== options?.excludeUserId);
  }

  async getDuelRequest(requestId: number) {
    return await this.#duelsRepository.getDuelRequestById(requestId);
  }

  async getDuelRequestsForUser(userId: number) {
    return await this.#duelsRepository.getDuelRequestsByUserId(userId);
  }

  async sendDuelRequests(fromUserId: number, toUserIds: number[]) {
    const result = await this.#duelsRepository.createDuelRequests(fromUserId, toUserIds);

    // If there is no result, it means that user has already requested a duel, so these are duplicates that were ignored.
    if (result.length > 0) {
      const fromUser = await this.#usersService.getUserIdAndFullname(fromUserId);
      await Promise.all(
        result.map(async (request) => {
          await this.#notificationsService.notifyUserDuelRequested(request.toUserId, fromUser!);
          await this.#gcloudTasksService.scheduleDuelRequestCancellation(request.id);
        }),
      );
    }
  }

  async acceptDuelRequest(requestId: number) {
    const result = await this.#duelsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;
      await this.createDuel(fromUser, toUser);
      await this.#notificationsService.notifyUserDuelRequestAccepted(fromUser.id, toUser);
    }
  }

  async declineDuelRequest(requestId: number) {
    const result = await this.#duelsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;
      await this.#notificationsService.notifyUserDuelRequestDeclined(fromUser.id, toUser);
    }
  }

  async removeExpiredDuelRequest(requestId: number) {
    const result = await this.#duelsRepository.removeDuelRequest(requestId);
    if (result) {
      const { fromUser, toUser } = result;
      await this.#notificationsService.notifyUsersDuelRequestExpired(fromUser, toUser);
    }
  }

  private async createDuel(user1: UserIdAndFullname, user2: UserIdAndFullname) {
    const codeword = await getRandomCodeword();
    const duel = await this.#duelsRepository.createDuel(codeword, user1.id, user2.id);
    const deadline = dayjs(duel.createdAt).add(DUEL_PERIOD, "milliseconds").toDate();

    await this.#notificationsService.announceDuel(codeword, deadline, user1, user2);
    await this.#gcloudTasksService.scheduleDuelCompletion(duel.id);
  }

  async completeDuel(duelId: number) {
    const duel = await this.#duelsRepository.getFullDuelInfoById(duelId);
    if (!duel || duel.status !== DuelStatus.Active) return;

    await this.#duelsRepository.updateDuelStatus(duel.id, DuelStatus.Completed);

    const { codeword, participants, reports } = duel;
    const photos = await Promise.all(
      participants.map((p) => this.#gcloudStorageService.downloadDuelReportPhotos(duel.id, p.id)),
    );

    // Determine the winner based on the reports.
    const highestScore = Math.max(...reports.filter((r) => r !== null).map((r) => r.stitches));
    const winningReportIndex = sample(reports.filter((r) => r?.stitches === highestScore).map((_r, i) => i));
    const winner = winningReportIndex !== undefined ? participants[winningReportIndex] : null;
    if (winner) await this.#duelsRepository.setDuelWinner(duelId, winner.id);

    await this.#notificationsService.postDuelResults(codeword, participants, reports, photos, winner);
  }

  async createDuelReport(duelId: number, userId: number, report: DuelReportRequest) {
    const participatesInDuel = await this.#duelsRepository.checkUserParticipationInDuel(userId, duelId);
    if (!participatesInDuel) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "You are not a participant in this duel.",
      });
    }

    await this.#duelsRepository.createDuelReport(duelId, userId, report);
    await this.#gcloudStorageService.uploadDuelReportPhotos(duelId, userId, report.photos);
  }

  async checkUserParticipationInDuel(userId: number, duelId?: number) {
    return await this.#duelsRepository.checkUserParticipationInDuel(userId, duelId);
  }
}
