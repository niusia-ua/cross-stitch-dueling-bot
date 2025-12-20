import { asClass, createContainer } from "awilix";

import type { BotApi, BotI18n } from "./bot/";
import type { DatabasePool, SqlTag } from "./database/";

import { TelegramService } from "./infra/telegram/";
import { GoogleCloudTasksService, GoogleCloudStorageService } from "./infra/gcloud/";

import { UsersService, UsersRepository } from "./modules/users/";
import { DuelsService, DuelsRepository } from "./modules/duels/";
import { DuelRequestsService, DuelRequestsRepository } from "./modules/duel-requests/";
import { DuelReportsService, DuelReportsRepository } from "./modules/duel-reports/";
import { DuelsRatingService, DuelsRatingRepository } from "./modules/duels-rating/";

declare global {
  export interface ServiceDependencies {
    telegramService: TelegramService;

    gcloudTasksService: GoogleCloudTasksService;
    gcloudStorageService: GoogleCloudStorageService;

    usersService: UsersService;
    usersRepository: UsersRepository;

    duelsService: DuelsService;
    duelsRepository: DuelsRepository;

    duelRequestsService: DuelRequestsService;
    duelRequestsRepository: DuelRequestsRepository;

    duelReportsService: DuelReportsService;
    duelReportsRepository: DuelReportsRepository;

    duelsRatingService: DuelsRatingService;
    duelsRatingRepository: DuelsRatingRepository;
  }

  export interface RepositoryDependencies {
    db: DatabasePool;
    sql: SqlTag;
  }
}

export function createDiContainer(
  { db, sql }: { db: DatabasePool; sql: SqlTag },
  { botApi, botI18n }: { botApi: BotApi; botI18n: BotI18n },
) {
  const diContainer = createContainer<Cradle>({ strict: true });

  diContainer.register({
    telegramService: asClass(TelegramService, { injector: () => ({ botApi, botI18n }) }).singleton(),

    gcloudTasksService: asClass(GoogleCloudTasksService).singleton(),
    gcloudStorageService: asClass(GoogleCloudStorageService).singleton(),

    usersService: asClass(UsersService).singleton(),
    usersRepository: asClass(UsersRepository, { injector: () => ({ db, sql }) }).singleton(),

    duelsService: asClass(DuelsService).singleton(),
    duelsRepository: asClass(DuelsRepository, { injector: () => ({ db, sql }) }).singleton(),

    duelRequestsService: asClass(DuelRequestsService).singleton(),
    duelRequestsRepository: asClass(DuelRequestsRepository, { injector: () => ({ db, sql }) }).singleton(),

    duelReportsService: asClass(DuelReportsService).singleton(),
    duelReportsRepository: asClass(DuelReportsRepository, { injector: () => ({ db, sql }) }).singleton(),

    duelsRatingService: asClass(DuelsRatingService).singleton(),
    duelsRatingRepository: asClass(DuelsRatingRepository, { injector: () => ({ db, sql }) }).singleton(),
  });

  return diContainer;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Cradle extends ServiceDependencies {}

export type { AwilixContainer } from "awilix";
