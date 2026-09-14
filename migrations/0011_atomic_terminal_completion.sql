-- Correlate one terminal completion across outbox, business outcome,
-- provider delivery lease, and terminal attempt evidence.

ALTER TABLE conversion_outbox ADD COLUMN completion_id TEXT;
ALTER TABLE business_conversions ADD COLUMN completion_id TEXT;
ALTER TABLE provider_delivery_leases ADD COLUMN completion_id TEXT;
ALTER TABLE provider_attempt_events ADD COLUMN completion_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_outbox_completion_id
  ON conversion_outbox (completion_id)
  WHERE completion_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_conversions_completion_id
  ON business_conversions (completion_id)
  WHERE completion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_provider_delivery_leases_completion_id
  ON provider_delivery_leases (completion_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_attempt_events_completion_id
  ON provider_attempt_events (completion_id)
  WHERE completion_id IS NOT NULL;
