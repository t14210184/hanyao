import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const wranglerBin = join(cwd, "node_modules", "wrangler", "bin", "wrangler.js");
if (!existsSync(wranglerBin)) throw new Error("WRANGLER_LOCAL_BINARY_NOT_FOUND");
const sourceMigrations = join(cwd, "migrations");
const migrationFiles = [
  "0001_attribution_v1.sql",
  "0002_attribution_retention_integrity.sql",
  "0003_line_webhook_foundation.sql",
  "0004_google_uploader_state.sql",
  "0005_business_conversion_identity_contract.sql",
  "0006_p1c2_i2_canonical_integrity.sql",
  "0007_canonical_outbox_delivery.sql",
  "0008_attribution_abuse_rate_state.sql",
];

function run(args, root = cwd) {
  const r = spawnSync(process.execPath, [wranglerBin, ...args], { cwd: root, encoding: "utf8", env: { ...process.env, NO_D1_WARNING: "true" } });
  if (r.status !== 0) throw new Error(`${args.join(" ")}\n${r.stdout}\n${r.stderr}`);
  return r.stdout;
}
function makeRoot(count) {
  const root = mkdtempSync(join(tmpdir(), "hanyao-v12-migration-"));
  const migrationDir = join(root, "migrations");
  mkdirSync(migrationDir, { recursive: true });
  for (let i = 0; i < count; i += 1) {
    copyFileSync(join(sourceMigrations, migrationFiles[i]), join(migrationDir, migrationFiles[i]));
  }
  const config = join(root, "wrangler.jsonc");
  writeFileSync(config, JSON.stringify({
    name: `hanyao-v12-local-${process.pid}-${Date.now()}`,
    compatibility_date: "2026-09-12",
    d1_databases: [{
      binding: "ATTRIBUTION_DB",
      database_name: "hanyao-v12-local",
      database_id: "00000000-0000-0000-0000-000000000012",
      preview_database_id: "hanyao-v12-local",
      migrations_dir: "./migrations",
    }],
  }, null, 2));
  return { root, migrationDir, config, persistTo: join(root, ".state") };
}

function apply(f) {
  return run(["d1", "migrations", "apply", "ATTRIBUTION_DB", "--local", "--persist-to", f.persistTo, "--config", f.config], f.root);
}
function exec(f, sql) {
  return JSON.parse(run(["d1", "execute", "ATTRIBUTION_DB", "--local", "--persist-to", f.persistTo, "--config", f.config, "--json", "--command", sql], f.root));
}

const expectedTables = [
  "attribution_abuse_rate_state",
  "attribution_sessions",
  "business_conversion_dedupe_locks",
  "business_conversions",
  "canonical_outbox_delivery_config",
  "conversion_outbox",
  "lead_tokens",
  "legacy_conversion_bridge",
  "line_event_integrity_incidents",
  "line_events",
  "provider_attempt_events",
  "provider_attempts",
  "provider_delivery_leases",
  "token_claim_conflicts",
  "token_claims",
];
const expectedIndexes = [
  "idx_business_conversion_dedupe_locks_due",
  "idx_business_conversions_eligibility",
  "idx_business_conversions_projector",
  "idx_business_conversions_session_lineage",
  "idx_business_conversions_subject_window",
  "idx_conversion_outbox_business_conversion",
  "idx_conversion_outbox_processing_lease",
];
const fresh = makeRoot(8);
apply(fresh);
const catalog = exec(fresh, "SELECT type,name FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' ORDER BY type,name; PRAGMA foreign_key_check;");
const tableNames = catalog[0].results.filter((r) => r.type === "table").map((r) => r.name);
const indexNames = catalog[0].results.filter((r) => r.type === "index").map((r) => r.name);
for (const name of expectedTables) assert.ok(tableNames.includes(name), `missing table ${name}`);
for (const name of expectedIndexes) assert.ok(indexNames.includes(name), `missing index ${name}`);
assert.deepEqual(catalog[1].results, []);

const outbox = exec(fresh, "PRAGMA table_info(conversion_outbox);")[0].results.map((r) => r.name);
for (const name of [
  "business_conversion_id", "snapshot_version", "eligibility_rule_version",
  "google_ads_account_id", "google_ads_conversion_action_id", "event_source",
  "lease_generation", "lease_owner", "lease_expires_at",
]) assert.ok(outbox.includes(name), `missing outbox column ${name}`);

