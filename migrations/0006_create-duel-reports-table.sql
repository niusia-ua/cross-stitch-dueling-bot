-- Up Migration
CREATE TABLE duel_reports (
  duel_id INT NOT NULL REFERENCES duels (id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stitches REAL NOT NULL,
  additional_info TEXT,
  PRIMARY KEY (duel_id, user_id),
  CHECK (stitches >= 0)
);

-- Down Migration
DROP TABLE IF EXISTS duel_reports;
