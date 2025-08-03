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
    return await this.#duelsRepository.getDuelRequest(requestId);
  }

  async getUserDuelRequests(userId: number) {
    return await this.#duelsRepository.getUserDuelRequests(userId);
  }

  async sendDuelRequests(fromUserId: number, toUserIds: number[]) {
    const result = await this.#duelsRepository.createDuelRequests(fromUserId, toUserIds);

    // If there is no result, it means that user has already requested a duel, so these are duplicates that were ignored.
    if (result.length > 0) {
      const user = await this.#usersService.getUserIdAndFullname(fromUserId);

      for (const request of result) {
        await this.#notificationsService.notifyUserDuelRequested(request.toUserId, user!);
        await this.#gcloudTasksService.scheduleDuelRequestCancellation(request.id);
      }
    }

    return result;
  }

  async acceptDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);
    if (!request) return null;

    await this.createDuel(request.fromUserId, request.toUserId);

    const toUser = (await this.#usersService.getUserIdAndFullname(request.toUserId))!;
    await this.#notificationsService.notifyUserDuelRequestAccepted(request.fromUserId, toUser);

    return request;
  }

  async declineDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);
    if (!request) return null;

    const user = (await this.#usersService.getUserIdAndFullname(request.toUserId))!;
    await this.#notificationsService.notifyUserDuelRequestDeclined(request.fromUserId, user);

    return request;
  }

  async removeExpiredDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);
    if (!request) return null;

    const fromUser = (await this.#usersService.getUserIdAndFullname(request.fromUserId))!;
    const toUser = (await this.#usersService.getUserIdAndFullname(request.toUserId))!;
    await this.#notificationsService.notifyUsersDuelRequestExpired(fromUser, toUser);

    return request;
  }

  private async createDuel(userId1: number, userId2: number) {
    const codeword = await getRandomCodeword();
    const duel = await this.#duelsRepository.createDuel(codeword, userId1, userId2);

    const deadline = dayjs(duel.startedAt).add(DUEL_PERIOD, "milliseconds").toDate();

    const user1 = await this.#usersService.getUserIdAndFullname(userId1);
    const user2 = await this.#usersService.getUserIdAndFullname(userId2);

    await this.#notificationsService.announceDuel(codeword, deadline, user1!, user2!);
  }

  async createDuelReport(duelId: number, userId: number, report: DuelReportRequest) {
    const participatesInDuel = await this.checkIfUserParticipatesInDuel(userId, duelId);
    if (!participatesInDuel) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "You are not allowed to report this duel",
      });
    }

    const photoUrls = await this.#gcloudStorageService.uploadDuelReportPhotos(duelId, userId, report.photos);
    return await this.#duelsRepository.createDuelReport(duelId, userId, {
      ...report,
      photos: photoUrls,
    });
  }

  private async checkIfUserParticipatesInDuel(userId: number, duelId: number) {
    const duel = await this.#duelsRepository.getDuelById(duelId);
    if (!duel) return false;

    if (duel.status !== DuelStatus.Active) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Duel is not active",
      });
    }

    const participants = await this.#duelsRepository.getDuelParticipants(duelId);
    return participants.some((p) => p.userId === userId);
  }
}