const config = exec(fresh, "SELECT config_id,projector_cutover_at,eligibility_rule_version FROM canonical_outbox_delivery_config;");
assert.deepEqual(config[0].results, [{
  config_id: 1,
  projector_cutover_at: "2026-09-08T03:46:03.178Z",
  eligibility_rule_version: "v1",
}]);
const upgrade = makeRoot(6);
apply(upgrade);
const t = "2026-09-07T00:00:00.000Z";
exec(upgrade, `
INSERT INTO attribution_sessions (session_id,schema_version,server_created_at,server_updated_at,expires_at)
VALUES ('s1',1,'${t}','${t}','2026-12-01T00:00:00.000Z');
INSERT INTO lead_tokens (lead_token,request_id,session_id,channel,status,server_created_at)
VALUES ('HY-TEST01','r1','s1','line','issued','${t}');
INSERT INTO line_events (line_event_id,webhook_event_id,message_id,lead_token,event_type,match_status,line_event_timestamp,received_at,created_at,line_event_type,source_type,message_type,token_extraction_count,identity_state)
VALUES ('le1','we1','m1','HY-TEST01','message','MATCHED_ADS','${t}','${t}','${t}','message','user','text',1,'KNOWN');
INSERT INTO business_conversions (business_conversion_id,transaction_id,conversion_type,subject_kind,subject_key,attribution_session_id,first_lead_token,first_line_event_id,first_webhook_event_id,conversion_time,dedupe_until,attribution_touch,gclid,lineage_observed_at,destination_key,conversion_action_id,eligibility_state,outcome_state,created_at,updated_at)
VALUES ('bc1','tx1','verified_line_contact','LINE_USER_HMAC','subject1','s1','HY-TEST01','le1','we1','${t}','2026-10-07T00:00:00.000Z','last','gclid-test','${t}','HY_VERIFIED_LINE_CONTACT','7674301565','PENDING','PENDING','${t}','${t}');
INSERT INTO business_conversion_dedupe_locks (subject_kind,subject_key,conversion_type,active_business_conversion_id,dedupe_until,last_lineage_observed_at,updated_at)
VALUES ('LINE_USER_HMAC','subject1','verified_line_contact','bc1','2026-10-07T00:00:00.000Z','${t}','${t}');
INSERT INTO token_claims (lead_token,claimant_kind,claimant_key,business_conversion_id,first_line_event_id,claimed_at,created_at)
VALUES ('HY-TEST01','LINE_USER_HMAC','subject1','bc1','le1','${t}','${t}');
`);
exec(upgrade, `
INSERT INTO conversion_outbox (
  conversion_id,lead_token,conversion_type,event_timestamp,gclid,attribution_touch,
  transaction_id,destination_key,status,retry_count,created_at,updated_at
) VALUES (
  'co1','HY-TEST01','verified_line_contact','${t}','gclid-test','last',
  'legacy-tx1','HY_VERIFIED_LINE_CONTACT','pending',0,'${t}','${t}'
);
`);
for (let i = 6; i < 8; i += 1) {
  copyFileSync(join(sourceMigrations, migrationFiles[i]), join(upgrade.migrationDir, migrationFiles[i]));
}
apply(upgrade);

const upgraded = exec(upgrade, `
SELECT eligibility_state,eligibility_reason,outcome_state,version FROM business_conversions WHERE business_conversion_id='bc1';
SELECT status,next_retry_at,last_error_code,terminal_result,last_error_reason,business_conversion_id FROM conversion_outbox WHERE conversion_id='co1';
SELECT COUNT(*) AS n FROM business_conversion_dedupe_locks WHERE active_business_conversion_id='bc1';
SELECT COUNT(*) AS n FROM token_claims WHERE business_conversion_id='bc1';
PRAGMA foreign_key_check;
`);
assert.deepEqual(upgraded[0].results, [{
  eligibility_state: "REVIEW",
  eligibility_reason: "LEGACY_PREEXISTING_PROVENANCE",
  outcome_state: "PENDING",
  version: 2,
}]);
assert.deepEqual(upgraded[1].results, [{
  status: "failed",
  next_retry_at: null,
  last_error_code: "LEGACY_PREEXISTING_PROVENANCE",
  terminal_result: "LEGACY_PREEXISTING_PROVENANCE",
  last_error_reason: "LEGACY_PREEXISTING_PROVENANCE",
  business_conversion_id: null,
}]);
assert.equal(upgraded[2].results[0].n, 1);
assert.equal(upgraded[3].results[0].n, 1);
assert.deepEqual(upgraded[4].results, []);

console.log(JSON.stringify({
  result: "V12_MIGRATION_RECONSTRUCTION_PASS",
  freshReplay: "0001->0008",
  legacyFailClosed: true,
  productionMutation: false,
}));
