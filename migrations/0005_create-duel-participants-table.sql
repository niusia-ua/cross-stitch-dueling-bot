-- Up Migration
CREATE TABLE duel_participants (
  duel_id INT NOT NULL REFERENCES duels (id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (duel_id, user_id)
);

-- Down Migration
DROP TABLE IF EXISTS duel_participants;
