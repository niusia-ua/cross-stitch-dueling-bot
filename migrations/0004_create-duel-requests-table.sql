-- Up Migration
CREATE TABLE duel_requests (
  id SERIAL PRIMARY KEY,
  from_user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  to_user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

-- Down Migration
DROP TABLE IF EXISTS duel_requests;
