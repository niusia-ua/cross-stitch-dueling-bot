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

  async getDuelRequest(requestId: number) {
    return await this.#pool.maybeOne(sql.type(DuelRequestSchema)`
      SELECT *
      FROM duel_requests
      WHERE id = ${requestId}
    `);
  }

  async getUserDuelRequests(userId: number) {
    return await this.#pool.any(sql.type(UserDuelRequestSchema)`
      SELECT
        dr.id,
        dr.created_at,
        json_build_object('fullname', u.fullname, 'photo_url', u.photo_url) AS from_user
      FROM duel_requests AS dr
      INNER JOIN users AS u ON u.id = dr.from_user_id
      WHERE dr.to_user_id = ${userId}
      GROUP BY dr.id, u.id
      ORDER BY dr.created_at DESC
    `);
  }

  async createDuelRequests(fromUserId: number, toUserIds: number[]) {
    return await this.#pool.any(sql.type(DuelRequestSchema)`
      INSERT INTO duel_requests (from_user_id, to_user_id)
      SELECT *
      FROM ${sql.unnest(
        toUserIds.map((toUserId) => [fromUserId, toUserId]),
        [sql.fragment`bigint`, sql.fragment`bigint`],
      )}
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
  }

  async removeDuelRequest(requestId: number) {
    return await this.#pool.maybeOne(sql.type(DuelRequestSchema)`
      DELETE FROM duel_requests
      WHERE id = ${requestId}
      RETURNING *
    `);
  }
}
