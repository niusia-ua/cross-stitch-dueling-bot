import type { DuelsRepository } from "~~/server/repositories/";

interface Dependencies {
  duelsRepository: DuelsRepository;
}

export class DuelsService {
  #duelsRepository: DuelsRepository;

  constructor({ duelsRepository }: Dependencies) {
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
    return await this.#duelsRepository.createDuelRequests(fromUserId, toUserIds);
  }
}
