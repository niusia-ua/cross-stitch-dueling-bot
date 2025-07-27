import { asClass, createContainer } from "awilix";

import type { DatabasePool } from "./database/";
import { UsersService } from "./services/";
import { UsersRepository } from "./repositories/";

export function createDiContainer(pool: DatabasePool) {
  const diContainer = createContainer<Cradle>({ strict: true });

  diContainer.register({
    usersService: asClass(UsersService).singleton(),
    usersRepository: asClass(UsersRepository, { injector: () => ({ pool }) }).singleton(),
  });

  return diContainer;
}

export interface Cradle {
  usersService: UsersService;
  usersRepository: UsersRepository;
}

export type { AwilixContainer } from "awilix";
