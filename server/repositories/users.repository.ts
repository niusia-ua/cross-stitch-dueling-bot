import type { DatabasePool } from "~~/server/db.js";

interface Dependencies {
  pool: DatabasePool;
}

export class UsersRepository {
  #pool: DatabasePool;

  constructor({ pool }: Dependencies) {
    this.#pool = pool;
  }
}
