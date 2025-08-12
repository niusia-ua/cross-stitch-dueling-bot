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

  async getUserAndSettings(userId: number) {
    return await this.#pool.maybeOne(sql.type(UserAndSettingsSchema)`
      SELECT
        row_to_json(u) AS user,
        row_to_json(s) AS settings
      FROM users u
      INNER JOIN user_settings s ON s.user_id = u.id
      WHERE u.id = ${userId}
    `);
  }

  async getUserIdAndFullname(userId: number) {
    return await this.#pool.maybeOne(sql.type(UserIdAndFullnameSchema)`
      SELECT id, fullname
      FROM users
      WHERE id = ${userId}
    `);
  }

  async updateUser(id: number, data: Partial<UserData>) {
    return await this.#pool.one(sql.type(UserSchema)`
      UPDATE users
      SET ${partialUpdateSet({
        ...data,
        // When updating the user, we set the active field to DEFAULT if not provided.
        // That is, the user account will become active if it was previously inactive.
        active: data.active ?? sql.fragment`DEFAULT`,
        // Also, we set deleted_at to NULL to ensure the user is not considered deleted.
        deletedAt: sql.fragment`NULL`,
      })}
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

  async getUsersForWeeklyRandomDuels() {
    return await this.#pool.many(sql.type(
      UserIdAndFullnameSchema.merge(UserSettingsSchema.pick({ stitchesRate: true })),
    )`
      SELECT u.id, u.fullname, us.stitches_rate
      FROM users u
      JOIN user_settings us ON us.user_id = u.id
      WHERE u.active AND us.participates_in_weekly_random_duels
    `);
  }
}
