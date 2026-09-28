-- HANYAO observability closure: explicit LINE match reason classification.
-- Additive only. This does not change conversion eligibility or attribution semantics.
-- Existing rows are backfilled only where the old columns make the reason deterministic.

ALTER TABLE line_events ADD COLUMN match_reason TEXT NOT NULL DEFAULT 'LEGACY_UNCLASSIFIED'
  CHECK (
    match_reason IN (
      'MATCHED_ADS',
      'NO_TOKEN',
      'MULTIPLE_TOKENS',
      'UNKNOWN_TOKEN',
      'WRONG_CHANNEL',
      'DESTINATION_MISMATCH',
      'SNAPSHOT_OR_SESSION_MISSING',
      'ATTRIBUTION_EXPIRED',
      'AD_IDENTIFIER_MISSING',
      'IGNORED_NON_TEXT',
      'LEGACY_MATCHED_UNATTRIBUTED',
      'LEGACY_UNCLASSIFIED'
    )
  );

UPDATE line_events
SET match_reason = CASE
  WHEN match_status = 'MATCHED_ADS' THEN 'MATCHED_ADS'
  WHEN match_status = 'UNMATCHED' AND token_extraction_count = 0 THEN 'NO_TOKEN'
  WHEN match_status = 'UNMATCHED' AND token_extraction_count = 1 THEN 'UNKNOWN_TOKEN'
  WHEN match_status = 'AMBIGUOUS' THEN 'MULTIPLE_TOKENS'
  WHEN match_status = 'WRONG_CHANNEL' THEN 'WRONG_CHANNEL'
  WHEN match_status = 'IGNORED_NON_TEXT' THEN 'IGNORED_NON_TEXT'
  WHEN match_status = 'MATCHED_UNATTRIBUTED' THEN 'LEGACY_MATCHED_UNATTRIBUTED'
  ELSE 'LEGACY_UNCLASSIFIED'
END;

CREATE INDEX IF NOT EXISTS idx_line_events_match_reason
  ON line_events (match_reason, received_at);
