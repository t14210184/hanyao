-- EVIDENCE-RECONSTRUCTED MIGRATION.
-- Original 2026-09-03 SQL was not recoverable from Git refs or retained Wrangler logs.
-- DDL below is reconstructed from the Production D1 sqlite_master readback.
-- Production already records this exact migration name and MUST NOT re-run it.

CREATE TABLE IF NOT EXISTS business_conversions (
  business_conversion_id TEXT PRIMARY KEY NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  conversion_type TEXT NOT NULL CHECK (
    conversion_type = 'verified_line_contact'
  ),
  subject_kind TEXT NOT NULL CHECK (
    subject_kind IN ('LINE_USER_HMAC', 'ATTRIBUTION_SESSION')
  ),
  subject_key TEXT NOT NULL,
  attribution_session_id TEXT NOT NULL,
  first_lead_token TEXT NOT NULL,
  first_line_event_id TEXT NOT NULL UNIQUE,
  first_webhook_event_id TEXT UNIQUE,
  conversion_time TEXT NOT NULL,
  dedupe_until TEXT NOT NULL,
  attribution_touch TEXT NOT NULL CHECK (
    attribution_touch IN ('first', 'last')
  ),
  gclid TEXT,
  gbraid TEXT,
  wbraid TEXT,
  lineage_observed_at TEXT NOT NULL,  destination_key TEXT NOT NULL,
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
  FOREIGN KEY (attribution_session_id)
    REFERENCES attribution_sessions (session_id),
  FOREIGN KEY (first_lead_token)
    REFERENCES lead_tokens (lead_token),
  FOREIGN KEY (first_line_event_id)
    REFERENCES line_events (line_event_id)
);

CREATE INDEX IF NOT EXISTS idx_business_conversions_subject_window
  ON business_conversions (subject_kind, subject_key, conversion_type, dedupe_until);
CREATE INDEX IF NOT EXISTS idx_business_conversions_session_lineage
  ON business_conversions (attribution_session_id, lineage_observed_at);

CREATE TABLE IF NOT EXISTS business_conversion_dedupe_locks (
  subject_kind TEXT NOT NULL CHECK (
    subject_kind IN ('LINE_USER_HMAC', 'ATTRIBUTION_SESSION')
  ),
  subject_key TEXT NOT NULL,
  conversion_type TEXT NOT NULL CHECK (
    conversion_type = 'verified_line_contact'
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

CREATE INDEX IF NOT EXISTS idx_business_conversion_dedupe_locks_due
  ON business_conversion_dedupe_locks (dedupe_until, updated_at);

CREATE TABLE IF NOT EXISTS token_claims (
  lead_token TEXT PRIMARY KEY NOT NULL,
  claimant_kind TEXT NOT NULL CHECK (    claimant_kind IN ('LINE_USER_HMAC', 'ATTRIBUTION_SESSION')
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
    REFERENCES business_conversions (business_conversion_id),
  FOREIGN KEY (first_line_event_id) REFERENCES line_events (line_event_id)
);

CREATE INDEX IF NOT EXISTS idx_token_claims_business_conversion
  ON token_claims (business_conversion_id, claimed_at);

CREATE TABLE IF NOT EXISTS token_claim_conflicts (
  conflict_id TEXT PRIMARY KEY NOT NULL,
  lead_token TEXT NOT NULL,
  first_claimant_key TEXT NOT NULL,
  observed_claimant_key TEXT NOT NULL,
  observed_line_event_id TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  review_state TEXT NOT NULL DEFAULT 'OPEN' CHECK (    review_state IN ('OPEN', 'RESOLVED', 'DISMISSED')
  ),
  created_at TEXT NOT NULL,
  UNIQUE (lead_token, observed_line_event_id),
  FOREIGN KEY (lead_token) REFERENCES lead_tokens (lead_token),
  FOREIGN KEY (observed_line_event_id) REFERENCES line_events (line_event_id)
);

CREATE INDEX IF NOT EXISTS idx_token_claim_conflicts_review
  ON token_claim_conflicts (review_state, observed_at);

CREATE TABLE IF NOT EXISTS legacy_conversion_bridge (
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
  FOREIGN KEY (legacy_conversion_id) REFERENCES conversion_outbox (conversion_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (business_conversion_id) REFERENCES business_conversions (business_conversion_id),  FOREIGN KEY (source_attribution_session_id)
    REFERENCES attribution_sessions (session_id)
);

CREATE INDEX IF NOT EXISTS idx_legacy_conversion_bridge_state
  ON legacy_conversion_bridge (mapping_state, created_at);

CREATE INDEX IF NOT EXISTS idx_business_conversions_eligibility
  ON business_conversions (eligibility_state, outcome_state, updated_at);