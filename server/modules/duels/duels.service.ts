import { sample, zip } from "es-toolkit";

import type { TelegramService } from "~~/server/infra/telegram/";
import type { GoogleCloudTasksService, GoogleCloudStorageService } from "~~/server/infra/gcloud/";
import type { UsersService } from "~~/server/modules/users/";
import type { DuelsRatingService } from "~~/server/modules/duels-rating/";
import type { DuelsRepository } from "./duels.repository.js";
import { dayjs } from "~~/server/utils/datetime.js";

export class DuelsService {
  #config = useRuntimeConfig();

  #telegramService: TelegramService;

  #gcloudTasksService: GoogleCloudTasksService;
  #gcloudStorageService: GoogleCloudStorageService;

  #usersService: UsersService;
  #duelsRepository: DuelsRepository;
  #duelsRatingService: DuelsRatingService;

  constructor({
    telegramService,
    gcloudTasksService,
    gcloudStorageService,
    usersService,
    duelsRepository,
    duelsRatingService,
  }: ServiceDependencies) {
    this.#telegramService = telegramService;

    this.#gcloudTasksService = gcloudTasksService;
    this.#gcloudStorageService = gcloudStorageService;

    this.#usersService = usersService;
    this.#duelsRepository = duelsRepository;
    this.#duelsRatingService = duelsRatingService;
  }

  /**
   * Retrieves a duel by its ID.
   * @param duelId The ID of the duel.
   * @returns The duel data or null if not found.
   */
  async getDuelById(duelId: number) {
    return await this.#duelsRepository.getDuelById(duelId);
  }

  /**
   * Get full duel information by ID.
   * @param duelId The ID of the duel.
   * @returns The duel including participants and reports.
   */
  async getFullDuelInfo(duelId: number) {
    return await this.#duelsRepository.getFullDuelInfoById(duelId);
  }

  /**
   * Retrieves the list of active duels with their participants.
   * @returns The list of active duels with participants.
   */
  async getActiveDuelsWithParticipants() {
    const duels = await this.#duelsRepository.getActiveDuelsWithParticipants();
    return duels.map<ActiveDuelRecord>(({ startedAt, ...duel }) => ({
      ...duel,
      deadline: dayjs(startedAt).add(this.#config.public.duelPeriod, "milliseconds").toDate(),
    }));
  }

  /**
   * Retrieves completed duels for a specific month.
   * @param year The year to filter by.
   * @param month The month to filter by (1-12).
   * @returns The list of completed duels for the specified month.
   */
  async getCompletedDuelsByMonth(year: number, month: number) {
    return await this.#duelsRepository.getCompletedDuelsByMonth(year, month);
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
   * Check user's participation in active duels.
   * @param userId The ID of the user to check.
   * @param duelId The ID of the duel to check (optional).
   * @returns Object indicating participation and duel ID if participating.
   */
  async getUserDuelParticipation(userId: number, duelId?: number) {
    return await this.#duelsRepository.getUserDuelParticipation(userId, duelId);
  }

  /**
   * Creates a duel between two users.
   * @param user1 The first user.
   * @param user2 The second user.
   */
  async createDuel(user1: UserIdAndFullname, user2: UserIdAndFullname) {
    const codeword = await getRandomCodeword();
    const duel = await this.#duelsRepository.createDuel(codeword, user1.id, user2.id);
    const deadline = dayjs(duel.startedAt).add(this.#config.public.duelPeriod, "milliseconds").toDate();

    await this.#telegramService.announceDuel(codeword, deadline, user1, user2);

    await this.#gcloudTasksService.scheduleDuelCompletion(duel.id);
    await this.#gcloudTasksService.scheduleDuelReportReminder(duel.id, user1.id);
    await this.#gcloudTasksService.scheduleDuelReportReminder(duel.id, user2.id);
  }

  /** Creates weekly random duels. */
  async createWeeklyRandomDuels() {
    const pairs = createUserPairs(await this.#usersService.getUsersForWeeklyRandomDuels());

    const codeword = await getRandomCodeword();
    const duels = await this.#duelsRepository.createWeeklyRandomDuels(
      codeword,
      pairs.map((pair) => pair.map((user) => user.id)),
    );
    const deadline = dayjs(duels[0].startedAt).add(this.#config.public.duelPeriod, "milliseconds").toDate();

    await this.#telegramService.announceWeeklyRandomDuels(codeword, deadline, pairs);
    await Promise.all(
      zip(duels, pairs).flatMap(([duel, participants], i) => [
        this.#gcloudTasksService.scheduleDuelCompletion(duel.id, { delay: i * 30_000 }), // Delay the completion of each duel by 30 seconds.
        participants.map((user) => this.#gcloudTasksService.scheduleDuelReportReminder(duel.id, user.id)),
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
    await this.#duelsRatingService.refreshRating();
    await this.#telegramService.postDuelResults(codeword, participants, reports, photos, winner);
    await this.#gcloudStorageService.deleteDuelReportPhotos(duel.id);
  }
}
