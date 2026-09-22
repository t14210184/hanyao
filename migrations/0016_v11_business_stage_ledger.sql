-- HANYAO V1.1 WP07: append-only business stage ledger.
-- This table stores structured evidence metadata only. Raw LINE messages,
-- phone numbers, and email addresses are intentionally not part of the schema.

CREATE TABLE IF NOT EXISTS lead_stage_events (
  stage_event_id TEXT PRIMARY KEY NOT NULL,
  source_verified_business_conversion_id TEXT NOT NULL,
  line_user_key TEXT,
  stage_type TEXT NOT NULL CHECK (
    stage_type IN ('QUALIFIED_CANDIDATE', 'QUALIFIED_CONFIRMED', 'WON_JOB')
  ),
  stage_source TEXT NOT NULL CHECK (
    stage_source IN (
      'RULE',
      'HUMAN',
      'JOB_SYSTEM',
      'RULE_CONFIRMED',
      'HUMAN_CONFIRMED',
      'JOB_SCHEDULED',
      'QUOTE_ACCEPTED',
      'PAYMENT_CONFIRMED',
      'SERVICE_COMPLETED'
    )
  ),
  stage_rule_version TEXT NOT NULL,
  evidence_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  occurred_at TEXT NOT NULL,
  event_source TEXT NOT NULL DEFAULT 'MESSAGE' CHECK (
    event_source IN ('MESSAGE', 'PHONE', 'OTHER')
  ),
  conversion_value_micros INTEGER CHECK (
    conversion_value_micros IS NULL OR conversion_value_micros >= 0
  ),
  currency_code TEXT CHECK (
    currency_code IS NULL OR (
      length(currency_code) = 3
      AND currency_code = upper(currency_code)
      AND currency_code NOT GLOB '*[^A-Z]*'
    )
  ),
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_verified_business_conversion_id)
    REFERENCES business_conversions (business_conversion_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_lead_stage_events_source_conversion
  ON lead_stage_events (source_verified_business_conversion_id, occurred_at, stage_type);

CREATE INDEX IF NOT EXISTS idx_lead_stage_events_stage_type
  ON lead_stage_events (stage_type, occurred_at, stage_event_id);

CREATE INDEX IF NOT EXISTS idx_lead_stage_events_line_user
  ON lead_stage_events (line_user_key, occurred_at, stage_type);
