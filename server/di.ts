import { asClass, createContainer } from "awilix";

import type { DatabasePool } from "./db.js";
import { UsersService } from "./services/index.js";
import { UsersRepository } from "./repositories/index.js";

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
