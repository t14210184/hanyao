-- HANYAO V1.2: privacy-safe high-intent lead signal shadow schema.
-- Observation-only. This migration MUST NOT create a second conversion sender,
-- MUST NOT alter HY - Verified LINE Contact semantics, and MUST NOT promote a
-- classifier result directly into a Google Ads conversion.
--
-- Privacy:
-- - raw LINE message text is not stored here;
-- - optional email/phone identifiers are persisted only as normalized SHA-256;
-- - Google Ads remains provider truth for Message Asset metrics.

CREATE TABLE IF NOT EXISTS lead_signal_observations (
  observation_id TEXT PRIMARY KEY NOT NULL,
  line_event_id TEXT NOT NULL UNIQUE,
  line_user_key TEXT,
  lead_token TEXT,
  observed_at TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  match_status TEXT NOT NULL,
  attribution_lane TEXT NOT NULL CHECK (
    attribution_lane IN ('EXACT_CLICK', 'USER_DATA_ONLY', 'UNATTRIBUTED')
  ),
  service_signal INTEGER NOT NULL DEFAULT 0 CHECK (service_signal IN (0, 1)),
  transaction_intent_signal INTEGER NOT NULL DEFAULT 0
    CHECK (transaction_intent_signal IN (0, 1)),
  location_signal INTEGER NOT NULL DEFAULT 0 CHECK (location_signal IN (0, 1)),
  schedule_signal INTEGER NOT NULL DEFAULT 0 CHECK (schedule_signal IN (0, 1)),
  contact_signal INTEGER NOT NULL DEFAULT 0 CHECK (contact_signal IN (0, 1)),
  qualified_candidate INTEGER NOT NULL DEFAULT 0
    CHECK (qualified_candidate IN (0, 1)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (line_event_id) REFERENCES line_events (line_event_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (lead_token) REFERENCES lead_tokens (lead_token)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_signal_observations_candidate
  ON lead_signal_observations (
    qualified_candidate,
    attribution_lane,
    observed_at
  );

CREATE INDEX IF NOT EXISTS idx_lead_signal_observations_line_user
  ON lead_signal_observations (line_user_key, observed_at);

CREATE TABLE IF NOT EXISTS lead_user_identifiers (
  identifier_id TEXT PRIMARY KEY NOT NULL,
  line_user_key TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (
    identifier_type IN ('EMAIL_SHA256', 'PHONE_SHA256')
  ),
  identifier_hash TEXT NOT NULL CHECK (length(identifier_hash) = 64),
  source_line_event_id TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (line_user_key, identifier_type, identifier_hash),
  FOREIGN KEY (source_line_event_id) REFERENCES line_events (line_event_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_lead_user_identifiers_line_user
  ON lead_user_identifiers (line_user_key, identifier_type, first_seen_at);

CREATE TABLE IF NOT EXISTS message_asset_metrics_daily (
  metric_date TEXT NOT NULL,
  google_ads_customer_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  asset_status TEXT,
  policy_status TEXT,
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  interactions INTEGER NOT NULL DEFAULT 0 CHECK (interactions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions REAL NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  all_conversions REAL NOT NULL DEFAULT 0 CHECK (all_conversions >= 0),
  cost_micros INTEGER NOT NULL DEFAULT 0 CHECK (cost_micros >= 0),
  provider_observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (
    metric_date,
    google_ads_customer_id,
    campaign_id,
    asset_id
  )
);

CREATE INDEX IF NOT EXISTS idx_message_asset_metrics_campaign_date
  ON message_asset_metrics_daily (campaign_id, metric_date);
