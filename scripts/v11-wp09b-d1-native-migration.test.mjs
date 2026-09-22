import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "migrations");
const wranglerBin = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const wranglerPackage = JSON.parse(readFileSync(
  path.join(root, "node_modules", "wrangler", "package.json"),
  "utf8"
));

assert.equal(wranglerPackage.version, "4.125.0", "WP09B requires the pinned Wrangler version");
assert.ok(existsSync(wranglerBin), "WRANGLER_LOCAL_BINARY_NOT_FOUND");

// Keep the test dependency-free and compatible with the repository's Node 22 test command.
const allMigrationFiles = readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();
assert.equal(allMigrationFiles.at(-1), "0017_v11_multi_stage_conversion_types.sql");

function makeSandbox(label) {
  const sandboxRoot = mkdtempSync(path.join(tmpdir(), `hanyao-wp09b-${label}-`));
  const sandboxMigrations = path.join(sandboxRoot, "migrations");
  mkdirSync(sandboxMigrations, { recursive: true });
  const config = path.join(sandboxRoot, "wrangler.jsonc");
  const persistTo = path.join(sandboxRoot, ".wrangler-state");
  const databaseName = `hanyao-wp09b-${label}-${process.pid}`;
  writeFileSync(config, JSON.stringify({
    name: databaseName,
    compatibility_date: "2026-09-12",
    d1_databases: [{
      binding: "ATTRIBUTION_DB",
      database_name: databaseName,
      database_id: "00000000-0000-4000-8000-000000000009",
      preview_database_id: databaseName,
      migrations_dir: "./migrations",
    }],
  }, null, 2));
  return { root: sandboxRoot, migrations: sandboxMigrations, config, persistTo };
}

function copyMigrations(sandbox, names) {
  for (const name of names) {
    copyFileSync(path.join(migrationsDir, name), path.join(sandbox.migrations, name));
  }
}

function runWrangler(sandbox, args, allowFailure = false) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: sandbox.root,
    encoding: "utf8",
    env: {
      ...process.env,
      NO_D1_WARNING: "true",
      WRANGLER_SEND_METRICS: "false",
    },
  });
  if (!allowFailure && result.status !== 0) {
    throw new Error([
      `WRANGLER_FAILED: ${args.join(" ")}`,
      result.stdout,
      result.stderr,
    ].join("\n"));
  }
  return result;
}

function applyMigrations(sandbox, allowFailure = false) {
  const args = [
    "d1", "migrations", "apply", "ATTRIBUTION_DB", "--local",
    "--persist-to", sandbox.persistTo,
    "--config", sandbox.config,
  ];
  assert.ok(args.includes("--local"), "WP09B must never use a remote migration path");
  assert.ok(!args.includes("--remote"), "WP09B must never use a remote migration path");
  return runWrangler(sandbox, args, allowFailure);
}

function execute(sandbox, sql) {
  const result = runWrangler(sandbox, [
    "d1", "execute", "ATTRIBUTION_DB", "--local",
    "--persist-to", sandbox.persistTo,
    "--config", sandbox.config,
    "--json", "--command", sql,
  ]);
  return JSON.parse(result.stdout.trim());
}

function resultRows(sandbox, sql) {
  const payload = execute(sandbox, sql);
  const sections = Array.isArray(payload) ? payload : [payload];
  return sections.flatMap((section) => section?.results ?? []);
}

