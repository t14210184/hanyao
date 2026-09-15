import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { ingestDataManagerEvent } from "../src/provider.ts";
import { D1OutboxRepository } from "../src/repository.ts";
import {
  PROVIDER_DISPATCH_MIN_LEASE_REMAINING_MS,
  PROVIDER_HTTP_TIMEOUT_MS,
  STALE_PROCESSING_THRESHOLD_MS
} from "../src/types.ts";
const FRESH_NOW = "2026-09-15T01:30:00.000Z";
const CYCLE_NOW = "2026-09-15T01:00:00.000Z";
const BUSINESS_ID = "business-m04-1";
const CONVERSION_ID = "conversion-m04-1";
const OWNER = "owner-m04-1";
const TRANSACTION_ID = "transaction-m04-1";
const DESTINATION = "HY_VERIFIED_LINE_CONTACT";
class StatementAdapter {
  constructor(db, sql) {
    this.args = [];
    this.db = db;
    this.sql = sql;
  }
  bind(...args) {
    this.args = args;
    return this;
  }
  execute() {
    if (/^\s*SELECT\b/i.test(this.sql)) {
      this.db.prepare(this.sql).all(...this.args);
      return { meta: { changes: 0 } };
    }
    const info = this.db.prepare(this.sql).run(...this.args);
    return { meta: { changes: Number(info.changes) } };
  }
  async run() {
    return this.execute();
  }
  async first() {
    return this.db.prepare(this.sql).get(...this.args) ?? null;
  }
}
class DatabaseAdapter {
  constructor(db) {
    this.db = db;
  }
  prepare(sql) {
    return new StatementAdapter(this.db, sql);
  }
  async batch(statements) {
    this.db.exec("BEGIN");
    try {
      const results = statements.map((statement) => statement.execute());
      this.db.exec("COMMIT");
      return results;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
const createDatabase = () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE conversion_outbox (
      conversion_id TEXT PRIMARY KEY,
      business_conversion_id TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      destination_key TEXT NOT NULL,
      status TEXT NOT NULL,
      lease_generation INTEGER NOT NULL,
      lease_owner TEXT,
      lease_expires_at TEXT,
      upload_payload_hash TEXT
    );
    CREATE TABLE business_conversions (
      business_conversion_id TEXT PRIMARY KEY,
      eligibility_state TEXT NOT NULL,
      outcome_state TEXT NOT NULL
    );
    CREATE TABLE provider_attempts (
      attempt_id TEXT PRIMARY KEY,
      business_conversion_id TEXT NOT NULL,
      attempt_sequence INTEGER NOT NULL,
      transaction_id TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      attempt_intent TEXT NOT NULL,
      fence_token INTEGER NOT NULL,
      lease_expires_at TEXT NOT NULL,
      started_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      destination_key TEXT NOT NULL,
      payload_hash TEXT NOT NULL
    );
    CREATE TABLE provider_attempt_events (
      attempt_event_id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      event_sequence INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      normalized_status TEXT NOT NULL,
      retryable INTEGER NOT NULL,
      ambiguous INTEGER NOT NULL
    );
    CREATE TABLE provider_delivery_leases (
      business_conversion_id TEXT PRIMARY KEY,
      lease_state TEXT NOT NULL,
      lease_owner TEXT,
      active_attempt_id TEXT,
      fence_token INTEGER NOT NULL,
      lease_expires_at TEXT,
      last_reconciled_at TEXT,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
};
const seed = (db, options) => {
  const generation = options.generation ?? 7;
  const owner = options.owner ?? OWNER;
  db.prepare(`INSERT INTO conversion_outbox (
    conversion_id, business_conversion_id, transaction_id, destination_key,
    status, lease_generation, lease_owner, lease_expires_at, upload_payload_hash
  ) VALUES (?, ?, ?, ?, 'processing', ?, ?, ?, NULL)`).run(
    CONVERSION_ID,
    BUSINESS_ID,
    TRANSACTION_ID,
    DESTINATION,
    generation,
    owner,
    options.leaseExpiresAt
  );
  db.prepare(`INSERT INTO business_conversions (
    business_conversion_id, eligibility_state, outcome_state
  ) VALUES (?, ?, ?)`).run(
    BUSINESS_ID,
    options.eligibility ?? "ELIGIBLE",
    options.outcome ?? "PENDING"
  );
  if (options.existingLeaseGeneration !== void 0) {
    db.prepare(`INSERT INTO provider_delivery_leases (
      business_conversion_id, lease_state, lease_owner, active_attempt_id,
      fence_token, lease_expires_at, last_reconciled_at, updated_at
    ) VALUES (?, 'CLAIMED', ?, NULL, ?, ?, NULL, ?)`).run(
      BUSINESS_ID,
      options.existingLeaseOwner ?? owner,
      options.existingLeaseGeneration,
      options.leaseExpiresAt,
      FRESH_NOW
    );
  }
  return {
    conversion_id: CONVERSION_ID,
    lead_token: "HY-M04",
    conversion_type: "verified_line_contact",
    event_timestamp: "2026-09-15T00:00:00.000Z",
    gclid: "gclid-m04",
    gbraid: null,
    wbraid: null,
    attribution_touch: "last",
    transaction_id: TRANSACTION_ID,
    destination_key: DESTINATION,
    status: "processing",
    retry_count: 1,
    next_retry_at: null,
    last_error_code: null,
    created_at: "2026-09-15T00:00:00.000Z",
    sent_at: null,
    submitted_at: null,
    google_request_id: null,
    next_diagnostic_at: null,
    terminal_result: null,
    last_error_reason: null,
    diagnostic_status: null,
    diagnostic_record_count: null,
    diagnostic_error_reason: null,
    diagnostic_attempt_count: 0,
    updated_at: CYCLE_NOW,
    business_conversion_id: BUSINESS_ID,
    snapshot_version: 1,
    eligibility_rule_version: "v1",
    google_ads_account_id: "4801404246",
    google_ads_conversion_action_id: "7674301565",
    event_source: "MESSAGE",
    lease_generation: generation,
    lease_owner: owner,
    lease_expires_at: options.leaseExpiresAt,
    upload_payload_hash: null,
    completion_id: null
  };
};
const count = (db, table) => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
const payloadHashFromDb = (db) => db.prepare(
  "SELECT upload_payload_hash FROM conversion_outbox WHERE conversion_id = ?"
).get(CONVERSION_ID).upload_payload_hash;
const repositoryFor = (db) => new D1OutboxRepository(
  new DatabaseAdapter(db),
  () => new Date(FRESH_NOW)
);
test("M04 dispatch fence uses fresh time and exact current ownership", async () => {
  const db = createDatabase();
  const row = seed(db, { leaseExpiresAt: "2026-09-15T01:35:00.000Z" });
  const repository = repositoryFor(db);
  const payloadHash = "a".repeat(64);
  const attemptId = await repository.beginProviderAttempt(row, payloadHash, CYCLE_NOW);
  const attempt = db.prepare(
    "SELECT started_at, fence_token, destination_key, payload_hash FROM provider_attempts WHERE attempt_id = ?"
  ).get(attemptId);
  assert.equal(attempt.started_at, FRESH_NOW);
  assert.equal(Number(attempt.fence_token), 7);
  assert.equal(attempt.destination_key, DESTINATION);
  assert.equal(attempt.payload_hash, payloadHash);
  assert.equal(count(db, "provider_attempt_events"), 1);
  assert.equal(payloadHashFromDb(db), payloadHash);
});
test("M04 blocks dispatch when remaining lease is below timeout safety boundary", async () => {
  const db = createDatabase();
  const row = seed(db, { leaseExpiresAt: "2026-09-15T01:31:00.000Z" });
  const repository = repositoryFor(db);
  await assert.rejects(
    repository.beginProviderAttempt(row, "b".repeat(64), CYCLE_NOW),
    /PROVIDER_ATTEMPT_FENCE_FAILED/
  );
  assert.equal(count(db, "provider_attempts"), 0);
  assert.equal(count(db, "provider_attempt_events"), 0);
  assert.equal(payloadHashFromDb(db), null);
});
test("M04 blocks stale owner and ABA generation before provider intent exists", async () => {
  const db = createDatabase();
  const row = seed(db, {
    leaseExpiresAt: "2026-09-15T01:35:00.000Z",
    existingLeaseGeneration: 8,
    existingLeaseOwner: "owner-m04-newer"
  });
  const repository = repositoryFor(db);
  await assert.rejects(
    repository.beginProviderAttempt(row, "c".repeat(64), CYCLE_NOW),
    /PROVIDER_ATTEMPT_FENCE_FAILED/
  );
  assert.equal(count(db, "provider_attempts"), 0);
  assert.equal(count(db, "provider_attempt_events"), 0);
  assert.equal(payloadHashFromDb(db), null);
});
test("M04 rechecks business eligibility immediately before dispatch intent", async () => {
  const db = createDatabase();
  const row = seed(db, {
    leaseExpiresAt: "2026-09-15T01:35:00.000Z",
    eligibility: "REVIEW"
  });
  const repository = repositoryFor(db);
  await assert.rejects(
    repository.beginProviderAttempt(row, "d".repeat(64), CYCLE_NOW),
    /PROVIDER_ATTEMPT_FENCE_FAILED/
  );
  assert.equal(count(db, "provider_attempts"), 0);
  assert.equal(count(db, "provider_attempt_events"), 0);
  assert.equal(payloadHashFromDb(db), null);
});
test("M04 provider HTTP timeout is bounded below dispatch lease safety", async () => {
  let seenSignal = null;
  const fetchImpl = (async (_input, init) => {
    seenSignal = init?.signal ?? null;
    return new Response(JSON.stringify({ requestId: "request-m04-1" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });
  const result = await ingestDataManagerEvent(
    "token-m04",
    { validateOnly: false },
    fetchImpl
  );
  assert.equal(result.requestId, "request-m04-1");
  assert.ok(seenSignal instanceof AbortSignal);
  assert.ok(PROVIDER_HTTP_TIMEOUT_MS > 0);
  assert.ok(
    PROVIDER_HTTP_TIMEOUT_MS < PROVIDER_DISPATCH_MIN_LEASE_REMAINING_MS
  );
  assert.ok(
    PROVIDER_DISPATCH_MIN_LEASE_REMAINING_MS < STALE_PROCESSING_THRESHOLD_MS
  );
});
