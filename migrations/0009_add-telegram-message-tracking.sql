-- Up Migration
ALTER TABLE duel_requests
ADD COLUMN telegram_message_id BIGINT;

-- Down Migration
ALTER TABLE duel_requests
DROP COLUMN IF EXISTS telegram_message_id;
