import type { DatabasePool, SqlTag } from "~~/server/database/";

export class DuelReportsRepository {
  #db: DatabasePool;
  #sql: SqlTag;

  constructor({ db, sql }: RepositoryDependencies) {
    this.#db = db;
    this.#sql = sql;
  }

  async createDuelReport(duelId: number, userId: number, report: DuelReportData) {
    return await this.#db.one(this.#sql.type(DuelReportSchema)`
      INSERT INTO duel_reports (duel_id, user_id, stitches, additional_info)
      VALUES (${duelId}, ${userId}, ${report.stitches}, ${report.additionalInfo})
      ON CONFLICT (duel_id, user_id) DO UPDATE
      SET stitches = EXCLUDED.stitches,
          additional_info = EXCLUDED.additional_info
      RETURNING *
    `);
  }

  async getDuelReport(duelId: number, userId: number) {
    return await this.#db.maybeOne(this.#sql.type(DuelReportSchema)`
      SELECT *
      FROM duel_reports
      WHERE duel_id = ${duelId} AND user_id = ${userId}
    `);
  }

  async getDuelReportsByDuelId(duelId: number) {
    return await this.#db.any(this.#sql.type(DuelReportSchema)`
      SELECT *
      FROM duel_reports
      WHERE duel_id = ${duelId}
    `);
  }
}
