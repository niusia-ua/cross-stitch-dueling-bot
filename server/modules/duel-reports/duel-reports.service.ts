import type { TelegramService } from "~~/server/infra/telegram/";
import type { GoogleCloudStorageService } from "~~/server/infra/gcloud/";
import type { UsersService } from "~~/server/modules/users/";
import type { DuelsService } from "~~/server/modules/duels/";
import type { DuelReportsRepository } from "./duel-reports.repository.js";
import { dayjs } from "~~/server/utils/datetime.js";

export class DuelReportsService {
  #config = useRuntimeConfig();

  #telegramService: TelegramService;

  #gcloudStorageService: GoogleCloudStorageService;

  #usersService: UsersService;
  #duelsService: DuelsService;
  #duelReportsRepository: DuelReportsRepository;

  constructor({
    telegramService,
    gcloudStorageService,
    usersService,
    duelsService,
    duelReportsRepository,
  }: ServiceDependencies) {
    this.#telegramService = telegramService;

    this.#gcloudStorageService = gcloudStorageService;

    this.#usersService = usersService;
    this.#duelsService = duelsService;
    this.#duelReportsRepository = duelReportsRepository;
  }

  /**
   * Creates a duel report.
   * @param duelId The ID of the duel being reported.
   * @param userId The ID of the user reporting the duel.
   * @param report The report data.
   */
  async createDuelReport(duelId: number, userId: number, reportRequest: DuelReportRequest) {
    const participatesInDuel = await this.#duelsService.getUserDuelParticipation(userId, duelId);
    if (!participatesInDuel) {
      throw createApiError({
        code: ApiErrorCode.NotAllowed,
        message: "You are not allowed to report this duel.",
      });
    }

    const duel = await this.#duelsService.getDuelById(duelId);
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

    const createdReport = await this.#duelReportsRepository.createDuelReport(duelId, userId, reportRequest);
    const uploadedPhotos = await this.#gcloudStorageService.uploadDuelReportPhotos(
      duelId,
      userId,
      reportRequest.photos,
    );

    const user = (await this.#usersService.getUserIdAndFullname(userId))!;
    await this.#telegramService.sendReportPreview(user, createdReport, uploadedPhotos);
  }

  /**
   * Sends a reminder to a user about a pending duel report.
   * @param duelId The ID of the duel.
   * @param userId The ID of the user to remind.
   */
  async sendDuelReportReminder(duelId: number, userId: number) {
    const duelReport = await this.#duelReportsRepository.getDuelReport(duelId, userId);
    if (duelReport !== null) return;

    const duel = await this.#duelsService.getDuelById(duelId);
    if (!duel) return;

    const deadline = dayjs(duel.startedAt).add(this.#config.public.duelPeriod, "milliseconds").toDate();

    await this.#telegramService.remindUserAboutDuelReport(userId, deadline);
  }
}
