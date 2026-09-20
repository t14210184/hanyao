-- HANYAO V1.2 HQ06: immutable Enhanced Conversions user-data snapshot.
-- Additive only. No second outbox and no Google Ads mutation.
--
-- Purpose:
-- - freeze the set of hashed first-party identifiers used for one business conversion;
-- - keep retries byte-stable even if later LINE messages provide additional identifiers;
-- - never store raw email or phone values.
--
-- Activation remains separately feature-gated in the uploader.

CREATE TABLE IF NOT EXISTS conversion_user_data_snapshots (
  business_conversion_id TEXT PRIMARY KEY NOT NULL,
  line_user_key TEXT NOT NULL,
  snapshot_version INTEGER NOT NULL DEFAULT 1
    CHECK (snapshot_version >= 1),
  snapshotted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (business_conversion_id)
    REFERENCES business_conversions (business_conversion_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_conversion_user_data_snapshots_line_user
  ON conversion_user_data_snapshots (line_user_key, snapshotted_at);

CREATE TABLE IF NOT EXISTS conversion_user_data_snapshot_items (
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
    REFERENCES conversion_user_data_snapshots (business_conversion_id)
    ON DELETE CASCADE,
  FOREIGN KEY (source_line_event_id)
    REFERENCES line_events (line_event_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_conversion_user_data_snapshot_items_lookup
  ON conversion_user_data_snapshot_items (
    business_conversion_id,
    identifier_type,
    first_seen_at,
    identifier_hash
  );
