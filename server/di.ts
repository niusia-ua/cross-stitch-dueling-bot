import { asClass, createContainer } from "awilix";

import type { BotApi, BotI18n } from "./bot/";
import type { DatabasePool } from "./database/";
import {
  DuelsService,
  UsersService,
  NotificationsService,
  GoogleCloudTasksService,
  GoogleCloudStorageService,
} from "./services/";
import { DuelsRepository, UsersRepository } from "./repositories/";

export function createDiContainer(pool: DatabasePool, { botApi, botI18n }: { botApi: BotApi; botI18n: BotI18n }) {
  const diContainer = createContainer<Cradle>({ strict: true });

  diContainer.register({
    duelsService: asClass(DuelsService).singleton(),
    duelsRepository: asClass(DuelsRepository, { injector: () => ({ pool }) }).singleton(),

    usersService: asClass(UsersService).singleton(),
    usersRepository: asClass(UsersRepository, { injector: () => ({ pool }) }).singleton(),

    notificationsService: asClass(NotificationsService, { injector: () => ({ botApi, botI18n }) }).singleton(),

    gcloudTasksService: asClass(GoogleCloudTasksService).singleton(),
    gcloudStorageService: asClass(GoogleCloudStorageService).singleton(),
  });

  return diContainer;
}

export interface Cradle {
  duelsService: DuelsService;
  duelsRepository: DuelsRepository;

  usersService: UsersService;
  usersRepository: UsersRepository;

  notificationsService: NotificationsService;

  gcloudTasksService: GoogleCloudTasksService;
  gcloudStorageService: GoogleCloudStorageService;
}

export type { AwilixContainer } from "awilix";
