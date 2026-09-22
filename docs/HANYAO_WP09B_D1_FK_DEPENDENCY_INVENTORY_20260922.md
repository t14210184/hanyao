# HANYAO WP09B D1 FK Dependency Inventory

This is a generated evidence snapshot for the schema immediately after
migrations 0001–0015 and before migrations 0016–0017. The inventory is
re-derived from the local D1 `sqlite_schema` and `PRAGMA foreign_key_list`
readbacks by `scripts/v11-wp09b-d1-native-migration.test.mjs`; the committed
table below is not a substitute for that dynamic readback.

## Foreign-key relationships

| PARENT_TABLE | CHILD_TABLE | FK_COLUMN | ON_DELETE | ON_UPDATE | EXISTING_PRODUCTION_ROW_RISK |
|---|---|---|---|---|---|
| business_conversions | business_conversion_dedupe_locks | active_business_conversion_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| line_events | business_conversions | first_line_event_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| lead_tokens | business_conversions | first_lead_token | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| attribution_sessions | business_conversions | attribution_session_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| lead_tokens | conversion_outbox | lead_token | RESTRICT | NO ACTION | HIGH_IF_PARENT_REBUILT |
| line_events | conversion_user_data_snapshot_items | source_line_event_id | RESTRICT | NO ACTION | HIGH_IF_PARENT_REBUILT |
| conversion_user_data_snapshots | conversion_user_data_snapshot_items | business_conversion_id | CASCADE | NO ACTION | DEPENDENT_ROWS_MUST_SURVIVE |
| business_conversions | conversion_user_data_snapshots | business_conversion_id | RESTRICT | NO ACTION | HIGH_IF_PARENT_REBUILT |
| lead_tokens | lead_signal_observations | lead_token | SET NULL | NO ACTION | DEPENDENT_ROWS_MUST_SURVIVE |
| line_events | lead_signal_observations | line_event_id | RESTRICT | NO ACTION | HIGH_IF_PARENT_REBUILT |
| attribution_sessions | lead_tokens | session_id | SET NULL | NO ACTION | DEPENDENT_ROWS_MUST_SURVIVE |
| line_events | lead_user_identifiers | source_line_event_id | RESTRICT | NO ACTION | HIGH_IF_PARENT_REBUILT |
| attribution_sessions | legacy_conversion_bridge | source_attribution_session_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| business_conversions | legacy_conversion_bridge | business_conversion_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| conversion_outbox | legacy_conversion_bridge | legacy_conversion_id | RESTRICT | NO ACTION | HIGH_IF_PARENT_REBUILT |
| line_events | line_event_integrity_incidents | line_event_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| lead_tokens | line_events | lead_token | SET NULL | NO ACTION | DEPENDENT_ROWS_MUST_SURVIVE |
| provider_attempts | provider_attempt_events | attempt_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| business_conversions | provider_attempts | business_conversion_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| provider_attempts | provider_delivery_leases | active_attempt_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| business_conversions | provider_delivery_leases | business_conversion_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| line_events | token_claim_conflicts | observed_line_event_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| lead_tokens | token_claim_conflicts | lead_token | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| line_events | token_claims | first_line_event_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| business_conversions | token_claims | business_conversion_id | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |
| lead_tokens | token_claims | lead_token | NO ACTION | NO ACTION | HIGH_IF_PARENT_REBUILT |

Dynamic baseline count: 26 FK rows, 48 application indexes, and 0 application
triggers. Wrangler internal `_cf_*` metadata tables are excluded from the
application inventory and are never modified by the migration.

## WP09B migration consequence

0017 rebuilds the canonical tables and every dependent table that points at
them. New `_v11` tables are populated first; dependent tables are switched to
the new graph before old parent tables are dropped. This keeps foreign-key
enforcement enabled at every D1 statement boundary and preserves populated
provider, legacy-bridge, dedupe-lock, and enhanced-user-data rows.
