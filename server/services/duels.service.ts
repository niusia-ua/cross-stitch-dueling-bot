import { DUEL_REQUEST_VALIDITY_PERIOD } from "#shared/constants.js";

import type { GoogleCloudTasksService, NotificationsService, UsersService } from "~~/server/services/";
import type { DuelsRepository } from "~~/server/repositories/";

import { TaskQueue } from "~~/server/types.js";

interface Dependencies {
  duelsRepository: DuelsRepository;
  usersService: UsersService;
  notificationsService: NotificationsService;

  gcloudTasksService: GoogleCloudTasksService;
}

export class DuelsService {
  #duelsRepository: DuelsRepository;
  #usersService: UsersService;
  #notificationsService: NotificationsService;

  #gcloudTasksService: GoogleCloudTasksService;

  constructor({ duelsRepository, usersService, notificationsService, gcloudTasksService }: Dependencies) {
    this.#duelsRepository = duelsRepository;
    this.#usersService = usersService;
    this.#notificationsService = notificationsService;

    this.#gcloudTasksService = gcloudTasksService;
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
      const user = await this.#usersService.getUser(fromUserId);

      for (const request of result) {
        // Notify all users that they were requested a duel.
        await this.#notificationsService.notifyUserDuelRequested(request.toUserId, user!);

        // Schedule a task to remove the duel requests after the period of the request validity.
        await this.#gcloudTasksService.createTask(
          TaskQueue.DuelRequests,
          { id: request.id },
          { delay: DUEL_REQUEST_VALIDITY_PERIOD },
        );
      }
    }

    return result;
  }

  async acceptDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);
    if (!request) return null;

    const toUser = (await this.#usersService.getUser(request.toUserId))!;
    await this.#notificationsService.notifyUserDuelRequestAccepted(request.fromUserId, toUser);

    return request;
  }

  async declineDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);
    if (!request) return null;

    const user = (await this.#usersService.getUser(request.toUserId))!;
    await this.#notificationsService.notifyUserDuelRequestDeclined(request.fromUserId, user);

    return request;
  }

  async removeExpiredDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);
    if (!request) return null;

    const fromUser = (await this.#usersService.getUser(request.fromUserId))!;
    const toUser = (await this.#usersService.getUser(request.toUserId))!;
    await this.#notificationsService.notifyUsersDuelRequestExpired(fromUser, toUser);

    return request;
  }
}
