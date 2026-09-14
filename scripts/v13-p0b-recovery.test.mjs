import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { D1OutboxRepository } from "../workers/google-ads-uploader/src/repository.ts";

class StatementAdapter {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    return this;
  }
  async run() {
    const info = this.db.prepare(this.sql).run(...this.args);
    return { success: true, meta: { changes: Number(info.changes) }, results: [] };
  }
  async first() {
    return this.db.prepare(this.sql).get(...this.args) ?? null;
  }
  async all() {
    return { results: this.db.prepare(this.sql).all(...this.args) };
  }
}

class DatabaseAdapter {
  constructor(db) { this.db = db; }
  prepare(sql) { return new StatementAdapter(this.db, sql); }
}
const db = new DatabaseSync(":memory:");
db.exec(`
CREATE TABLE conversion_outbox (
  conversion_id TEXT PRIMARY KEY,
  business_conversion_id TEXT,
  transaction_id TEXT NOT NULL,
  destination_key TEXT NOT NULL,
  status TEXT NOT NULL,
  retry_count INTEGER NOT NULL,
  next_retry_at TEXT,
  last_error_code TEXT,
  last_error_reason TEXT,
  terminal_result TEXT,
  submitted_at TEXT,
  google_request_id TEXT,
  next_diagnostic_at TEXT,
  lease_generation INTEGER NOT NULL,
  lease_owner TEXT,
  lease_expires_at TEXT,
  upload_payload_hash TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE provider_attempts (
  attempt_id TEXT PRIMARY KEY,
  business_conversion_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  fence_token INTEGER NOT NULL,
  destination_key TEXT,
  payload_hash TEXT
);
CREATE TABLE provider_attempt_events (
  attempt_event_id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  event_sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  provider_request_id TEXT,
  normalized_status TEXT NOT NULL
);
CREATE TABLE business_conversions (
  business_conversion_id TEXT PRIMARY KEY,
  outcome_state TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL
);
CREATE TABLE provider_delivery_leases (
  business_conversion_id TEXT PRIMARY KEY,
  lease_state TEXT NOT NULL,
  lease_owner TEXT,
  lease_expires_at TEXT,
  last_reconciled_at TEXT,
  updated_at TEXT NOT NULL
);
`);

const STALE = "2026-09-14T09:00:00.000Z";
const NOW = "2026-09-14T10:00:00.000Z";
const PAYLOAD_HASH = "b".repeat(64);
const REQUEST_ID = "requests/p0b-exact-request";
db.prepare(`INSERT INTO conversion_outbox (
  conversion_id, business_conversion_id, transaction_id, destination_key,
  status, retry_count, lease_generation, lease_owner, lease_expires_at,
  upload_payload_hash, updated_at
) VALUES (?, ?, ?, ?, 'processing', 1, 7, ?, ?, ?, ?)`)
  .run(
    "conversion-p0b-1",
    "business-p0b-1",
    "transaction-p0b-1",
    "HY_VERIFIED_LINE_CONTACT",
    "owner-p0b-1",
    STALE,
    PAYLOAD_HASH,
    STALE
  );

db.prepare(`INSERT INTO business_conversions (
  business_conversion_id, outcome_state, updated_at, version
) VALUES (?, 'PENDING', ?, 1)`)
  .run("business-p0b-1", STALE);

db.prepare(`INSERT INTO provider_attempts (
  attempt_id, business_conversion_id, transaction_id, fence_token,
  destination_key, payload_hash
) VALUES (?, ?, ?, 7, ?, ?)`)
  .run(
    "attempt-p0b-1",
    "business-p0b-1",
    "transaction-p0b-1",
    "HY_VERIFIED_LINE_CONTACT",
    PAYLOAD_HASH
  );

db.prepare(`INSERT INTO provider_attempt_events (
  attempt_event_id, attempt_id, event_sequence, event_type,
  recorded_at, provider_request_id, normalized_status
) VALUES (?, ?, 2, 'ACKNOWLEDGED', ?, ?, 'ACKNOWLEDGED')`)
  .run("event-p0b-ack-1", "attempt-p0b-1", STALE, REQUEST_ID);

db.prepare(`INSERT INTO provider_delivery_leases (
  business_conversion_id, lease_state, lease_owner, lease_expires_at,
  last_reconciled_at, updated_at
) VALUES (?, 'CLAIMED', ?, ?, NULL, ?)`)
  .run("business-p0b-1", "owner-p0b-1", STALE, STALE);

const repository = new D1OutboxRepository(new DatabaseAdapter(db));
const changed = await repository.recoverStaleClaims(
  "2026-09-14T09:30:00.000Z",
  NOW,
  5
);
assert.equal(changed, 1);

const restored = db.prepare(`SELECT status, google_request_id, submitted_at,
  next_diagnostic_at, last_error_code, terminal_result, lease_owner,
  lease_expires_at FROM conversion_outbox WHERE conversion_id = ?`)
  .get("conversion-p0b-1");
assert.equal(restored.status, "submitted");
assert.equal(restored.google_request_id, REQUEST_ID);
assert.equal(restored.submitted_at, STALE);
assert.equal(restored.next_diagnostic_at, NOW);
assert.equal(restored.last_error_code, "ACK_RESTORED_AFTER_STALE_CLAIM");
assert.equal(restored.terminal_result, null);
assert.equal(restored.lease_owner, null);
assert.equal(restored.lease_expires_at, null);

const lease = db.prepare(`SELECT lease_state, lease_owner, lease_expires_at,
  last_reconciled_at FROM provider_delivery_leases
  WHERE business_conversion_id = ?`).get("business-p0b-1");
assert.equal(lease.lease_state, "CLOSED");
assert.equal(lease.lease_owner, null);
assert.equal(lease.lease_expires_at, null);
assert.equal(lease.last_reconciled_at, NOW);

const business = db.prepare(`SELECT outcome_state FROM business_conversions
  WHERE business_conversion_id = ?`).get("business-p0b-1");
assert.equal(business.outcome_state, "PENDING");

console.log(JSON.stringify({
  result: "V13_P0B_ACK_RECOVERY_PASS",
  restoredRequestId: REQUEST_ID,
  noReingestRequired: true,
  deliveryLeaseClosed: true,
}));
