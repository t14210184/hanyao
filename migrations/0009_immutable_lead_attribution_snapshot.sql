-- Freeze the selected Google Ads attribution at lead-token issuance.
-- Legacy rows remain NULL and therefore fail closed as unattributed.

ALTER TABLE lead_tokens ADD COLUMN attribution_snapshot_json TEXT;
ALTER TABLE lead_tokens ADD COLUMN attribution_snapshot_hash TEXT;
ALTER TABLE lead_tokens ADD COLUMN lineage_rule_version TEXT;

CREATE INDEX IF NOT EXISTS idx_lead_tokens_lineage_rule
  ON lead_tokens (lineage_rule_version, server_created_at);
