-- HANYAO V1.1 WP08: widen the existing canonical conversion/outbox contract.
--
-- SQLite cannot alter a CHECK constraint in place. This is a complete,
-- evidence-reconstructed rebuild of the current local contract, preserving
-- every existing column, FK, index, completion invariant, and provider-ledger
-- relationship while allowing the two later-stage conversion types.
--
-- Production application remains separately gated by a fresh D1 sqlite_schema
-- readback and same-source post-migration verification. This file is replayed
-- locally in CI before any provider mutation is considered.
--
-- WP09A repeat-stage policy: one canonical Qualified outcome and one canonical
-- Won Job outcome are allowed per verified inquiry. The lead-token/type
-- uniqueness below is intentional and is enforced by a prestate gate with the
-- deterministic STAGE_REPEAT_OUTCOME_BLOCKED reason; it is not a silent
-- legacy constraint.

PRAGMA foreign_keys = OFF;

CREATE TABLE business_conversions_v11 (
  business_conversion_id TEXT PRIMARY KEY NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  conversion_type TEXT NOT NULL CHECK (
    conversion_type IN (
      'verified_line_contact',
      'qualified_line_lead',
      'won_job'
    )
  ),
  subject_kind TEXT NOT NULL CHECK (
    subject_kind IN ('LINE_USER_HMAC', 'ATTRIBUTION_SESSION')
  ),
  subject_key TEXT NOT NULL,
  attribution_session_id TEXT NOT NULL,
  first_lead_token TEXT NOT NULL,
  first_line_event_id TEXT NOT NULL,
  first_webhook_event_id TEXT,
  conversion_time TEXT NOT NULL,
  dedupe_until TEXT NOT NULL,
  attribution_touch TEXT NOT NULL CHECK (
    attribution_touch IN ('first', 'last')
  ),
  gclid TEXT,
  gbraid TEXT,
  wbraid TEXT,
  lineage_observed_at TEXT NOT NULL,
  destination_key TEXT NOT NULL,
  conversion_action_id TEXT NOT NULL,
  eligibility_state TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    eligibility_state IN ('PENDING', 'ELIGIBLE', 'WITHHELD', 'REVIEW')
  ),
  eligibility_reason TEXT,
  eligibility_evaluated_at TEXT,
  outcome_state TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    outcome_state IN (
      'PENDING',
      'SUCCESS',
      'FAILED',
      'RECONCILIATION_REQUIRED',
      'WITHHELD'
    )
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  completion_id TEXT,
  stage_event_id TEXT,
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
  CHECK (
    conversion_type <> 'won_job'
    OR (
      conversion_value_micros IS NOT NULL
      AND conversion_value_micros > 0
      AND currency_code IS NOT NULL
    )
  ),
  FOREIGN KEY (attribution_session_id)
    REFERENCES attribution_sessions (session_id),
  FOREIGN KEY (first_lead_token)
    REFERENCES lead_tokens (lead_token),
  FOREIGN KEY (first_line_event_id)
    REFERENCES line_events (line_event_id),
  FOREIGN KEY (stage_event_id)
    REFERENCES lead_stage_events (stage_event_id)
    ON DELETE RESTRICT
);

INSERT INTO business_conversions_v11 (
  business_conversion_id, transaction_id, conversion_type, subject_kind, subject_key,
  attribution_session_id, first_lead_token, first_line_event_id, first_webhook_event_id,
  conversion_time, dedupe_until, attribution_touch, gclid, gbraid, wbraid,
  lineage_observed_at, destination_key, conversion_action_id,
  eligibility_state, eligibility_reason, eligibility_evaluated_at,
  outcome_state, created_at, updated_at, version, completion_id,
  stage_event_id, conversion_value_micros, currency_code
)
SELECT
  business_conversion_id, transaction_id, conversion_type, subject_kind, subject_key,
  attribution_session_id, first_lead_token, first_line_event_id, first_webhook_event_id,
  conversion_time, dedupe_until, attribution_touch, gclid, gbraid, wbraid,
  lineage_observed_at, destination_key, conversion_action_id,
  eligibility_state, eligibility_reason, eligibility_evaluated_at,
  outcome_state, created_at, updated_at, version, completion_id,
  NULL, NULL, NULL
