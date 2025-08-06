import { sql, partialUpdateSet, type DatabasePool } from "~~/server/database/";

interface Dependencies {
  pool: DatabasePool;
}

export class UsersRepository {
  #pool: DatabasePool;

  constructor({ pool }: Dependencies) {
    this.#pool = pool;
  }

  async createUser(id: number, user: Omit<UserData, "active">, settings: UserSettingsData) {
    return await this.#pool.transaction(async (tx) => {
      const u = await tx.one(sql.type(UserSchema)`
        INSERT INTO users (id, username, fullname, photo_url)
        VALUES (${id}, ${user.username}, ${user.fullname}, ${user.photoUrl})
        RETURNING *
      `);
      const s = await tx.one(sql.type(UserSettingsSchema)`
        INSERT INTO user_settings (user_id, stitches_rate, participates_in_weekly_random_duels)
        VALUES (${id}, ${settings.stitchesRate}, ${settings.participatesInWeeklyRandomDuels})
        RETURNING *
      `);
      return { user: u, settings: s };
    });
  }

  async getUser(userId: number) {
    return await this.#pool.maybeOne(sql.type(UserSchema)`
      SELECT *
      FROM users
      WHERE id = ${userId}
    `);
  }

  async getUserIdAndFullname(userId: number) {
    return await this.#pool.maybeOne(sql.type(UserIdAndFullnameSchema)`
      SELECT id, fullname
      FROM users
      WHERE id = ${userId}
    `);
  }

  async getUserSettings(userId: number) {
    return await this.#pool.maybeOne(sql.type(UserSettingsSchema)`
      SELECT *
      FROM user_settings
      WHERE user_id = ${userId}
    `);
  }

  async updateUser(id: number, data: Partial<UserData>) {
    return await this.#pool.one(sql.type(UserSchema)`
      UPDATE users
      SET ${partialUpdateSet(data)}
      WHERE id = ${id}
      RETURNING *
    `);
  }

  async updateUserSettings(id: number, data: Partial<UserSettingsData>) {
    return await this.#pool.one(sql.type(UserSettingsSchema)`
      UPDATE user_settings
      SET ${partialUpdateSet(data)}
      WHERE user_id = ${id}
      RETURNING *
    `);
  }
}
