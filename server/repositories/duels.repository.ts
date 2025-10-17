import { zip } from "es-toolkit";
import z from "zod";
import { sql, type DatabasePool } from "~~/server/database/";

interface Dependencies {
  pool: DatabasePool;
}

export class DuelsRepository {
  #pool: DatabasePool;

  constructor({ pool }: Dependencies) {
    this.#pool = pool;
  }

  /**
   * Retrieves a duel by its ID.
   * @param duelId The ID of the duel.
   * @returns The duel data or null if not found.
   */
  async getDuelById(duelId: number) {
    return await this.#pool.maybeOne(sql.type(DuelSchema)`
      SELECT *
      FROM duels
      WHERE id = ${duelId}
    `);
  }

  /**
   * Get full duel information by ID.
   * @param duelId The ID of the duel.
   * @returns The duel ID, codeword, and completion date (indicating if the duel is completed) including participants and reports.
   */
  async getFullDuelInfoById(duelId: number) {
    return await this.#pool.maybeOne(sql.type(
      DuelSchema.pick({ id: true, codeword: true, completedAt: true })
        .merge(
          z.object({
            participants: z.array(UserIdAndFullnameSchema).min(2),
            reports: z.array(DuelReportDataSchema.nullable()).min(2),
          }),
        )
        .refine((schema) => schema.participants.length === schema.reports.length, {
          message: "Participants and reports count mismatch.",
        }),
    )`
      SELECT
      -- Select base duel fields.
      d.id, d.codeword, d.completed_at,
      -- Select the id and fullname of participants.
      JSON_AGG(
        json_build_object('id', u.id, 'fullname', u.fullname)
        ORDER BY u.id
      ) AS participants,
      -- Select the participants' reports or NULL if one hasn't submitted a report.
      JSON_AGG(
        CASE
          WHEN dr.user_id IS NULL THEN NULL
        ELSE
          json_build_object('stitches', dr.stitches, 'additional_info', dr.additional_info)
        END
        ORDER BY u.id
      ) AS reports
      FROM duels AS d
      INNER JOIN duel_participants AS dp ON dp.duel_id = d.id
      INNER JOIN users AS u ON u.id = dp.user_id
      LEFT JOIN duel_reports AS dr ON dr.duel_id = d.id AND dr.user_id = u.id
      WHERE d.id = ${duelId}
      GROUP BY d.id
    `);
  }

  async getActiveDuelsWithParticipants() {
    return await this.#pool.any(sql.type(DuelWithParticipantsDataSchema)`
      SELECT
        d.id, d.codeword, d.started_at,
        JSON_AGG(json_build_object('id', u.id, 'fullname', u.fullname, 'photo_url', u.photo_url, 'stitches_rate', us.stitches_rate)) AS participants
      FROM duels AS d
        JOIN duel_participants AS dp ON dp.duel_id = d.id
        JOIN users AS u ON u.id = dp.user_id
        JOIN user_settings AS us ON us.user_id = u.id
      WHERE d.completed_at IS NULL
      GROUP BY d.id
      ORDER BY d.started_at DESC
    `);
  }

  async getAvailableUsersForDuel() {
    return await this.#pool.any(sql.type(UserAvailableForDuelSchema)`
      SELECT u.id, u.fullname, u.photo_url, us.stitches_rate
      FROM users AS u
      INNER JOIN user_settings AS us ON us.user_id = u.id
      -- Ensure user is active and not participating in an active duel.
      WHERE u.active AND NOT EXISTS (
        SELECT
        FROM duel_participants AS dp
        JOIN duels AS d ON d.id = dp.duel_id
        WHERE dp.user_id = u.id AND d.completed_at IS NULL
      );
    `);
  }

  async getDuelRequestById(requestId: number) {
    return await this.#pool.maybeOne(sql.type(DuelRequestSchema)`
      SELECT *
      FROM duel_requests
      WHERE id = ${requestId}
    `);
  }

  async getDuelRequestsByUserId(userId: number) {
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
    return await this.#pool.maybeOne(sql.type(
      z.object({
        fromUser: UserIdAndFullnameSchema,
        toUser: UserIdAndFullnameSchema,
      }),
    )`
      DELETE FROM duel_requests AS dr
      USING users AS fu, users AS tu
      WHERE dr.id = ${requestId}
        AND fu.id = dr.from_user_id
        AND tu.id = dr.to_user_id
      RETURNING
        json_build_object('id', fu.id, 'fullname', fu.fullname) AS from_user,
        json_build_object('id', tu.id, 'fullname', tu.fullname) AS to_user
    `);
  }

  async createDuel(codeword: string, userId1: number, userId2: number) {
    return await this.#pool.transaction(async (tx) => {
      const duel = await tx.one(sql.type(DuelSchema)`
        INSERT INTO duels (codeword)
        VALUES (${codeword})
        RETURNING *
      `);

      await tx.many(sql.type(DuelParticipantSchema)`
        INSERT INTO duel_participants (duel_id, user_id)
        SELECT *
        FROM ${sql.unnest(
          [
            [duel.id, userId1],
            [duel.id, userId2],
          ],
          [sql.fragment`int`, sql.fragment`bigint`],
        )}
        RETURNING *
      `);

      return duel;
    });
  }

  async createWeeklyRandomDuels(codeword: string, pairs: number[][]) {
    return await this.#pool.transaction(async (tx) => {
      const duels = await tx.many(sql.type(DuelSchema)`
        INSERT INTO duels (codeword)
        SELECT *
        FROM ${sql.unnest(new Array(pairs.length).fill([codeword]), [sql.fragment`text`])}
        RETURNING *
      `);

      await tx.many(sql.type(DuelParticipantSchema)`
        INSERT INTO duel_participants (duel_id, user_id)
        SELECT *
        FROM ${sql.unnest(
          zip(duels, pairs).flatMap(([duel, pair]) => pair.map((userId) => [duel.id, userId])),
          [sql.fragment`int`, sql.fragment`bigint`],
        )}
        RETURNING *
      `);

      return duels;
    });
  }

  /**
   * Completes a duel by setting the completion date, winner, and refreshing the rating.
   * @param duelId The ID of the duel to complete.
   * @param winnerId The ID of the winner (optional).
   */
  async completeDuel(duelId: number, winnerId?: number) {
    await this.#pool.transaction(async (tx) => {
      await tx.query(sql.typeAlias("void")`
        UPDATE duels
        SET completed_at = NOW()
        WHERE id = ${duelId}
      `);

      if (winnerId) {
        await tx.query(sql.typeAlias("void")`
          INSERT INTO duel_winners (duel_id, user_id)
          VALUES (${duelId}, ${winnerId})
          ON CONFLICT DO NOTHING
        `);
      }

      await tx.query(sql.typeAlias("void")`
        REFRESH MATERIALIZED VIEW duels_rating
      `);
    });
  }

  async createDuelReport(duelId: number, userId: number, report: DuelReportData) {
    return await this.#pool.one(sql.type(DuelReportSchema)`
      INSERT INTO duel_reports (duel_id, user_id, stitches, additional_info)
      VALUES (${duelId}, ${userId}, ${report.stitches}, ${report.additionalInfo})
      ON CONFLICT (duel_id, user_id) DO UPDATE
      SET stitches = EXCLUDED.stitches,
          additional_info = EXCLUDED.additional_info
      RETURNING *
    `);
  }

  async getDuelReport(duelId: number, userId: number) {
    return await this.#pool.maybeOne(sql.type(DuelReportSchema)`
      SELECT *
      FROM duel_reports
      WHERE duel_id = ${duelId} AND user_id = ${userId}
    `);
  }

  async getDuelReportsByDuelId(duelId: number) {
    return await this.#pool.any(sql.type(DuelReportSchema)`
      SELECT *
      FROM duel_reports
      WHERE duel_id = ${duelId}
    `);
  }

  /**
   * Check if a user is participating in a duel (the provided one or any).
   * @param userId The ID of the user to check.
   * @param duelId The ID of the duel to check (optional).
   * @returns True if the user is participating in the duel, false otherwise.
   */
  async checkUserParticipationInDuel(userId: number, duelId?: number) {
    const conditionFragments = [];
    if (duelId) conditionFragments.push(sql.fragment`d.id = ${duelId}`);
    conditionFragments.push(sql.fragment`dp.user_id = ${userId}`);
    conditionFragments.push(sql.fragment`d.completed_at IS NULL`);

    return await this.#pool.exists(sql.typeAlias("void")`
      SELECT
      FROM duel_participants AS dp
      JOIN duels AS d ON d.id = dp.duel_id
      WHERE ${sql.join(conditionFragments, sql.fragment` AND `)}
    `);
  }

  /** Retrieves the duels rating information in the current month for all active users. */
  async getDuelsRating() {
    return await this.#pool.any(sql.type(DuelsRatingWithUsersInfoSchema)`
      SELECT
        dr.user_id,
        dr.total_duels_won,
        dr.total_duels_participated,
        json_build_object(
          'id', u.id,
          'fullname', u.fullname,
          'photo_url', u.photo_url,
          'stitches_rate', us.stitches_rate
        ) AS user
      FROM duels_rating AS dr
      JOIN users AS u ON u.id = dr.user_id
      JOIN user_settings AS us ON us.user_id = u.id
    `);
  }

  /** Refreshes the materialized view for duels rating. */
  async refreshDuelsRating() {
    await this.#pool.query(sql.typeAlias("void")`
      REFRESH MATERIALIZED VIEW duels_rating
    `);
  }
}