FROM business_conversions;

DROP TABLE business_conversions;
ALTER TABLE business_conversions_v11 RENAME TO business_conversions;

CREATE UNIQUE INDEX idx_business_conversions_verified_line_event
  ON business_conversions (first_line_event_id)
  WHERE conversion_type = 'verified_line_contact';

CREATE UNIQUE INDEX idx_business_conversions_verified_webhook_event
  ON business_conversions (first_webhook_event_id)
  WHERE conversion_type = 'verified_line_contact'
    AND first_webhook_event_id IS NOT NULL;

CREATE UNIQUE INDEX idx_business_conversions_stage_event
  ON business_conversions (stage_event_id)
  WHERE stage_event_id IS NOT NULL;

CREATE INDEX idx_business_conversions_subject_window
  ON business_conversions (subject_kind, subject_key, conversion_type, dedupe_until);
CREATE INDEX idx_business_conversions_session_lineage
  ON business_conversions (attribution_session_id, lineage_observed_at);
CREATE INDEX idx_business_conversions_eligibility
  ON business_conversions (eligibility_state, outcome_state, updated_at);
CREATE INDEX idx_business_conversions_projector
  ON business_conversions (eligibility_state, outcome_state, created_at, updated_at);
CREATE UNIQUE INDEX idx_business_conversions_completion_id
  ON business_conversions (completion_id)
  WHERE completion_id IS NOT NULL;

CREATE TABLE business_conversion_dedupe_locks_v11 (
  subject_kind TEXT NOT NULL CHECK (
    subject_kind IN ('LINE_USER_HMAC', 'ATTRIBUTION_SESSION')
  ),
  subject_key TEXT NOT NULL,
  conversion_type TEXT NOT NULL CHECK (
    conversion_type IN (
      'verified_line_contact',
      'qualified_line_lead',
      'won_job'
    )
  ),
  active_business_conversion_id TEXT NOT NULL,
  dedupe_until TEXT NOT NULL,
  last_lineage_observed_at TEXT,
  fence_version INTEGER NOT NULL DEFAULT 0 CHECK (fence_version >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (subject_kind, subject_key, conversion_type),
  FOREIGN KEY (active_business_conversion_id)
    REFERENCES business_conversions (business_conversion_id)
);

INSERT INTO business_conversion_dedupe_locks_v11 (
  subject_kind, subject_key, conversion_type, active_business_conversion_id,
  dedupe_until, last_lineage_observed_at, fence_version, updated_at
)
SELECT
  subject_kind, subject_key, conversion_type, active_business_conversion_id,
  dedupe_until, last_lineage_observed_at, fence_version, updated_at
FROM business_conversion_dedupe_locks;

DROP TABLE business_conversion_dedupe_locks;
ALTER TABLE business_conversion_dedupe_locks_v11 RENAME TO business_conversion_dedupe_locks;

CREATE INDEX idx_business_conversion_dedupe_locks_due
  ON business_conversion_dedupe_locks (dedupe_until, updated_at);

CREATE TABLE conversion_outbox_v11 (
  conversion_id TEXT PRIMARY KEY NOT NULL,
  lead_token TEXT NOT NULL,
  conversion_type TEXT NOT NULL CHECK (
    conversion_type IN (
      'verified_line_contact',
      'qualified_line_lead',
      'won_job'
    )
  ),
  event_timestamp TEXT NOT NULL,
  gclid TEXT,
  gbraid TEXT,
  wbraid TEXT,
  attribution_touch TEXT CHECK (attribution_touch IN ('last', 'first')),
  transaction_id TEXT NOT NULL UNIQUE,
  destination_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'processing',
      'validated_only',
      'submitted',
      'success',
      'failed',
      'deduplicated',
      'sent'
    )
  ),
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  submitted_at TEXT,
  google_request_id TEXT,
  next_diagnostic_at TEXT,
  terminal_result TEXT,
  last_error_reason TEXT,
  diagnostic_status TEXT,
  diagnostic_record_count INTEGER,
  diagnostic_error_reason TEXT,
  diagnostic_attempt_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  business_conversion_id TEXT,
  snapshot_version INTEGER NOT NULL DEFAULT 1 CHECK (snapshot_version >= 1),
  eligibility_rule_version TEXT NOT NULL DEFAULT 'v1',
  google_ads_account_id TEXT,
  google_ads_conversion_action_id TEXT,
  event_source TEXT NOT NULL DEFAULT 'MESSAGE' CHECK (
    event_source IN ('MESSAGE', 'PHONE', 'OTHER')
  ),
  lease_generation INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  lease_owner TEXT,
  lease_expires_at TEXT,
  upload_payload_hash TEXT,
  completion_id TEXT,
  provider_warning_json TEXT,
  stage_event_id TEXT,
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
  CHECK (
    conversion_type <> 'won_job'
    OR (
      conversion_value_micros IS NOT NULL
      AND conversion_value_micros > 0
      AND currency_code IS NOT NULL
    )
  ),
  UNIQUE (lead_token, conversion_type),
  FOREIGN KEY (lead_token)
    REFERENCES lead_tokens (lead_token)
    ON DELETE RESTRICT,
  FOREIGN KEY (stage_event_id)
    REFERENCES lead_stage_events (stage_event_id)
    ON DELETE RESTRICT
);