function firstRow(sandbox, sql) {
  return resultRows(sandbox, sql)[0] ?? null;
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

const FIXTURE_SQL = `
INSERT INTO attribution_sessions (
  session_id, schema_version, first_captured_at, first_landing_path,
  first_referrer_origin, first_gclid, last_captured_at, last_landing_path,
  last_referrer_origin, last_gclid, server_created_at, server_updated_at, expires_at
) VALUES (
  'session-wp09b', 1, '2026-09-01T00:00:00.000Z', '/services/ac-repair',
  'https://www.google.com', 'gclid-wp09b', '2026-09-01T00:00:00.000Z',
  '/services/ac-repair', 'https://www.google.com', 'gclid-wp09b',
  '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z'
);

INSERT INTO lead_tokens (
  lead_token, request_id, session_id, channel, status, server_created_at,
  attribution_snapshot_json, attribution_snapshot_hash, lineage_rule_version
) VALUES (
  'HY-WP09B', 'request-wp09b', 'session-wp09b', 'line', 'issued',
  '2026-09-01T00:00:00.000Z', '{"source":"fixture"}', 'fixture-snapshot-hash', 'v1'
);

INSERT INTO line_events (
  line_event_id, webhook_event_id, message_id, lead_token, event_type,
  match_status, line_event_timestamp, received_at, created_at, line_user_key,
  line_event_type, source_type, message_type, token_extraction_count,
  identity_state, identity_key_id, line_destination, business_subject_kind,
  business_subject_key, attribution_session_id, attribution_touch, gclid,
  lineage_snapshot_json, lineage_frozen_at, canonical_fingerprint
) VALUES (
  'line-event-wp09b', 'webhook-wp09b', 'message-wp09b', 'HY-WP09B', 'message',
  'MATCHED_ADS', '2026-09-01T00:01:00.000Z', '2026-09-01T00:01:01.000Z',
  '2026-09-01T00:01:01.000Z', 'line-user-wp09b', 'message', 'user', 'text', 1,
  'KNOWN', 'identity-key-wp09b', 'LINE_DESTINATION', 'LINE_USER_HMAC',
  'subject-wp09b', 'session-wp09b', 'last', 'gclid-wp09b', '{"source":"fixture"}',
  '2026-09-01T00:01:01.000Z', 'fingerprint-wp09b'
);

INSERT INTO lead_signal_observations (
  observation_id, line_event_id, line_user_key, lead_token, observed_at,
  rule_version, match_status, attribution_lane, created_at
) VALUES (
  'observation-wp09b', 'line-event-wp09b', 'line-user-wp09b', 'HY-WP09B',
  '2026-09-01T00:01:02.000Z', 'rule-v1', 'MATCHED_ADS', 'EXACT_CLICK',
  '2026-09-01T00:01:02.000Z'
);

INSERT INTO lead_user_identifiers (
  identifier_id, line_user_key, identifier_type, identifier_hash,
  source_line_event_id, first_seen_at, created_at
) VALUES (
  'identifier-wp09b', 'line-user-wp09b', 'EMAIL_SHA256',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'line-event-wp09b', '2026-09-01T00:01:03.000Z', '2026-09-01T00:01:03.000Z'
);

INSERT INTO line_event_integrity_incidents (
  incident_id, webhook_event_id, line_event_id, reason_code,
  stored_identity_state, observed_identity_state, stored_fingerprint,
  observed_fingerprint, observed_at, created_at
) VALUES (
  'incident-wp09b', 'webhook-wp09b', 'line-event-wp09b', 'FIXTURE_REVIEW',
  'KNOWN', 'KNOWN', 'fingerprint-wp09b', 'fingerprint-wp09b',
  '2026-09-01T00:01:04.000Z', '2026-09-01T00:01:04.000Z'
);

INSERT INTO business_conversions (
  business_conversion_id, transaction_id, conversion_type, subject_kind,
  subject_key, attribution_session_id, first_lead_token, first_line_event_id,
  first_webhook_event_id, conversion_time, dedupe_until, attribution_touch,
  gclid, lineage_observed_at, destination_key, conversion_action_id,
  eligibility_state, outcome_state, created_at, updated_at
) VALUES (
  'business-wp09b', 'transaction-wp09b', 'verified_line_contact',
  'LINE_USER_HMAC', 'subject-wp09b', 'session-wp09b', 'HY-WP09B',
  'line-event-wp09b', 'webhook-wp09b', '2026-09-01T00:02:00.000Z',
  '2026-10-01T00:02:00.000Z', 'last', 'gclid-wp09b', '2026-09-01T00:02:00.000Z',
  'HY_VERIFIED_LINE_CONTACT', 'action-verified-wp09b', 'PENDING', 'PENDING',
  '2026-09-01T00:02:00.000Z', '2026-09-01T00:02:00.000Z'
);

INSERT INTO business_conversion_dedupe_locks (
  subject_kind, subject_key, conversion_type, active_business_conversion_id,
  dedupe_until, last_lineage_observed_at, fence_version, updated_at
) VALUES (
  'LINE_USER_HMAC', 'subject-wp09b', 'verified_line_contact', 'business-wp09b',
  '2026-10-01T00:02:00.000Z', '2026-09-01T00:02:00.000Z', 1,
  '2026-09-01T00:02:00.000Z'
);

INSERT INTO token_claims (
  lead_token, claimant_kind, claimant_key, business_conversion_id,
  first_line_event_id, claimed_at, created_at
) VALUES (
  'HY-WP09B', 'LINE_USER_HMAC', 'subject-wp09b', 'business-wp09b',
  'line-event-wp09b', '2026-09-01T00:02:01.000Z', '2026-09-01T00:02:01.000Z'
);

INSERT INTO token_claim_conflicts (
  conflict_id, lead_token, first_claimant_key, observed_claimant_key,
  observed_line_event_id, observed_at, reason_code, created_at
) VALUES (
  'conflict-wp09b', 'HY-WP09B', 'subject-wp09b', 'subject-review-wp09b',
  'line-event-wp09b', '2026-09-01T00:02:02.000Z', 'FIXTURE_REVIEW',
  '2026-09-01T00:02:02.000Z'
);

INSERT INTO conversion_outbox (
  conversion_id, lead_token, conversion_type, event_timestamp, gclid,
  attribution_touch, transaction_id, destination_key, status, retry_count,
  created_at, updated_at, business_conversion_id, google_ads_account_id,
  google_ads_conversion_action_id, event_source
) VALUES (
  'outbox-wp09b', 'HY-WP09B', 'verified_line_contact', '2026-09-01T00:02:00.000Z',
  'gclid-wp09b', 'last', 'transaction-wp09b', 'HY_VERIFIED_LINE_CONTACT',
  'pending', 0, '2026-09-01T00:02:03.000Z', '2026-09-01T00:02:03.000Z',
  'business-wp09b', 'ads-account-fixture', 'action-verified-wp09b', 'MESSAGE'
);

INSERT INTO legacy_conversion_bridge (
  legacy_conversion_id, business_conversion_id, mapping_state, reason_code,
  legacy_transaction_id, source_event_timestamp, source_attribution_session_id,
  mapped_at, created_at
) VALUES (
  'outbox-wp09b', 'business-wp09b', 'SAFE_MAPPED', 'FIXTURE_REVIEW',
  'legacy-transaction-wp09b', '2026-09-01T00:02:00.000Z', 'session-wp09b',
  '2026-09-01T00:02:04.000Z', '2026-09-01T00:02:04.000Z'
);

INSERT INTO provider_attempts (
  attempt_id, business_conversion_id, attempt_sequence, transaction_id,
  provider_name, operation, attempt_intent, fence_token, lease_expires_at,
  started_at, created_at, destination_key, payload_hash
) VALUES (
  'attempt-wp09b', 'business-wp09b', 1, 'transaction-wp09b', 'google_ads',
  'UPLOAD', 'INITIAL', 1, '2026-09-01T00:12:00.000Z',
  '2026-09-01T00:02:05.000Z', '2026-09-01T00:02:05.000Z',
  'HY_VERIFIED_LINE_CONTACT', 'payload-hash-wp09b'
);

INSERT INTO provider_attempt_events (
  attempt_event_id, attempt_id, event_sequence, event_type, recorded_at,
  provider_request_id, normalized_status, retryable, ambiguous, sanitized_reason
) VALUES (
  'attempt-event-wp09b', 'attempt-wp09b', 1, 'ACKNOWLEDGED',
  '2026-09-01T00:02:06.000Z', 'provider-request-wp09b', 'ACKNOWLEDGED', 0, 0,
  'fixture'
);

INSERT INTO provider_delivery_leases (
  business_conversion_id, lease_state, lease_owner, active_attempt_id,
  fence_token, lease_expires_at, updated_at
) VALUES (
  'business-wp09b', 'CLAIMED', 'fixture-owner', 'attempt-wp09b', 1,
  '2026-09-01T00:12:00.000Z', '2026-09-01T00:02:07.000Z'
);

INSERT INTO conversion_user_data_snapshots (
  business_conversion_id, line_user_key, snapshot_version, snapshotted_at,
  sealed_at, created_at, consent_state, consent_source, consent_observed_at,
  consent_policy_version
) VALUES (
  'business-wp09b', 'line-user-wp09b', 1, '2026-09-01T00:02:08.000Z',
  '2026-09-01T00:02:09.000Z', '2026-09-01T00:02:08.000Z', 'GRANTED',
  'fixture', '2026-09-01T00:02:08.000Z', 'v1'
);

INSERT INTO conversion_user_data_snapshot_items (
  business_conversion_id, identifier_type, identifier_hash, source_line_event_id,
  first_seen_at, created_at
) VALUES (
  'business-wp09b', 'EMAIL_SHA256',
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'line-event-wp09b', '2026-09-01T00:02:08.000Z', '2026-09-01T00:02:08.000Z'
);
`;

function seedFixture(sandbox) {
  execute(sandbox, FIXTURE_SQL);
  assert.equal(firstRow(sandbox, "PRAGMA foreign_keys;")?.foreign_keys, 1);
  assert.deepEqual(resultRows(sandbox, "PRAGMA foreign_key_check;"), []);
}

function catalog(sandbox) {
  return resultRows(sandbox, `
    SELECT type, name, tbl_name, sql
    FROM sqlite_schema
    WHERE type IN ('table', 'index', 'trigger')
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_cf_%'
    ORDER BY type, name;
  `);
}

function dependencyInventory(sandbox) {
  const entries = catalog(sandbox);
  const tables = entries.filter((entry) => entry.type === "table").map((entry) => entry.name);
  const foreignKeys = [];
  for (const table of tables) {
    for (const row of resultRows(sandbox, `PRAGMA foreign_key_list(${quoteIdentifier(table)});`)) {
      foreignKeys.push({
        PARENT_TABLE: row.table,
        CHILD_TABLE: table,
        FK_COLUMN: row.from,
        PARENT_COLUMN: row.to,
        ON_DELETE: row.on_delete,
        ON_UPDATE: row.on_update,
        EXISTING_PRODUCTION_ROW_RISK:
          row.on_delete === "RESTRICT" || row.on_delete === "NO ACTION"
            ? "HIGH_IF_PARENT_REBUILT"
            : "DEPENDENT_ROWS_MUST_SURVIVE",
      });
    }
  }
  return {
    foreignKeys,
    indexes: entries.filter((entry) => entry.type === "index"),
    triggers: entries.filter((entry) => entry.type === "trigger"),
  };
}

function applicationTableCounts(sandbox) {
  const tables = catalog(sandbox)
    .filter((entry) => entry.type === "table")
    .filter((entry) => entry.name !== "d1_migrations")
    .map((entry) => entry.name);
  return Object.fromEntries(tables.map((table) => [
    table,
    firstRow(sandbox, `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)};`)?.count,
  ]));
}

function migrationNames(sandbox) {
  return resultRows(sandbox, "SELECT name FROM d1_migrations ORDER BY id;").map((row) => row.name);
}

function captureCanonicalState(sandbox) {
  return {
    business: firstRow(sandbox, `
      SELECT business_conversion_id, transaction_id, conversion_type,
        destination_key, first_line_event_id, attribution_session_id,
        first_lead_token, version
      FROM business_conversions
      WHERE business_conversion_id = 'business-wp09b';
    `),
    outbox: firstRow(sandbox, `
      SELECT conversion_id, transaction_id, conversion_type, destination_key,
        status, business_conversion_id
      FROM conversion_outbox
      WHERE conversion_id = 'outbox-wp09b';
    `),
    attempt: firstRow(sandbox, `
      SELECT attempt_id, business_conversion_id, transaction_id, destination_key,
        payload_hash
      FROM provider_attempts
      WHERE attempt_id = 'attempt-wp09b';
    `),
    attemptEvent: firstRow(sandbox, `
      SELECT attempt_event_id, attempt_id, event_sequence, provider_request_id,
        normalized_status
      FROM provider_attempt_events
      WHERE attempt_event_id = 'attempt-event-wp09b';
    `),
    lease: firstRow(sandbox, `
      SELECT business_conversion_id, lease_state, active_attempt_id, fence_token,
        lease_expires_at
      FROM provider_delivery_leases
      WHERE business_conversion_id = 'business-wp09b';
    `),
    bridge: firstRow(sandbox, `
      SELECT legacy_conversion_id, business_conversion_id, legacy_transaction_id,
        source_attribution_session_id, mapping_state
      FROM legacy_conversion_bridge
      WHERE legacy_conversion_id = 'outbox-wp09b';
    `),
    snapshot: firstRow(sandbox, `
      SELECT business_conversion_id, line_user_key, snapshot_version, snapshotted_at,
        sealed_at, consent_state, consent_source, consent_policy_version
      FROM conversion_user_data_snapshots
      WHERE business_conversion_id = 'business-wp09b';
    `),
    snapshotItem: firstRow(sandbox, `
      SELECT business_conversion_id, identifier_type, identifier_hash,
        source_line_event_id, first_seen_at
      FROM conversion_user_data_snapshot_items
      WHERE business_conversion_id = 'business-wp09b';
    `),
    childCounts: firstRow(sandbox, `
      SELECT
        (SELECT COUNT(*) FROM business_conversion_dedupe_locks WHERE active_business_conversion_id='business-wp09b') AS dedupe_locks,
        (SELECT COUNT(*) FROM token_claims WHERE business_conversion_id='business-wp09b') AS token_claims,
        (SELECT COUNT(*) FROM token_claim_conflicts WHERE lead_token='HY-WP09B') AS token_claim_conflicts,
        (SELECT COUNT(*) FROM legacy_conversion_bridge WHERE business_conversion_id='business-wp09b') AS legacy_bridges,
        (SELECT COUNT(*) FROM provider_attempts WHERE business_conversion_id='business-wp09b') AS provider_attempts,
        (SELECT COUNT(*) FROM provider_attempt_events WHERE attempt_id='attempt-wp09b') AS provider_attempt_events,
        (SELECT COUNT(*) FROM provider_delivery_leases WHERE business_conversion_id='business-wp09b') AS provider_delivery_leases,
        (SELECT COUNT(*) FROM conversion_user_data_snapshots WHERE business_conversion_id='business-wp09b') AS snapshots,
        (SELECT COUNT(*) FROM conversion_user_data_snapshot_items WHERE business_conversion_id='business-wp09b') AS snapshot_items;
    `),
  };
}

function tableColumns(sandbox, table) {
  return resultRows(sandbox, `PRAGMA table_info(${quoteIdentifier(table)});`).map((row) => row.name);
}

function assertRequiredInventory(inventory) {
  const required = [
    ["business_conversions", "business_conversion_dedupe_locks", "active_business_conversion_id"],
    ["lead_tokens", "business_conversions", "first_lead_token"],
    ["line_events", "business_conversions", "first_line_event_id"],
    ["conversion_outbox", "legacy_conversion_bridge", "legacy_conversion_id"],
    ["business_conversions", "legacy_conversion_bridge", "business_conversion_id"],
    ["business_conversions", "provider_attempts", "business_conversion_id"],
    ["provider_attempts", "provider_delivery_leases", "active_attempt_id"],
    ["business_conversions", "provider_delivery_leases", "business_conversion_id"],
    ["business_conversions", "conversion_user_data_snapshots", "business_conversion_id"],
    ["conversion_user_data_snapshots", "conversion_user_data_snapshot_items", "business_conversion_id"],
    ["line_events", "conversion_user_data_snapshot_items", "source_line_event_id"],
    ["lead_tokens", "token_claims", "lead_token"],
    ["business_conversions", "token_claims", "business_conversion_id"],
  ];
  for (const [parent, child, column] of required) {
    assert.ok(
      inventory.some((row) => row.PARENT_TABLE === parent && row.CHILD_TABLE === child && row.FK_COLUMN === column),
      `missing FK inventory ${parent}->${child}.${column}`
    );
  }
}

function insertNewStageRows(sandbox) {
  execute(sandbox, `
    INSERT INTO lead_stage_events (
      stage_event_id, source_verified_business_conversion_id, line_user_key,
      stage_type, stage_source, stage_rule_version, evidence_digest,
      idempotency_key, occurred_at, event_source, created_at
    ) VALUES
      ('stage-qualified-wp09b', 'business-wp09b', 'line-user-wp09b',
       'QUALIFIED_CONFIRMED', 'HUMAN_CONFIRMED', 'rule-v1', 'digest-qualified',
       'idempotency-qualified-wp09b', '2026-09-02T00:00:00.000Z', 'MESSAGE',
       '2026-09-02T00:00:00.000Z'),
      ('stage-won-wp09b', 'business-wp09b', 'line-user-wp09b',
       'WON_JOB', 'PAYMENT_CONFIRMED', 'rule-v1', 'digest-won',
       'idempotency-won-wp09b', '2026-09-03T00:00:00.000Z', 'MESSAGE',
       '2026-09-03T00:00:00.000Z');

    INSERT INTO business_conversions (
      business_conversion_id, transaction_id, conversion_type, subject_kind,
      subject_key, attribution_session_id, first_lead_token, first_line_event_id,
      conversion_time, dedupe_until, attribution_touch, gclid,
      lineage_observed_at, destination_key, conversion_action_id,
      eligibility_state, outcome_state, created_at, updated_at, stage_event_id,
      conversion_value_micros, currency_code
    ) VALUES
      ('business-qualified-wp09b', 'transaction-qualified-wp09b', 'qualified_line_lead',
       'LINE_USER_HMAC', 'subject-wp09b', 'session-wp09b', 'HY-WP09B',
       'line-event-wp09b', '2026-09-02T00:00:00.000Z', '2026-10-02T00:00:00.000Z',
       'last', 'gclid-wp09b', '2026-09-02T00:00:00.000Z', 'HY_QUALIFIED_LINE_LEAD',
       'action-qualified-wp09b', 'PENDING', 'PENDING', '2026-09-02T00:00:00.000Z',
       '2026-09-02T00:00:00.000Z', 'stage-qualified-wp09b', NULL, NULL),
      ('business-won-wp09b', 'transaction-won-wp09b', 'won_job',
       'LINE_USER_HMAC', 'subject-wp09b', 'session-wp09b', 'HY-WP09B',
       'line-event-wp09b', '2026-09-03T00:00:00.000Z', '2027-09-03T00:00:00.000Z',
       'last', 'gclid-wp09b', '2026-09-03T00:00:00.000Z', 'HY_WON_JOB',
       'action-won-wp09b', 'PENDING', 'PENDING', '2026-09-03T00:00:00.000Z',
       '2026-09-03T00:00:00.000Z', 'stage-won-wp09b', 125000, 'TWD');

    INSERT INTO business_conversion_dedupe_locks (
      subject_kind, subject_key, conversion_type, active_business_conversion_id,
      dedupe_until, last_lineage_observed_at, fence_version, updated_at
    ) VALUES
      ('LINE_USER_HMAC', 'subject-wp09b', 'qualified_line_lead',
       'business-qualified-wp09b', '2026-10-02T00:00:00.000Z',
       '2026-09-02T00:00:00.000Z', 0, '2026-09-02T00:00:00.000Z'),
      ('LINE_USER_HMAC', 'subject-wp09b', 'won_job', 'business-won-wp09b',
       '2027-09-03T00:00:00.000Z', '2026-09-03T00:00:00.000Z', 0,
       '2026-09-03T00:00:00.000Z');

    INSERT INTO conversion_outbox (
      conversion_id, lead_token, conversion_type, event_timestamp, gclid,
      attribution_touch, transaction_id, destination_key, status, retry_count,
      created_at, updated_at, business_conversion_id, stage_event_id,
      conversion_value_micros, currency_code
    ) VALUES
      ('outbox-qualified-wp09b', 'HY-WP09B', 'qualified_line_lead',
       '2026-09-02T00:00:00.000Z', 'gclid-wp09b', 'last',
       'transaction-qualified-wp09b', 'HY_QUALIFIED_LINE_LEAD', 'pending', 0,
       '2026-09-02T00:00:00.000Z', '2026-09-02T00:00:00.000Z',
       'business-qualified-wp09b', 'stage-qualified-wp09b', NULL, NULL),
      ('outbox-won-wp09b', 'HY-WP09B', 'won_job', '2026-09-03T00:00:00.000Z',
       'gclid-wp09b', 'last', 'transaction-won-wp09b', 'HY_WON_JOB', 'pending', 0,
       '2026-09-03T00:00:00.000Z', '2026-09-03T00:00:00.000Z',
       'business-won-wp09b', 'stage-won-wp09b', 125000, 'TWD');
  `);
}

function runPositive() {
  const sandbox = makeSandbox("positive");
  try {
    copyMigrations(sandbox, allMigrationFiles.slice(0, 15));
    applyMigrations(sandbox);
    seedFixture(sandbox);
    const inventory = dependencyInventory(sandbox);
    assertRequiredInventory(inventory.foreignKeys);
    assert.ok(inventory.foreignKeys.length >= 26, "FK inventory unexpectedly shrank");
    const preCatalog = catalog(sandbox);
    const preIndexNames = preCatalog.filter((entry) => entry.type === "index").map((entry) => entry.name);
    const preTableCounts = applicationTableCounts(sandbox);
    const preState = captureCanonicalState(sandbox);
    const preForeignKeys = firstRow(sandbox, "PRAGMA foreign_keys;")?.foreign_keys;
    assert.equal(preForeignKeys, 1);

    copyMigrations(sandbox, allMigrationFiles.slice(15));
    applyMigrations(sandbox);

    assert.equal(firstRow(sandbox, "PRAGMA foreign_keys;")?.foreign_keys, 1);
    assert.deepEqual(resultRows(sandbox, "PRAGMA foreign_key_check;"), []);
    const postState = captureCanonicalState(sandbox);
    const postTableCounts = applicationTableCounts(sandbox);
    for (const [table, count] of Object.entries(preTableCounts)) {
      assert.equal(postTableCounts[table], count, `row count changed for ${table}`);
    }
    assert.deepEqual(postState.business, preState.business);
    assert.deepEqual(postState.outbox, preState.outbox);
    assert.deepEqual(postState.attempt, preState.attempt);
    assert.deepEqual(postState.attemptEvent, preState.attemptEvent);
    assert.deepEqual(postState.lease, preState.lease);
    assert.deepEqual(postState.bridge, preState.bridge);
    assert.deepEqual(postState.snapshot, preState.snapshot);
    assert.deepEqual(postState.snapshotItem, preState.snapshotItem);
    assert.deepEqual(postState.childCounts, preState.childCounts);

    const postCatalog = catalog(sandbox);
    const postIndexNames = new Set(postCatalog.filter((entry) => entry.type === "index").map((entry) => entry.name));
    for (const name of preIndexNames) assert.ok(postIndexNames.has(name), `legacy index missing: ${name}`);
    for (const name of [
      "idx_business_conversions_stage_event",
      "idx_business_conversions_stage_type",
      "idx_conversion_outbox_stage_type",
      "idx_lead_stage_events_stage_type",
    ]) assert.ok(postIndexNames.has(name), `stage index missing: ${name}`);
    assert.ok(tableColumns(sandbox, "business_conversions").includes("stage_event_id"));
    assert.ok(tableColumns(sandbox, "conversion_outbox").includes("stage_event_id"));
    assert.ok(resultRows(sandbox, "PRAGMA foreign_key_list(business_conversions);").some((row) => row.table === "lead_stage_events"));

    insertNewStageRows(sandbox);
    assert.deepEqual(resultRows(sandbox, "PRAGMA foreign_key_check;"), []);
    const typeCounts = firstRow(sandbox, `
      SELECT
        (SELECT COUNT(*) FROM business_conversions WHERE conversion_type='verified_line_contact') AS verified,
        (SELECT COUNT(*) FROM business_conversions WHERE conversion_type='qualified_line_lead') AS qualified,
        (SELECT COUNT(*) FROM business_conversions WHERE conversion_type='won_job') AS won,
        (SELECT COUNT(*) FROM conversion_outbox WHERE conversion_type='qualified_line_lead') AS qualified_outbox,
        (SELECT COUNT(*) FROM conversion_outbox WHERE conversion_type='won_job') AS won_outbox;
    `);
    assert.deepEqual(typeCounts, { verified: 1, qualified: 1, won: 1, qualified_outbox: 1, won_outbox: 1 });
    const applied = migrationNames(sandbox);
    assert.ok(applied.some((name) => name.includes("0017_v11_multi_stage_conversion_types")), "0017 not recorded by Wrangler D1 local migrations");

    return {
      inventory,
      migrationReplay: "0001->0017",
      legacyIndexCount: preIndexNames.length,
      preservedTableCount: Object.keys(preTableCounts).length,
      typeCounts,
    };
  } finally {
    rmSync(sandbox.root, { recursive: true, force: true });
  }
}

function runFailureRehearsal() {
  const sandbox = makeSandbox("failure");
  try {
    copyMigrations(sandbox, allMigrationFiles.slice(0, 16));
    applyMigrations(sandbox);
    seedFixture(sandbox);
    const before = captureCanonicalState(sandbox);
    const brokenMigration = `${readFileSync(path.join(migrationsDir, "0017_v11_multi_stage_conversion_types.sql"), "utf8")}\nSELECT * FROM wp09b_intentional_sql_failure;\n`;
    writeFileSync(path.join(sandbox.migrations, "0017_v11_multi_stage_conversion_types.sql"), brokenMigration);
    const failed = applyMigrations(sandbox, true);
    assert.notEqual(failed.status, 0, "intentional SQL failure unexpectedly succeeded");
    const after = captureCanonicalState(sandbox);
    assert.deepEqual(after, before, "failed migration changed populated source state");
    assert.equal(tableColumns(sandbox, "business_conversions").includes("stage_event_id"), false);
    assert.equal(tableColumns(sandbox, "conversion_outbox").includes("stage_event_id"), false);
    assert.ok(!migrationNames(sandbox).some((name) => name.includes("0017_v11_multi_stage_conversion_types")), "failed migration falsely recorded as applied");
    assert.deepEqual(resultRows(sandbox, "PRAGMA foreign_key_check;"), []);
    return { exitCode: failed.status, sourceStateRecoverable: true, noFalseSuccessRecord: true };
  } finally {
    rmSync(sandbox.root, { recursive: true, force: true });
  }
}

function runStaticGuard() {
  const unapplied = allMigrationFiles.filter((name) => Number(name.slice(0, 4)) >= 16);
  for (const name of unapplied) {
    const sql = readFileSync(path.join(migrationsDir, name), "utf8");
    assert.doesNotMatch(sql, /PRAGMA\s+foreign_keys\s*=\s*OFF/i, `${name} disables FK enforcement`);
  }
  assert.match(
    readFileSync(path.join(migrationsDir, "0017_v11_multi_stage_conversion_types.sql"), "utf8"),
    /PRAGMA\s+defer_foreign_keys\s*=\s*ON/i
  );
  return { unappliedMigrationCount: unapplied.length, foreignKeysOffGuard: true };
}

const positive = runPositive();
const failure = runFailureRehearsal();
const staticGuard = runStaticGuard();

console.log(JSON.stringify({
  result: "V11_WP09B_D1_NATIVE_MIGRATION_SAFETY_PASS",
  wrangler: wranglerPackage.version,
  tests: {
    T147: "PASS_D1_LOCAL_0001_TO_0017",
    T148: "PASS_POPULATED_FK_GRAPH",
    T149: "PASS_CANONICAL_IDS_TRANSACTION_DESTINATION_PRESERVED",
    T150: "PASS_PROVIDER_ATTEMPT_LEASE_PRESERVED",
    T151: "PASS_LEGACY_BRIDGE_PRESERVED",
    T152: "PASS_USER_DATA_SNAPSHOT_PRESERVED",
    T153: "PASS_FOREIGN_KEY_CHECK_EMPTY",
    T154: "PASS_FAILED_MIGRATION_ROLLBACK",
    T155: "PASS_NO_UNAPPLIED_FOREIGN_KEYS_OFF",
  },
  positive: {
    migrationReplay: positive.migrationReplay,
    legacyIndexCount: positive.legacyIndexCount,
    typeCounts: positive.typeCounts,
    fkInventory: positive.inventory.foreignKeys,
    triggerCount: positive.inventory.triggers.length,
  },
  failure,
  staticGuard,
}));
