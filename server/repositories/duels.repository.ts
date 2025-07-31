import { sql, type DatabasePool } from "~~/server/database/";

interface Dependencies {
  pool: DatabasePool;
}

export class DuelsRepository {
  #pool: DatabasePool;

  constructor({ pool }: Dependencies) {
    this.#pool = pool;
  }

  async getActiveDuelsWithParticipants() {
    return await this.#pool.any(sql.type(DuelWithParticipantsDataSchema)`
      SELECT
        d.id, d.codeword, d.started_at,
        JSON_AGG(json_build_object('id', u.id, 'fullname', u.fullname, 'photo_url', u.photo_url)) AS participants
      FROM duels AS d
      INNER JOIN duel_participants AS dp ON dp.duel_id = d.id
      INNER JOIN users AS u ON u.id = dp.user_id
      WHERE d.status = ${DuelStatus.Active}
      GROUP BY d.id
      ORDER BY d.started_at DESC
    `);
  }

  async getAvailableUsersForDuel() {
    return await this.#pool.any(sql.type(UserAvailableForDuelSchema)`
      SELECT u.id, u.fullname, u.photo_url, us.stitches_rate
      FROM users AS u
      INNER JOIN user_settings AS us ON us.user_id = u.id
      LEFT JOIN duel_participants AS dp ON dp.user_id = u.id
      LEFT JOIN duels AS d ON d.id = dp.duel_id AND d.status = ${DuelStatus.Active}
      WHERE u.active = true AND d.id IS NULL
    `);
  }

  async createDuelRequests(fromUserId: number, toUserIds: number[]) {
    const user = await this.#pool.one(sql.type(UserSchema.pick({ id: true, fullname: true }))`
      SELECT id, fullname
      FROM users
      WHERE id = ${fromUserId}
    `);

    const result = await this.#pool.any(sql.typeAlias("id")`
      INSERT INTO duel_requests (from_user_id, to_user_id)
      SELECT *
      FROM ${sql.unnest(
        toUserIds.map((toUserId) => [fromUserId, toUserId]),
        [sql.fragment`bigint`, sql.fragment`bigint`],
      )}
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    return { user, result };
  }
}
