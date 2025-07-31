import type { NotificationsService } from "~~/server/services/";
import type { DuelsRepository } from "~~/server/repositories/";

interface Dependencies {
  notificationsService: NotificationsService;
  duelsRepository: DuelsRepository;
}

export class DuelsService {
  #notificationsService: NotificationsService;
  #duelsRepository: DuelsRepository;

  constructor({ notificationsService, duelsRepository }: Dependencies) {
    this.#notificationsService = notificationsService;
    this.#duelsRepository = duelsRepository;
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

  async sendDuelRequests(fromUserId: number, toUserIds: number[]) {
    const { user, result } = await this.#duelsRepository.createDuelRequests(fromUserId, toUserIds);

    if (result.length > 0) {
      // If there is no result, it means that user has already requested a duel.
      await Promise.all(
        toUserIds.map((toUserId) => this.#notificationsService.notifyUserDuelRequested(toUserId, user)),
      );
    }

    return result;
  }
}
