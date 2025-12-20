import { zip } from "es-toolkit";
import z from "zod";

import type { DatabasePool, SqlTag } from "~~/server/database/";

export class DuelsRepository {
  #db: DatabasePool;
  #sql: SqlTag;

  constructor({ db, sql }: RepositoryDependencies) {
    this.#db = db;
    this.#sql = sql;
  }

  /**
   * Retrieves a duel by its ID.
   * @param duelId The ID of the duel.
   * @returns The duel data or null if not found.
   */
  async getDuelById(duelId: number) {
    return await this.#db.maybeOne(this.#sql.type(DuelSchema)`
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
    return await this.#db.maybeOne(this.#sql.type(
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
    return await this.#db.any(this.#sql.type(DuelWithParticipantsDataSchema)`
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

  /**
   * Retrieves completed duels with participant IDs for a specific month.
   * @param year The year to filter by.
   * @param month The month to filter by (1-12).
   * @returns The list of completed duels with participant IDs for the specified month.
   */
  async getCompletedDuelsByMonth(year: number, month: number) {
    return await this.#db.any(this.#sql.type(ArchivedDuelRecordSchema)`
      SELECT
        d.id, d.codeword, d.completed_at,
        dw.user_id AS winner_id,
        JSON_AGG(dp.user_id ORDER BY dp.user_id) AS participants
      FROM duels AS d
        JOIN duel_participants AS dp ON dp.duel_id = d.id
        LEFT JOIN duel_winners AS dw ON dw.duel_id = d.id
      WHERE d.completed_at IS NOT NULL
        AND EXTRACT(YEAR FROM d.completed_at) = ${year}
        AND EXTRACT(MONTH FROM d.completed_at) = ${month}
      GROUP BY d.id, dw.user_id
      ORDER BY d.completed_at DESC
    `);
  }

  async getAvailableUsersForDuel() {
    return await this.#db.any(this.#sql.type(UserAvailableForDuelSchema)`
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

  async createDuel(codeword: string, userId1: number, userId2: number) {
    return await this.#db.transaction(async (tx) => {
      const duel = await tx.one(this.#sql.type(DuelSchema)`
        INSERT INTO duels (codeword)
        VALUES (${codeword})
        RETURNING *
      `);

      await tx.many(this.#sql.type(DuelParticipantSchema)`
        INSERT INTO duel_participants (duel_id, user_id)
        SELECT *
        FROM ${this.#sql.unnest(
          [
            [duel.id, userId1],
            [duel.id, userId2],
          ],
          [this.#sql.fragment`int`, this.#sql.fragment`bigint`],
        )}
        RETURNING *
      `);

      return duel;
    });
  }

  async createWeeklyRandomDuels(codeword: string, pairs: number[][]) {
    return await this.#db.transaction(async (tx) => {
      const duels = await tx.many(this.#sql.type(DuelSchema)`
        INSERT INTO duels (codeword)
        SELECT *
        FROM ${this.#sql.unnest(new Array(pairs.length).fill([codeword]), [this.#sql.fragment`text`])}
        RETURNING *
      `);

      await tx.many(this.#sql.type(DuelParticipantSchema)`
        INSERT INTO duel_participants (duel_id, user_id)
        SELECT *
        FROM ${this.#sql.unnest(
          zip(duels, pairs).flatMap(([duel, pair]) => pair.map((userId) => [duel.id, userId])),
          [this.#sql.fragment`int`, this.#sql.fragment`bigint`],
        )}
        RETURNING *
      `);

      return duels;
    });
  }

  /**
   * Completes a duel by setting the completion date and winner.
   * Note: Rating refresh is handled separately by DuelsRatingService.
   * @param duelId The ID of the duel to complete.
   * @param winnerId The ID of the winner (optional).
   */
  async completeDuel(duelId: number, winnerId?: number) {
    await this.#db.transaction(async (tx) => {
      await tx.query(this.#sql.typeAlias("void")`
        UPDATE duels
        SET completed_at = NOW()
        WHERE id = ${duelId}
      `);

      if (winnerId) {
        await tx.query(this.#sql.typeAlias("void")`
          INSERT INTO duel_winners (duel_id, user_id)
          VALUES (${duelId}, ${winnerId})
          ON CONFLICT DO NOTHING
        `);
      }
    });
  }

  /**
   * Returns `true` if a user is participating in a duel (the provided one or any).
   * @param userId The ID of the user to check.
   * @param duelId The ID of the duel to check (optional).
   * @returns True if the user is participating in the duel, false otherwise.
   */
  async getUserDuelParticipation(userId: number, duelId?: number) {
    const conditionFragments = [];
    if (duelId) conditionFragments.push(this.#sql.fragment`d.id = ${duelId}`);
    conditionFragments.push(this.#sql.fragment`dp.user_id = ${userId}`);
    conditionFragments.push(this.#sql.fragment`d.completed_at IS NULL`);

    return await this.#db.exists(this.#sql.typeAlias("void")`
      SELECT
      FROM duel_participants AS dp
      JOIN duels AS d ON d.id = dp.duel_id
      WHERE ${this.#sql.join(conditionFragments, this.#sql.fragment` AND `)}
    `);
  }
}
