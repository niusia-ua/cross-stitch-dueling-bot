-- Up Migration
CREATE TABLE duel_reports (
  duel_id INT NOT NULL REFERENCES duels (id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  photos TEXT[] NOT NULL,
  stitches REAL NOT NULL,
  additional_info TEXT,
  PRIMARY KEY (duel_id, user_id),
  CHECK (array_length(photos, 1) >= 2),
  CHECK (stitches >= 0)
);

-- Down Migration
DROP TABLE IF EXISTS duel_reports;
