-- Up Migration
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  username VARCHAR(32) UNIQUE,
  fullname VARCHAR(129) NOT NULL,
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Trigger function to auto-update the `updated_at` column.
CREATE OR REPLACE FUNCTION update_updated_at_column () RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- Down Migration
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;

DROP FUNCTION IF EXISTS update_updated_at_column ();

DROP TABLE IF EXISTS users;