INSERT INTO conversion_outbox_v11 (
  conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid,
  wbraid, attribution_touch, transaction_id, destination_key, status,
  retry_count, next_retry_at, last_error_code, created_at, sent_at,
  submitted_at, google_request_id, next_diagnostic_at, terminal_result,
  last_error_reason, diagnostic_status, diagnostic_record_count,
  diagnostic_error_reason, diagnostic_attempt_count, updated_at,
  business_conversion_id, snapshot_version, eligibility_rule_version,
  google_ads_account_id, google_ads_conversion_action_id, event_source,
  lease_generation, lease_owner, lease_expires_at, upload_payload_hash,
  completion_id, provider_warning_json, stage_event_id,
  conversion_value_micros, currency_code
)
SELECT
  conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid,
  wbraid, attribution_touch, transaction_id, destination_key, status,
  retry_count, next_retry_at, last_error_code, created_at, sent_at,
  submitted_at, google_request_id, next_diagnostic_at, terminal_result,
  last_error_reason, diagnostic_status, diagnostic_record_count,
  diagnostic_error_reason, diagnostic_attempt_count, updated_at,
  business_conversion_id, snapshot_version, eligibility_rule_version,
  google_ads_account_id, google_ads_conversion_action_id, event_source,
  lease_generation, lease_owner, lease_expires_at, upload_payload_hash,
  completion_id, provider_warning_json, NULL, NULL, NULL
FROM conversion_outbox;

DROP TABLE conversion_outbox;
ALTER TABLE conversion_outbox_v11 RENAME TO conversion_outbox;

CREATE INDEX idx_conversion_outbox_status_next_retry
  ON conversion_outbox (status, next_retry_at, created_at);
CREATE INDEX idx_conversion_outbox_status
  ON conversion_outbox (status);
CREATE INDEX idx_conversion_outbox_next_retry_at
  ON conversion_outbox (next_retry_at);
CREATE INDEX idx_conversion_outbox_lead_token
  ON conversion_outbox (lead_token);
CREATE INDEX idx_conversion_outbox_diagnostic_due
  ON conversion_outbox (status, next_diagnostic_at, submitted_at);
CREATE INDEX idx_conversion_outbox_google_request_id
  ON conversion_outbox (google_request_id);
CREATE INDEX idx_conversion_outbox_business_conversion
  ON conversion_outbox (business_conversion_id);
CREATE INDEX idx_conversion_outbox_processing_lease
  ON conversion_outbox (status, lease_expires_at, updated_at);
CREATE UNIQUE INDEX idx_conversion_outbox_completion_id
  ON conversion_outbox (completion_id)
  WHERE completion_id IS NOT NULL;

PRAGMA foreign_keys = ON;
