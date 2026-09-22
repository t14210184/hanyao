-- HANYAO V1.1 WP08/WP09B: widen the canonical conversion/outbox contract.
--
-- SQLite cannot alter a CHECK constraint in place. This migration therefore
-- builds an evidence-reconstructed v11 graph, copies the existing rows, and
-- switches every dependent table to the new graph before dropping any old
-- parent table. It intentionally does not disable foreign-key enforcement and
-- does not rely on deferred violations to make a parent rebuild succeed.
--
-- Wrangler's D1 local migration rehearsal exercises this exact file against a
-- populated graph before any Production migration or provider mutation.
--
-- WP09A repeat-stage policy: one canonical Qualified outcome and one canonical
-- Won Job outcome are allowed per verified inquiry. The lead-token/type
-- uniqueness below is intentional and is enforced by a prestate gate with the
-- deterministic STAGE_REPEAT_OUTCOME_BLOCKED reason; it is not a silent
-- legacy constraint.

-- D1 keeps foreign-key enforcement enabled. This pragma is defensive only;
-- every create/copy/drop/rename below is ordered so the graph is valid at each
-- D1 statement boundary. The acceptance test also requires FK enforcement and
-- an empty PRAGMA foreign_key_check after the migration.
PRAGMA defer_foreign_keys = ON;

-- The two mutually-referencing v11 tables are created first. SQLite permits a
-- CREATE TABLE to refer to a table created later in the same schema update.
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
    REFERENCES lead_stage_events_v11 (stage_event_id)
    ON DELETE RESTRICT
);

CREATE TABLE lead_stage_events_v11 (
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
    REFERENCES business_conversions_v11 (business_conversion_id)
    ON DELETE RESTRICT
);

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
    REFERENCES business_conversions_v11 (business_conversion_id)
);

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
    REFERENCES lead_stage_events_v11 (stage_event_id)
    ON DELETE RESTRICT
);

CREATE TABLE legacy_conversion_bridge_v11 (
  legacy_conversion_id TEXT PRIMARY KEY NOT NULL,
  business_conversion_id TEXT UNIQUE,
  mapping_state TEXT NOT NULL DEFAULT 'LEGACY_IDENTITY_UNPROVEN' CHECK (
    mapping_state IN (
      'LEGACY_IDENTITY_UNPROVEN', 'SAFE_MAPPED', 'REVIEW_REQUIRED'
    )
  ),
  reason_code TEXT NOT NULL DEFAULT 'LEGACY_IDENTITY_UNPROVEN',
  legacy_transaction_id TEXT NOT NULL,
  source_event_timestamp TEXT NOT NULL,
  source_attribution_session_id TEXT,
  mapped_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (legacy_conversion_id) REFERENCES conversion_outbox_v11 (conversion_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (business_conversion_id) REFERENCES business_conversions_v11 (business_conversion_id),
  FOREIGN KEY (source_attribution_session_id)
    REFERENCES attribution_sessions (session_id)
);

CREATE TABLE provider_attempts_v11 (
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
  destination_key TEXT,
  payload_hash TEXT,
  UNIQUE (business_conversion_id, attempt_sequence),
  FOREIGN KEY (business_conversion_id)
    REFERENCES business_conversions_v11 (business_conversion_id)
);

CREATE TABLE provider_attempt_events_v11 (
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
  diagnostic_due_at TEXT,
  completion_id TEXT,
  provider_warning_json TEXT,
  UNIQUE (attempt_id, event_sequence),
  FOREIGN KEY (attempt_id) REFERENCES provider_attempts_v11 (attempt_id)
);

CREATE TABLE provider_delivery_leases_v11 (
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
  completion_id TEXT,
  FOREIGN KEY (business_conversion_id)
    REFERENCES business_conversions_v11 (business_conversion_id),
  FOREIGN KEY (active_attempt_id) REFERENCES provider_attempts_v11 (attempt_id)
);

CREATE TABLE conversion_user_data_snapshots_v11 (
  business_conversion_id TEXT PRIMARY KEY NOT NULL,
  line_user_key TEXT NOT NULL,
  snapshot_version INTEGER NOT NULL DEFAULT 1
    CHECK (snapshot_version >= 1),
  snapshotted_at TEXT NOT NULL,
  sealed_at TEXT,
  created_at TEXT NOT NULL,
  consent_state TEXT NOT NULL DEFAULT 'UNSPECIFIED'
    CHECK (consent_state IN ('GRANTED', 'DENIED', 'UNSPECIFIED')),
  consent_source TEXT,
  consent_observed_at TEXT,
  consent_policy_version TEXT NOT NULL DEFAULT 'v1',
  FOREIGN KEY (business_conversion_id)
    REFERENCES business_conversions_v11 (business_conversion_id)
    ON DELETE RESTRICT
);

CREATE TABLE conversion_user_data_snapshot_items_v11 (
  business_conversion_id TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (
    identifier_type IN ('EMAIL_SHA256', 'PHONE_SHA256')
  ),
  identifier_hash TEXT NOT NULL CHECK (
    length(identifier_hash) = 64
    AND identifier_hash NOT GLOB '*[^0-9a-fA-F]*'
  ),
  source_line_event_id TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (
    business_conversion_id,
    identifier_type,
    identifier_hash
  ),
  FOREIGN KEY (business_conversion_id)
    REFERENCES conversion_user_data_snapshots_v11 (business_conversion_id)
    ON DELETE CASCADE,
  FOREIGN KEY (source_line_event_id)
    REFERENCES line_events (line_event_id)
    ON DELETE RESTRICT
);

CREATE TABLE token_claims_v11 (
  lead_token TEXT PRIMARY KEY NOT NULL,
  claimant_kind TEXT NOT NULL CHECK (
    claimant_kind IN ('LINE_USER_HMAC', 'ATTRIBUTION_SESSION')
  ),
  claimant_key TEXT NOT NULL,
  business_conversion_id TEXT NOT NULL,
  first_line_event_id TEXT NOT NULL UNIQUE,
  claimed_at TEXT NOT NULL,
  claim_state TEXT NOT NULL DEFAULT 'CLAIMED' CHECK (
    claim_state IN ('CLAIMED', 'CONFLICT_REVIEW')
  ),
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_token) REFERENCES lead_tokens (lead_token),
  FOREIGN KEY (business_conversion_id)
    REFERENCES business_conversions_v11 (business_conversion_id),
  FOREIGN KEY (first_line_event_id) REFERENCES line_events (line_event_id)
);

