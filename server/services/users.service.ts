import type { UsersRepository } from "~~/server/repositories/index.js";

interface Dependencies {
  usersRepository: UsersRepository;
}

export class UsersService {
  #usersRepository: UsersRepository;

  constructor({ usersRepository }: Dependencies) {
    this.#usersRepository = usersRepository;
  }
}
