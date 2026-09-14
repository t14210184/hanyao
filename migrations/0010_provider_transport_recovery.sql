-- Bind each Data Manager delivery attempt to an immutable upload context.
-- Legacy attempts remain NULL and therefore cannot be auto-restored.

ALTER TABLE conversion_outbox ADD COLUMN upload_payload_hash TEXT;
ALTER TABLE provider_attempts ADD COLUMN destination_key TEXT;
ALTER TABLE provider_attempts ADD COLUMN payload_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_provider_attempts_recovery_context
  ON provider_attempts (
    business_conversion_id,
    transaction_id,
    fence_token,
    destination_key,
    payload_hash
  );

CREATE INDEX IF NOT EXISTS idx_provider_attempt_events_ack_restore
  ON provider_attempt_events (attempt_id, event_type, provider_request_id, recorded_at);