-- Copy parent rows first, then dependent rows into the new graph.
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

INSERT INTO lead_stage_events_v11 SELECT * FROM lead_stage_events;
INSERT INTO business_conversion_dedupe_locks_v11 SELECT * FROM business_conversion_dedupe_locks;

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

INSERT INTO legacy_conversion_bridge_v11 SELECT * FROM legacy_conversion_bridge;
INSERT INTO provider_attempts_v11 SELECT * FROM provider_attempts;
INSERT INTO provider_attempt_events_v11 SELECT * FROM provider_attempt_events;
INSERT INTO provider_delivery_leases_v11 SELECT * FROM provider_delivery_leases;
INSERT INTO conversion_user_data_snapshots_v11 SELECT * FROM conversion_user_data_snapshots;
INSERT INTO conversion_user_data_snapshot_items_v11 SELECT * FROM conversion_user_data_snapshot_items;
INSERT INTO token_claims_v11 SELECT * FROM token_claims;

-- Remove only old child tables first. No remaining table references these old
-- objects when the old parent tables are dropped below.
DROP TABLE lead_stage_events;
DROP TABLE business_conversion_dedupe_locks;
DROP TABLE token_claims;
DROP TABLE provider_attempt_events;
DROP TABLE provider_delivery_leases;
DROP TABLE provider_attempts;
DROP TABLE conversion_user_data_snapshot_items;
DROP TABLE conversion_user_data_snapshots;
DROP TABLE legacy_conversion_bridge;
DROP TABLE conversion_outbox;
DROP TABLE business_conversions;

