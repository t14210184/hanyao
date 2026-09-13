-- EVIDENCE-RECONSTRUCTED MIGRATION.
-- Original 2026-09-08 SQL was not recoverable. This migration reproduces the
-- Production canonical delivery schema and preserves pre-cutover rows fail-closed.
-- Production already records this migration name and MUST NOT re-run it.

ALTER TABLE conversion_outbox ADD COLUMN business_conversion_id TEXT;
ALTER TABLE conversion_outbox ADD COLUMN snapshot_version INTEGER NOT NULL DEFAULT 1
  CHECK (snapshot_version >= 1);
ALTER TABLE conversion_outbox ADD COLUMN eligibility_rule_version TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE conversion_outbox ADD COLUMN google_ads_account_id TEXT;
ALTER TABLE conversion_outbox ADD COLUMN google_ads_conversion_action_id TEXT;
ALTER TABLE conversion_outbox ADD COLUMN event_source TEXT NOT NULL DEFAULT 'MESSAGE'
  CHECK (event_source = 'MESSAGE');
ALTER TABLE conversion_outbox ADD COLUMN lease_generation INTEGER NOT NULL DEFAULT 0
  CHECK (lease_generation >= 0);
ALTER TABLE conversion_outbox ADD COLUMN lease_owner TEXT;
ALTER TABLE conversion_outbox ADD COLUMN lease_expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_conversion_outbox_business_conversion
  ON conversion_outbox (business_conversion_id);
CREATE INDEX IF NOT EXISTS idx_conversion_outbox_processing_lease
  ON conversion_outbox (status, lease_expires_at, updated_at);

CREATE INDEX IF NOT EXISTS idx_business_conversions_projector
  ON business_conversions (eligibility_state, outcome_state, created_at, updated_at);

CREATE TABLE IF NOT EXISTS canonical_outbox_delivery_config (  config_id INTEGER PRIMARY KEY CHECK (config_id = 1),
  projector_cutover_at TEXT NOT NULL,
  eligibility_rule_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO canonical_outbox_delivery_config (
  config_id, projector_cutover_at, eligibility_rule_version, created_at
) VALUES (
  1, '2026-09-08T03:46:03.178Z', 'v1', '2026-09-08T03:46:03.178Z'
);

-- Any business conversion that predates the canonical delivery cutover remains
-- non-deliverable until provenance is explicitly reviewed. This is a
-- reconstruction safety rule, not a claim that the lost original SQL matched byte-for-byte.
UPDATE business_conversions
SET eligibility_state = 'REVIEW',
    eligibility_reason = 'LEGACY_PREEXISTING_PROVENANCE',
    eligibility_evaluated_at = '2026-09-08T03:46:03.178Z',
    outcome_state = 'PENDING',
    updated_at = '2026-09-08T03:46:03.178Z',
    version = version + 1
WHERE conversion_time < '2026-09-08T03:46:03.178Z'
  AND eligibility_state IN ('PENDING', 'ELIGIBLE');

-- Legacy outbox rows are retained but cannot be silently uploaded by a fresh
-- disaster-recovery replay.
UPDATE conversion_outbox
SET status = 'failed',    next_retry_at = NULL,
    last_error_code = 'LEGACY_PREEXISTING_PROVENANCE',
    terminal_result = 'LEGACY_PREEXISTING_PROVENANCE',
    last_error_reason = 'LEGACY_PREEXISTING_PROVENANCE',
    updated_at = '2026-09-08T03:46:03.178Z'
WHERE event_timestamp < '2026-09-08T03:46:03.178Z'
  AND business_conversion_id IS NULL
  AND status IN ('pending', 'processing', 'submitted');

CREATE TABLE IF NOT EXISTS provider_attempts (
  attempt_id TEXT PRIMARY KEY NOT NULL,
  business_conversion_id TEXT NOT NULL,
  attempt_sequence INTEGER NOT NULL CHECK (attempt_sequence >= 1),
  transaction_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  attempt_intent TEXT NOT NULL,
  fence_token INTEGER NOT NULL CHECK (fence_token >= 0),
  lease_expires_at TEXT,
  started_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (business_conversion_id, attempt_sequence),
  FOREIGN KEY (business_conversion_id)
    REFERENCES business_conversions (business_conversion_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_attempts_business_conversion
  ON provider_attempts (business_conversion_id, created_at);
CREATE TABLE IF NOT EXISTS provider_attempt_events (
  attempt_event_id TEXT PRIMARY KEY NOT NULL,
  attempt_id TEXT NOT NULL,
  event_sequence INTEGER NOT NULL CHECK (event_sequence >= 1),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'ATTEMPT_STARTED',
      'SENT_UNKNOWN',
      'ACKNOWLEDGED',
      'RECONCILIATION_REQUIRED',
      'SUCCESS',
      'FAILED',
      'DUPLICATE_TRANSACTION_ID',
      'DIAGNOSTIC'
    )
  ),
  recorded_at TEXT NOT NULL,
  http_status INTEGER CHECK (
    http_status IS NULL OR (http_status >= 100 AND http_status <= 599)
  ),
  provider_request_id TEXT,
  normalized_status TEXT NOT NULL,
  retryable INTEGER NOT NULL DEFAULT 0 CHECK (retryable IN (0, 1)),
  ambiguous INTEGER NOT NULL DEFAULT 0 CHECK (ambiguous IN (0, 1)),
  dedupe_indicator TEXT,
  record_count INTEGER CHECK (record_count IS NULL OR record_count >= 0),
  sanitized_reason TEXT,
  diagnostic_due_at TEXT,  UNIQUE (attempt_id, event_sequence),
  FOREIGN KEY (attempt_id) REFERENCES provider_attempts (attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_attempt_events_diagnostic
  ON provider_attempt_events (normalized_status, diagnostic_due_at, recorded_at);

CREATE TABLE IF NOT EXISTS provider_delivery_leases (
  business_conversion_id TEXT PRIMARY KEY NOT NULL,
  lease_state TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (
    lease_state IN (
      'AVAILABLE',
      'CLAIMED',
      'RECONCILIATION_REQUIRED',
      'CLOSED'
    )
  ),
  lease_owner TEXT,
  active_attempt_id TEXT,
  fence_token INTEGER NOT NULL DEFAULT 0 CHECK (fence_token >= 0),
  lease_expires_at TEXT,
  last_reconciled_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (business_conversion_id)
    REFERENCES business_conversions (business_conversion_id),
  FOREIGN KEY (active_attempt_id) REFERENCES provider_attempts (attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_delivery_leases_state
  ON provider_delivery_leases (lease_state, lease_expires_at, updated_at);