import { partialUpdateSet, type DatabasePool, type SqlTag } from "~~/server/database/";

export class UsersRepository {
  #db: DatabasePool;
  #sql: SqlTag;

  constructor({ db, sql }: RepositoryDependencies) {
    this.#db = db;
    this.#sql = sql;
  }

  /**
   * Retrieves all users with their settings for duels display.
   * @returns All users with their settings.
   */
  async getAllUsersWithSettings() {
    return await this.#db.any(this.#sql.type(UserAvailableForDuelSchema)`
      SELECT u.id, u.fullname, u.photo_url, us.stitches_rate
      FROM users u
      JOIN user_settings us ON us.user_id = u.id
      ORDER BY u.id
    `);
  }

  async createUser(id: number, user: Omit<UserData, "active">, settings: UserSettingsData) {
    return await this.#db.transaction(async (tx) => {
      const u = await tx.one(this.#sql.type(UserSchema)`
        INSERT INTO users (id, username, fullname, photo_url)
        VALUES (${id}, ${user.username}, ${user.fullname}, ${user.photoUrl})
        RETURNING *
      `);
      const s = await tx.one(this.#sql.type(UserSettingsSchema)`
        INSERT INTO user_settings (user_id, stitches_rate, participates_in_weekly_random_duels)
        VALUES (${id}, ${settings.stitchesRate}, ${settings.participatesInWeeklyRandomDuels})
        RETURNING *
      `);
      return { user: u, settings: s };
    });
  }

  async getUserAndSettings(userId: number) {
    return await this.#db.maybeOne(this.#sql.type(UserAndSettingsSchema)`
      SELECT
        row_to_json(u) AS user,
        row_to_json(s) AS settings
      FROM users u
      INNER JOIN user_settings s ON s.user_id = u.id
      WHERE u.id = ${userId}
    `);
  }

  async getUserIdAndFullname(userId: number) {
    return await this.#db.maybeOne(this.#sql.type(UserIdAndFullnameSchema)`
      SELECT id, fullname
      FROM users
      WHERE id = ${userId}
    `);
  }

  async updateUser(id: number, data: Partial<UserData>) {
    return await this.#db.one(this.#sql.type(UserSchema)`
      UPDATE users
      SET ${partialUpdateSet(this.#sql, {
        ...data,
        // When updating the user, we set the active field to DEFAULT if not provided.
        // That is, the user account will become active if it was previously inactive.
        active: data.active ?? this.#sql.fragment`DEFAULT`,
        // Also, we set deleted_at to NULL to ensure the user is not considered deleted.
        deletedAt: this.#sql.fragment`NULL`,
      })}
      WHERE id = ${id}
      RETURNING *
    `);
  }

  async updateUserSettings(id: number, data: Partial<UserSettingsData>) {
    return await this.#db.one(this.#sql.type(UserSettingsSchema)`
      UPDATE user_settings
      SET ${partialUpdateSet(this.#sql, data)}
      WHERE user_id = ${id}
      RETURNING *
    `);
  }

  async getUsersForWeeklyRandomDuels() {
    return await this.#db.many(this.#sql.type(
      UserIdAndFullnameSchema.merge(UserSettingsSchema.pick({ stitchesRate: true })),
    )`
      SELECT u.id, u.fullname, us.stitches_rate
      FROM users u
      JOIN user_settings us ON us.user_id = u.id
      WHERE u.active AND us.participates_in_weekly_random_duels
    `);
  }
}
