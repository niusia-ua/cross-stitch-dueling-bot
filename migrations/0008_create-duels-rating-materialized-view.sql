-- Up Migration
CREATE MATERIALIZED VIEW duels_rating AS
WITH
  monthly_participation AS (
    -- Calculate the number of duels each user participated in the current month.
    SELECT
      dp.user_id,
      COUNT(dp.duel_id) AS total_duels_participated
    FROM
      duel_participants dp
      JOIN duels d ON dp.duel_id = d.id
    WHERE
      d.completed_at >= date_trunc('month', NOW())
      AND d.completed_at < date_trunc('month', NOW()) + INTERVAL '1 month'
    GROUP BY
      dp.user_id
  ),
  monthly_wins AS (
    -- Calculate the number of duels each user won in the current month.
    SELECT
      dw.user_id,
      COUNT(dw.duel_id) AS total_duels_won
    FROM
      duel_winners dw
      JOIN duels d ON dw.duel_id = d.id
    WHERE
      d.completed_at >= date_trunc('month', NOW())
      AND d.completed_at < date_trunc('month', NOW()) + INTERVAL '1 month'
    GROUP BY
      dw.user_id
  )
SELECT
  u.id AS user_id,
  COALESCE(mp.total_duels_participated, 0) AS total_duels_participated,
  COALESCE(mw.total_duels_won, 0) AS total_duels_won
FROM
  users u
  LEFT JOIN monthly_participation mp ON u.id = mp.user_id
  LEFT JOIN monthly_wins mw ON u.id = mw.user_id
WHERE
  u.active = TRUE
ORDER BY
  total_duels_won DESC,
  total_duels_participated DESC;

-- Down Migration
DROP MATERIALIZED VIEW IF EXISTS duels_rating;
