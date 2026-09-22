-- HANYAO V1.1 Wave 0/1: additive observability and privacy hardening.
-- Runtime code only verifies this contract; it must not execute DDL.

ALTER TABLE message_asset_metrics_daily ADD COLUMN message_chats INTEGER NOT NULL DEFAULT 0
  CHECK (message_chats >= 0);
ALTER TABLE message_asset_metrics_daily ADD COLUMN message_impressions INTEGER NOT NULL DEFAULT 0
  CHECK (message_impressions >= 0);
ALTER TABLE message_asset_metrics_daily ADD COLUMN message_chat_rate REAL NOT NULL DEFAULT 0
  CHECK (message_chat_rate >= 0);

CREATE TABLE IF NOT EXISTS message_asset_metrics_collector_state (
  customer_id TEXT PRIMARY KEY NOT NULL,
  last_attempt_at TEXT,
  last_success_at TEXT,
  last_nonempty_at TEXT,
  last_failure_code TEXT,
  last_row_count INTEGER CHECK (last_row_count IS NULL OR last_row_count >= 0),
  updated_at TEXT NOT NULL
);

ALTER TABLE lead_user_identifiers ADD COLUMN expires_at TEXT;
ALTER TABLE lead_user_identifiers ADD COLUMN retention_policy_version TEXT NOT NULL DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS idx_lead_user_identifiers_expiry
  ON lead_user_identifiers (expires_at, identifier_id);

ALTER TABLE conversion_user_data_snapshots ADD COLUMN consent_state TEXT NOT NULL DEFAULT 'UNSPECIFIED'
  CHECK (consent_state IN ('GRANTED', 'DENIED', 'UNSPECIFIED'));
ALTER TABLE conversion_user_data_snapshots ADD COLUMN consent_source TEXT;
ALTER TABLE conversion_user_data_snapshots ADD COLUMN consent_observed_at TEXT;
ALTER TABLE conversion_user_data_snapshots ADD COLUMN consent_policy_version TEXT NOT NULL DEFAULT 'v1';

-- Query-planner-backed click-ID conflict lookup indexes. The partial predicates
-- keep NULL-heavy attribution rows out of the indexes while preserving the
-- existing single conflict query and its bounded LIMIT 1 behavior.
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_first_gclid_active
  ON attribution_sessions (first_gclid, expires_at, session_id)
  WHERE first_gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_last_gclid_active
  ON attribution_sessions (last_gclid, expires_at, session_id)
  WHERE last_gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_first_gbraid_active
  ON attribution_sessions (first_gbraid, expires_at, session_id)
  WHERE first_gbraid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_last_gbraid_active
  ON attribution_sessions (last_gbraid, expires_at, session_id)
  WHERE last_gbraid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_first_wbraid_active
  ON attribution_sessions (first_wbraid, expires_at, session_id)
  WHERE first_wbraid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_last_wbraid_active
  ON attribution_sessions (last_wbraid, expires_at, session_id)
  WHERE last_wbraid IS NOT NULL;
