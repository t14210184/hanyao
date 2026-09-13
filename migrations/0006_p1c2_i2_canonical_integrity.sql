-- EVIDENCE-RECONSTRUCTED MIGRATION.
-- Original 2026-09-03 SQL was not recoverable. This restores the canonical
-- integrity columns/tables observed in the Production D1 schema.
-- Production already records this migration name and MUST NOT re-run it.

ALTER TABLE line_events ADD COLUMN line_event_type TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE line_events ADD COLUMN source_type TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE line_events ADD COLUMN message_type TEXT;
ALTER TABLE line_events ADD COLUMN token_extraction_count INTEGER NOT NULL DEFAULT 0
  CHECK (token_extraction_count >= 0);
ALTER TABLE line_events ADD COLUMN identity_state TEXT NOT NULL DEFAULT 'LEGACY_UNKNOWN'
  CHECK (identity_state IN ('KNOWN', 'ABSENT', 'LEGACY_UNKNOWN'));
ALTER TABLE line_events ADD COLUMN identity_key_id TEXT;
ALTER TABLE line_events ADD COLUMN line_destination TEXT;
ALTER TABLE line_events ADD COLUMN business_subject_kind TEXT CHECK (
  business_subject_kind IS NULL OR
  business_subject_kind IN ('LINE_USER_HMAC', 'ATTRIBUTION_SESSION')
);
ALTER TABLE line_events ADD COLUMN business_subject_key TEXT;
ALTER TABLE line_events ADD COLUMN attribution_session_id TEXT;
ALTER TABLE line_events ADD COLUMN attribution_touch TEXT CHECK (
  attribution_touch IS NULL OR attribution_touch IN ('first', 'last')
);
ALTER TABLE line_events ADD COLUMN gclid TEXT;
ALTER TABLE line_events ADD COLUMN gbraid TEXT;
ALTER TABLE line_events ADD COLUMN wbraid TEXT;
ALTER TABLE line_events ADD COLUMN lineage_snapshot_json TEXT;
ALTER TABLE line_events ADD COLUMN lineage_frozen_at TEXT;
ALTER TABLE line_events ADD COLUMN canonical_fingerprint TEXT;
CREATE INDEX IF NOT EXISTS idx_line_events_identity_state
  ON line_events (identity_state, created_at);

CREATE TABLE IF NOT EXISTS line_event_integrity_incidents (
  incident_id TEXT PRIMARY KEY NOT NULL,
  webhook_event_id TEXT NOT NULL,
  line_event_id TEXT,
  reason_code TEXT NOT NULL,
  stored_identity_state TEXT,
  observed_identity_state TEXT,
  stored_fingerprint TEXT,
  observed_fingerprint TEXT,
  observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (webhook_event_id, reason_code, observed_fingerprint),
  FOREIGN KEY (line_event_id) REFERENCES line_events (line_event_id)
);

CREATE INDEX IF NOT EXISTS idx_line_event_integrity_incidents_lookup
  ON line_event_integrity_incidents (webhook_event_id, observed_at);

CREATE INDEX IF NOT EXISTS idx_line_event_integrity_incidents_reason
  ON line_event_integrity_incidents (reason_code, observed_at);