-- Up Migration
CREATE TABLE duels (
  id SERIAL PRIMARY KEY,
  codeword TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Down Migration
DROP TABLE IF EXISTS duels;
