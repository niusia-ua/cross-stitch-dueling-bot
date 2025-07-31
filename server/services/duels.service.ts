import type { NotificationsService, UsersService } from "~~/server/services/";
import type { DuelsRepository } from "~~/server/repositories/";

interface Dependencies {
  duelsRepository: DuelsRepository;
  usersService: UsersService;
  notificationsService: NotificationsService;
}

export class DuelsService {
  #duelsRepository: DuelsRepository;
  #usersService: UsersService;
  #notificationsService: NotificationsService;

  constructor({ duelsRepository, usersService, notificationsService }: Dependencies) {
    this.#duelsRepository = duelsRepository;
    this.#usersService = usersService;
    this.#notificationsService = notificationsService;
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

    // If there is no result, it means that user has already requested a duel.
    // In this case, we do not need to notify users again. They have already received a notification.
    if (result.length > 0) {
      const user = await this.#usersService.getUser(fromUserId);
      await Promise.all(
        toUserIds.map((toUserId) => this.#notificationsService.notifyUserDuelRequested(toUserId, user!)),
      );
    }

    return result;
  }

  async acceptDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);

    const fromUser = (await this.#usersService.getUser(request.fromUserId))!;
    const toUser = (await this.#usersService.getUser(request.toUserId))!;

    await this.#notificationsService.notifyUserDuelAccepted(fromUser.id, toUser);
  }

  async declineDuelRequest(requestId: number) {
    const request = await this.#duelsRepository.removeDuelRequest(requestId);
    const user = (await this.#usersService.getUser(request.toUserId))!;

    await this.#notificationsService.notifyUserDuelDeclined(request.fromUserId, user);
  }
}
