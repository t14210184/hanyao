import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

const read = (path) => readFile(path, "utf8");

test("V11-WP02 auth hardening is bounded and permanent auth errors are non-retryable", async () => {
  const auth = await read("workers/google-ads-uploader/src/auth.ts");
  const errors = await read("workers/google-ads-uploader/src/errors.ts");
  const scheduler = await read("workers/google-ads-uploader/src/scheduler.ts");
  assert.match(auth, /AUTH_HTTP_TIMEOUT_MS/);
  assert.match(auth, /AbortSignal\.timeout\(AUTH_HTTP_TIMEOUT_MS\)/);
  assert.doesNotMatch(errors, /status === 401/);
  assert.match(scheduler, /AUTH_CREDENTIAL_MISSING", false/);
});

test("V11-WP03 runtime hot paths contain no schema DDL", async () => {
  for (const path of [
    "functions/_lib/high-intent-shadow.ts",
    "workers/google-ads-uploader/src/enhanced-user-data.ts",
    "workers/google-ads-uploader/src/message-asset-metrics.ts",
  ]) {
    const source = await read(path);
    assert.doesNotMatch(source, /\bCREATE\s+(TABLE|INDEX)\b/i, path);
    assert.doesNotMatch(source, /\bALTER\s+TABLE\b/i, path);
  }
});

test("V11-WP04/05/06 migration installs planner indexes, metrics v2, and consent/retention fields", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE attribution_sessions (
      session_id TEXT PRIMARY KEY,
      first_gclid TEXT, last_gclid TEXT,
      first_gbraid TEXT, last_gbraid TEXT,
      first_wbraid TEXT, last_wbraid TEXT,
      expires_at TEXT
    );
    CREATE TABLE lead_user_identifiers (
      identifier_id TEXT PRIMARY KEY,
      line_user_key TEXT NOT NULL,
      identifier_type TEXT NOT NULL,
      identifier_hash TEXT NOT NULL,
      source_line_event_id TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE message_asset_metrics_daily (
      metric_date TEXT NOT NULL,
      google_ads_customer_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      impressions INTEGER NOT NULL DEFAULT 0,
      interactions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      conversions REAL NOT NULL DEFAULT 0,
      all_conversions REAL NOT NULL DEFAULT 0,
      cost_micros INTEGER NOT NULL DEFAULT 0,
      provider_observed_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(metric_date, google_ads_customer_id, campaign_id, asset_id)
    );
    CREATE TABLE conversion_user_data_snapshots (
      business_conversion_id TEXT PRIMARY KEY,
      line_user_key TEXT NOT NULL,
      snapshot_version INTEGER NOT NULL,
      snapshotted_at TEXT NOT NULL,
      sealed_at TEXT,
      created_at TEXT NOT NULL
    );
  `);
  db.exec(await read("migrations/0015_v11_observability_hardening.sql"));

  const columns = (table) =>
    new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
  assert.deepEqual(
    ["message_chats", "message_impressions", "message_chat_rate"].every((name) =>
      columns("message_asset_metrics_daily").has(name)
    ),
    true
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name=?").get(
      "message_asset_metrics_collector_state"
    ).c,
    1
  );
  assert.equal(columns("lead_user_identifiers").has("expires_at"), true);
  assert.equal(columns("lead_user_identifiers").has("retention_policy_version"), true);
  assert.equal(columns("conversion_user_data_snapshots").has("consent_state"), true);
  assert.equal(columns("conversion_user_data_snapshots").has("consent_source"), true);
  assert.equal(columns("conversion_user_data_snapshots").has("consent_observed_at"), true);
  assert.equal(columns("conversion_user_data_snapshots").has("consent_policy_version"), true);

  for (const column of [
    "first_gclid",
    "last_gclid",
    "first_gbraid",
    "last_gbraid",
    "first_wbraid",
    "last_wbraid",
  ]) {
    const plan = db
      .prepare(
        `EXPLAIN QUERY PLAN SELECT session_id FROM attribution_sessions
          WHERE ${column}='CLICK-ID' AND expires_at>'2026-09-22T00:00:00.000Z' LIMIT 1`
      )
      .all()
      .map((row) => String(row.detail));
    assert.equal(
      plan.some((detail) => detail.includes(`idx_attribution_sessions_${column}_active`)),
      true,
      `${column} query plan must use its targeted partial index`
    );
  }
});
