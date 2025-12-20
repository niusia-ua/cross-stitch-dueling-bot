import type { TelegramService } from "~~/server/infra/telegram/";
import type { DuelsRatingRepository } from "./duels-rating.repository.js";

export class DuelsRatingService {
  #telegramService: TelegramService;

  #duelsRatingRepository: DuelsRatingRepository;

  constructor({ telegramService, duelsRatingRepository }: ServiceDependencies) {
    this.#telegramService = telegramService;

    this.#duelsRatingRepository = duelsRatingRepository;
  }

  /** Retrieves the duels rating information in the current month for all active users. */
  async getDuelsRating() {
    return await this.#duelsRatingRepository.getDuelsRating();
  }

  /** Publishes the monthly rating and celebrates the winners. */
  async publishMonthlyRatingAndWinners() {
    const rating = await this.#duelsRatingRepository.getPreviousMonthDuelsRating();
    const winners = getRatingWinners(rating);

    await this.#telegramService.postMonthlyRatingAndWinners(rating, winners);
  }

  /** Refreshes the materialized view for duels rating. */
  async refreshRating() {
    await this.#duelsRatingRepository.refreshDuelsRating();
  }
}
