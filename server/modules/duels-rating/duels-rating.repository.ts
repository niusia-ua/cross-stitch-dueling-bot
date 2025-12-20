import type { DatabasePool, SqlTag } from "~~/server/database/";

export class DuelsRatingRepository {
  #db: DatabasePool;
  #sql: SqlTag;

  constructor({ db, sql }: RepositoryDependencies) {
    this.#db = db;
    this.#sql = sql;
  }

  /** Retrieves the duels rating information in the current month for all active users. */
  async getDuelsRating() {
    return await this.#db.any(this.#sql.type(DuelsRatingWithUsersInfoSchema)`
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

  /** Retrieves the duels rating information for the previous month for all active users. */
  async getPreviousMonthDuelsRating() {
    return await this.#db.any(this.#sql.type(DuelsRatingWithUsersInfoSchema)`
      WITH
        monthly_participation AS (
          -- Calculate the number of duels each user participated in the previous month.
          SELECT
            dp.user_id,
            COUNT(dp.duel_id) AS total_duels_participated
          FROM
            duel_participants dp
            JOIN duels d ON dp.duel_id = d.id
          WHERE
            d.completed_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
            AND d.completed_at < date_trunc('month', NOW())
          GROUP BY
            dp.user_id
        ),
        monthly_wins AS (
          -- Calculate the number of duels each user won in the previous month.
          SELECT
            dw.user_id,
            COUNT(dw.duel_id) AS total_duels_won
          FROM
            duel_winners dw
            JOIN duels d ON dw.duel_id = d.id
          WHERE
            d.completed_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
            AND d.completed_at < date_trunc('month', NOW())
          GROUP BY
            dw.user_id
        )
      SELECT
        u.id AS user_id,
        COALESCE(mp.total_duels_participated, 0) AS total_duels_participated,
        COALESCE(mw.total_duels_won, 0) AS total_duels_won,
        json_build_object(
          'id', u.id,
          'fullname', u.fullname,
          'photo_url', u.photo_url,
          'stitches_rate', us.stitches_rate
        ) AS user
      FROM
        users u
        JOIN user_settings AS us ON us.user_id = u.id
        LEFT JOIN monthly_participation mp ON u.id = mp.user_id
        LEFT JOIN monthly_wins mw ON u.id = mw.user_id
      WHERE
        u.active = TRUE
        AND (mp.total_duels_participated > 0 OR mw.total_duels_won > 0)
      ORDER BY
        total_duels_won DESC,
        total_duels_participated DESC
    `);
  }

  /** Refreshes the materialized view for duels rating. */
  async refreshDuelsRating() {
    await this.#db.query(this.#sql.typeAlias("void")`
      REFRESH MATERIALIZED VIEW duels_rating
    `);
  }
}
