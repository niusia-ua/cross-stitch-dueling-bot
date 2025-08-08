-- Up Migration
CREATE TYPE duel_status_enum AS ENUM('active', 'completed');

CREATE TABLE duels (
  id SERIAL PRIMARY KEY,
  codeword TEXT NOT NULL,
  status duel_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Down Migration
DROP TABLE IF EXISTS duels;
