import { asClass, createContainer } from "awilix";

import type { DatabasePool } from "./database/";
import { DuelsService, UsersService } from "./services/";
import { DuelsRepository, UsersRepository } from "./repositories/";

export function createDiContainer(pool: DatabasePool) {
  const diContainer = createContainer<Cradle>({ strict: true });

  diContainer.register({
    duelsService: asClass(DuelsService).singleton(),
    duelsRepository: asClass(DuelsRepository, { injector: () => ({ pool }) }).singleton(),

    usersService: asClass(UsersService).singleton(),
    usersRepository: asClass(UsersRepository, { injector: () => ({ pool }) }).singleton(),
  });

  return diContainer;
}

export interface Cradle {
  duelsService: DuelsService;
  duelsRepository: DuelsRepository;

  usersService: UsersService;
  usersRepository: UsersRepository;
}

export type { AwilixContainer } from "awilix";
