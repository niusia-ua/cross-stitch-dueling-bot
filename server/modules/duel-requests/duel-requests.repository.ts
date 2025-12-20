import z from "zod";

import type { DatabasePool, SqlTag } from "~~/server/database/";

export class DuelRequestsRepository {
  #db: DatabasePool;
  #sql: SqlTag;

  constructor({ db, sql }: RepositoryDependencies) {
    this.#db = db;
    this.#sql = sql;
  }

  async getDuelRequestById(requestId: number) {
    return await this.#db.maybeOne(this.#sql.type(DuelRequestSchema)`
      SELECT *
      FROM duel_requests
      WHERE id = ${requestId}
    `);
  }

  async getDuelRequestsByUserId(userId: number) {
    return await this.#db.any(this.#sql.type(UserDuelRequestSchema)`
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
    return await this.#db.any(this.#sql.type(DuelRequestSchema)`
      INSERT INTO duel_requests (from_user_id, to_user_id)
      SELECT *
      FROM ${this.#sql.unnest(
        toUserIds.map((toUserId) => [fromUserId, toUserId]),
        [this.#sql.fragment`bigint`, this.#sql.fragment`bigint`],
      )}
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
  }

  async removeDuelRequest(requestId: number) {
    return await this.#db.maybeOne(this.#sql.type(
      z.object({
        fromUser: UserIdAndFullnameSchema,
        toUser: UserIdAndFullnameSchema,
        telegramMessageId: z.coerce.number().nullable(),
      }),
    )`
      DELETE FROM duel_requests AS dr
      USING users AS fu, users AS tu
      WHERE dr.id = ${requestId}
        AND fu.id = dr.from_user_id
        AND tu.id = dr.to_user_id
      RETURNING
        json_build_object('id', fu.id, 'fullname', fu.fullname) AS from_user,
        json_build_object('id', tu.id, 'fullname', tu.fullname) AS to_user,
        dr.telegram_message_id
    `);
  }

  /**
   * Sets the telegram message ID for a duel request.
   * @param requestId The ID of the duel request.
   * @param messageId The Telegram message ID to store.
   */
  async setDuelRequestMessageId(requestId: number, messageId: number) {
    await this.#db.query(this.#sql.typeAlias("void")`
      UPDATE duel_requests
      SET telegram_message_id = ${messageId}
      WHERE id = ${requestId}
    `);
  }

  /**
   * Returns all sibling duel requests from the same sender, excluding the specified request.
   * @param fromUserId The ID of the user who sent the requests.
   * @param excludeRequestId The ID of the request to exclude.
   * @returns All other pending requests from the same sender.
   */
  async getSiblingRequests(fromUserId: number, excludeRequestId: number) {
    return await this.#db.any(this.#sql.type(DuelRequestSchema)`
      SELECT *
      FROM duel_requests
      WHERE from_user_id = ${fromUserId} AND id != ${excludeRequestId}
    `);
  }
}
