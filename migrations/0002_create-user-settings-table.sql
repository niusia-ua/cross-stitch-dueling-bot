-- Up Migration
CREATE TYPE stitches_rate_enum AS ENUM('low', 'medium', 'high');

CREATE TABLE user_settings (
  user_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  stitches_rate stitches_rate_enum NOT NULL,
  participates_in_weekly_random_duels BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_user_settings_updated_at BEFORE
UPDATE ON user_settings FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- Down Migration
DROP TRIGGER IF EXISTS trigger_update_user_settings_updated_at ON user_settings;

DROP TABLE IF EXISTS user_settings;

DROP TYPE IF EXISTS stitches_rate_enum;