-- Put the new graph under the canonical names only after all old references
-- have been removed. SQLite updates foreign-key declarations on rename.
ALTER TABLE lead_stage_events_v11 RENAME TO lead_stage_events;
ALTER TABLE business_conversion_dedupe_locks_v11 RENAME TO business_conversion_dedupe_locks;
ALTER TABLE token_claims_v11 RENAME TO token_claims;
ALTER TABLE provider_attempt_events_v11 RENAME TO provider_attempt_events;
ALTER TABLE provider_delivery_leases_v11 RENAME TO provider_delivery_leases;
ALTER TABLE provider_attempts_v11 RENAME TO provider_attempts;
ALTER TABLE conversion_user_data_snapshot_items_v11 RENAME TO conversion_user_data_snapshot_items;
ALTER TABLE conversion_user_data_snapshots_v11 RENAME TO conversion_user_data_snapshots;
ALTER TABLE legacy_conversion_bridge_v11 RENAME TO legacy_conversion_bridge;
ALTER TABLE conversion_outbox_v11 RENAME TO conversion_outbox;
ALTER TABLE business_conversions_v11 RENAME TO business_conversions;

-- Recreate all legacy indexes on rebuilt tables, plus explicit stage-type
-- indexes used by Qualified and Won Job readback and upload fencing.
CREATE INDEX idx_lead_stage_events_source_conversion
  ON lead_stage_events (source_verified_business_conversion_id, occurred_at, stage_type);
CREATE INDEX idx_lead_stage_events_stage_type
  ON lead_stage_events (stage_type, occurred_at, stage_event_id);
CREATE INDEX idx_lead_stage_events_line_user
  ON lead_stage_events (line_user_key, occurred_at, stage_type);

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
CREATE INDEX idx_business_conversions_stage_type
  ON business_conversions (conversion_type, stage_event_id, created_at);
CREATE INDEX idx_business_conversions_session_lineage
  ON business_conversions (attribution_session_id, lineage_observed_at);
CREATE INDEX idx_business_conversions_eligibility
  ON business_conversions (eligibility_state, outcome_state, updated_at);
CREATE INDEX idx_business_conversions_projector
  ON business_conversions (eligibility_state, outcome_state, created_at, updated_at);
CREATE UNIQUE INDEX idx_business_conversions_completion_id
  ON business_conversions (completion_id)
  WHERE completion_id IS NOT NULL;

CREATE INDEX idx_business_conversion_dedupe_locks_due
  ON business_conversion_dedupe_locks (dedupe_until, updated_at);

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
CREATE INDEX idx_conversion_outbox_stage_type
  ON conversion_outbox (conversion_type, stage_event_id, created_at);
CREATE INDEX idx_conversion_outbox_processing_lease
  ON conversion_outbox (status, lease_expires_at, updated_at);
CREATE UNIQUE INDEX idx_conversion_outbox_completion_id
  ON conversion_outbox (completion_id)
  WHERE completion_id IS NOT NULL;

CREATE INDEX idx_legacy_conversion_bridge_state
  ON legacy_conversion_bridge (mapping_state, created_at);
CREATE INDEX idx_provider_attempts_business_conversion
  ON provider_attempts (business_conversion_id, created_at);
CREATE INDEX idx_provider_attempts_recovery_context
  ON provider_attempts (
    business_conversion_id,
    transaction_id,
    fence_token,
    destination_key,
    payload_hash
  );
CREATE INDEX idx_provider_attempt_events_ack_restore
  ON provider_attempt_events (attempt_id, event_type, provider_request_id, recorded_at);
CREATE UNIQUE INDEX idx_provider_attempt_events_completion_id
  ON provider_attempt_events (completion_id)
  WHERE completion_id IS NOT NULL;
CREATE INDEX idx_provider_attempt_events_diagnostic
  ON provider_attempt_events (normalized_status, diagnostic_due_at, recorded_at);
CREATE INDEX idx_provider_delivery_leases_completion_id
  ON provider_delivery_leases (completion_id);
CREATE INDEX idx_provider_delivery_leases_state
  ON provider_delivery_leases (lease_state, lease_expires_at, updated_at);
CREATE INDEX idx_token_claims_business_conversion
  ON token_claims (business_conversion_id, claimed_at);
CREATE INDEX idx_conversion_user_data_snapshots_line_user
  ON conversion_user_data_snapshots (line_user_key, snapshotted_at);
CREATE INDEX idx_conversion_user_data_snapshot_items_lookup
  ON conversion_user_data_snapshot_items (
    business_conversion_id,
    identifier_type,
    first_seen_at,
    identifier_hash
  );

-- No PRAGMA foreign_keys toggle is permitted in an unapplied migration. The
-- D1-native acceptance test proves that enforcement stays enabled and that
-- the rebuilt graph has no orphaned or deleted dependent rows.
