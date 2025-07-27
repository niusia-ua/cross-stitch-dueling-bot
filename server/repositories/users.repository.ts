import { sql, type DatabasePool } from "~~/server/database/";

interface Dependencies {
  pool: DatabasePool;
}

export class UsersRepository {
  #pool: DatabasePool;

  constructor({ pool }: Dependencies) {
    this.#pool = pool;
  }

  async createUser(user: UserData, settings: UserSettingsData) {
    return await this.#pool.transaction(async (transactionConnection) => {
      const u = await transactionConnection.one(sql.type(UserSchema)`
        INSERT INTO users (id, username, fullname, photo_url)
        VALUES (${user.id}, ${user.username}, ${user.fullname}, ${user.photoUrl})
        RETURNING *
      `);
      const s = await transactionConnection.one(sql.type(UserSettingsSchema)`
        INSERT INTO user_settings (user_id, stitches_rate, participates_in_weekly_random_duels)
        VALUES (${user.id}, ${settings.stitchesRate}, ${settings.participatesInWeeklyRandomDuels})
        RETURNING *
      `);
      return { user: u, settings: s };
    });
  }

  async getUser(userId: number) {
    return await this.#pool.maybeOne(sql.type(UserSchema)`
      SELECT users.*
      FROM users
      WHERE users.id = ${userId}
    `);
  }

  async getUserSettings(userId: number) {
    return await this.#pool.maybeOne(sql.type(UserSettingsSchema)`
      SELECT user_settings.*
      FROM user_settings
      WHERE user_settings.user_id = ${userId}
    `);
  }
}
