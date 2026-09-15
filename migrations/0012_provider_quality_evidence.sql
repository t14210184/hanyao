-- Persist bounded, sanitized Data Manager warning evidence without adding a second ledger.
-- The outbox keeps the current summary; ACK/terminal attempt events keep durable provider evidence.

ALTER TABLE conversion_outbox ADD COLUMN provider_warning_json TEXT;
ALTER TABLE provider_attempt_events ADD COLUMN provider_warning_json TEXT;
