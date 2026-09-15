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
  execute() {
    if (/^\s*SELECT\b/i.test(this.sql)) {
      const rows = this.db.prepare(this.sql).all(...this.args);
      return { success: true, meta: { changes: 0 }, results: rows };
    }
    const info = this.db.prepare(this.sql).run(...this.args);
    return { success: true, meta: { changes: Number(info.changes) }, results: [] };
  }
  async run() { return this.execute(); }
  async first() { return this.db.prepare(this.sql).get(...this.args) ?? null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}

class DatabaseAdapter {
  constructor(db, failAt = null) {
    this.db = db;
    this.failAt = failAt;
  }
  prepare(sql) { return new StatementAdapter(this.db, sql); }
  async batch(statements) {
    this.db.exec("BEGIN");
    const results = [];
    try {
      for (let index = 0; index < statements.length; index += 1) {
        if (this.failAt === index) throw new Error(`SIMULATED_BATCH_FAILURE_${index}`);
        results.push(statements[index].execute());
      }
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
      business_conversion_id TEXT,
      transaction_id TEXT NOT NULL,
      destination_key TEXT NOT NULL,
      status TEXT NOT NULL,
      retry_count INTEGER NOT NULL,
      next_retry_at TEXT,
      last_error_code TEXT,
      submitted_at TEXT,
      google_request_id TEXT,
      next_diagnostic_at TEXT,
      terminal_result TEXT,
      last_error_reason TEXT,
      diagnostic_status TEXT,
      diagnostic_record_count INTEGER,
      diagnostic_error_reason TEXT,
      diagnostic_attempt_count INTEGER NOT NULL,
      sent_at TEXT,
      updated_at TEXT NOT NULL,
      lease_generation INTEGER NOT NULL,
      lease_owner TEXT,
      lease_expires_at TEXT,
      completion_id TEXT,
      provider_warning_json TEXT
    );
    CREATE TABLE business_conversions (
      business_conversion_id TEXT PRIMARY KEY,
      outcome_state TEXT NOT NULL,
      completion_id TEXT,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL
    );
    CREATE TABLE provider_delivery_leases (
      business_conversion_id TEXT PRIMARY KEY,
      lease_state TEXT NOT NULL,
      lease_owner TEXT,
      active_attempt_id TEXT,
      lease_expires_at TEXT,
      last_reconciled_at TEXT,
      updated_at TEXT NOT NULL,
      completion_id TEXT
    );
    CREATE TABLE provider_attempt_events (
      attempt_event_id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      event_sequence INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      provider_request_id TEXT,
      normalized_status TEXT NOT NULL,
      retryable INTEGER NOT NULL,
      ambiguous INTEGER NOT NULL,
      sanitized_reason TEXT,
      record_count INTEGER,
      completion_id TEXT,
      provider_warning_json TEXT,
      UNIQUE (attempt_id, event_sequence)
    );
  `);
  return db;
};

const NOW = "2026-09-14T10:00:00.000Z";
const EXPIRES = "2026-09-14T10:30:00.000Z";

const seed = (db, suffix) => {
  const conversionId = `conversion-${suffix}`;
  const businessId = `business-${suffix}`;
  const attemptId = `attempt-${suffix}`;
  const owner = `owner-${suffix}`;
  db.prepare(`INSERT INTO conversion_outbox (
    conversion_id, business_conversion_id, transaction_id, destination_key,
    status, retry_count, diagnostic_attempt_count, updated_at,
    lease_generation, lease_owner, lease_expires_at
  ) VALUES (?, ?, ?, 'HY_VERIFIED_LINE_CONTACT', 'processing', 1, 1, ?, 7, ?, ?)`)
    .run(conversionId, businessId, `transaction-${suffix}`, "2026-09-14T09:00:00.000Z", owner, EXPIRES);
  db.prepare(`INSERT INTO business_conversions (
    business_conversion_id, outcome_state, updated_at, version
  ) VALUES (?, 'PENDING', ?, 1)`)
    .run(businessId, "2026-09-14T09:00:00.000Z");
  db.prepare(`INSERT INTO provider_delivery_leases (
    business_conversion_id, lease_state, lease_owner, active_attempt_id,
    lease_expires_at, last_reconciled_at, updated_at
  ) VALUES (?, 'CLAIMED', ?, ?, ?, NULL, ?)`)
    .run(businessId, owner, attemptId, EXPIRES, "2026-09-14T09:00:00.000Z");
  db.prepare(`INSERT INTO provider_attempt_events (
    attempt_event_id, attempt_id, event_sequence, event_type, recorded_at,
    provider_request_id, normalized_status, retryable, ambiguous
  ) VALUES (?, ?, 1, 'ATTEMPT_STARTED', ?, NULL, 'STARTED', 0, 0)`)
    .run(`event-start-${suffix}`, attemptId, "2026-09-14T09:00:00.000Z");
  db.prepare(`INSERT INTO provider_attempt_events (
    attempt_event_id, attempt_id, event_sequence, event_type, recorded_at,
    provider_request_id, normalized_status, retryable, ambiguous
  ) VALUES (?, ?, 2, 'ACKNOWLEDGED', ?, ?, 'ACKNOWLEDGED', 0, 0)`)
    .run(`event-ack-${suffix}`, attemptId, "2026-09-14T09:01:00.000Z", `request-${suffix}`);
  return { conversionId, businessId, attemptId, owner };
};

const successRow = ({ conversionId, businessId, owner }) => ({
  conversion_id: conversionId,
  business_conversion_id: businessId,
  status: "success",
  retry_count: 1,
  next_retry_at: null,
  last_error_code: null,
  submitted_at: "2026-09-14T09:01:00.000Z",
  google_request_id: "request-success",
  next_diagnostic_at: null,
  terminal_result: "SUCCESS",
  last_error_reason: null,
  diagnostic_status: "SUCCESS",
  diagnostic_record_count: 1,
  diagnostic_error_reason: null,
  diagnostic_attempt_count: 1,
  sent_at: NOW,
  updated_at: NOW,
  lease_generation: 7,
  lease_owner: owner,
  lease_expires_at: EXPIRES,
});

const assertOpen = (db, ids) => {
  const outbox = db.prepare(`SELECT status, completion_id, lease_owner
    FROM conversion_outbox WHERE conversion_id = ?`).get(ids.conversionId);
  const business = db.prepare(`SELECT outcome_state, completion_id
    FROM business_conversions WHERE business_conversion_id = ?`).get(ids.businessId);
  const lease = db.prepare(`SELECT lease_state, completion_id, lease_owner
    FROM provider_delivery_leases WHERE business_conversion_id = ?`).get(ids.businessId);
  const terminalEvents = db.prepare(`SELECT COUNT(*) AS count FROM provider_attempt_events
    WHERE attempt_id = ? AND completion_id IS NOT NULL`).get(ids.attemptId);
  assert.equal(outbox.status, "processing");
  assert.equal(outbox.completion_id, null);
  assert.equal(outbox.lease_owner, ids.owner);
  assert.equal(business.outcome_state, "PENDING");
  assert.equal(business.completion_id, null);
  assert.equal(lease.lease_state, "CLAIMED");
  assert.equal(lease.completion_id, null);
  assert.equal(lease.lease_owner, ids.owner);
  assert.equal(Number(terminalEvents.count), 0);
};

{
  const db = createDatabase();
  const ids = seed(db, "success");
  const repository = new D1OutboxRepository(
    new DatabaseAdapter(db),
    () => new Date(NOW)
  );
  const row = successRow(ids);
  row.google_request_id = "request-success";
  await repository.save(row);
  assert.ok(row.completion_id);

  const outbox = db.prepare(`SELECT status, completion_id, lease_owner, lease_expires_at
    FROM conversion_outbox WHERE conversion_id = ?`).get(ids.conversionId);
  const business = db.prepare(`SELECT outcome_state, completion_id
    FROM business_conversions WHERE business_conversion_id = ?`).get(ids.businessId);
  const lease = db.prepare(`SELECT lease_state, completion_id, lease_owner, lease_expires_at
    FROM provider_delivery_leases WHERE business_conversion_id = ?`).get(ids.businessId);
  const terminal = db.prepare(`SELECT event_type, completion_id, provider_request_id
    FROM provider_attempt_events WHERE attempt_id = ? AND completion_id = ?`)
    .get(ids.attemptId, row.completion_id);

  assert.equal(outbox.status, "success");
  assert.equal(outbox.completion_id, row.completion_id);
  assert.equal(outbox.lease_owner, null);
  assert.equal(outbox.lease_expires_at, null);
  assert.equal(business.outcome_state, "SUCCESS");
  assert.equal(business.completion_id, row.completion_id);
  assert.equal(lease.lease_state, "CLOSED");
  assert.equal(lease.completion_id, row.completion_id);
  assert.equal(lease.lease_owner, null);
  assert.equal(lease.lease_expires_at, null);
  assert.equal(terminal.event_type, "SUCCESS");
  assert.equal(terminal.completion_id, row.completion_id);
  assert.equal(terminal.provider_request_id, "request-success");
}

{
  const db = createDatabase();
  const ids = seed(db, "rollback");
  const repository = new D1OutboxRepository(
    new DatabaseAdapter(db, 3),
    () => new Date(NOW)
  );
  const row = successRow(ids);
  row.google_request_id = "request-rollback";
  await assert.rejects(
    repository.save(row),
    /SIMULATED_BATCH_FAILURE_3/
  );
  assertOpen(db, ids);
}

{
  const db = createDatabase();
  const ids = seed(db, "stale");
  const repository = new D1OutboxRepository(
    new DatabaseAdapter(db),
    () => new Date(NOW)
  );
  const row = successRow(ids);
  row.lease_owner = "stale-owner";
  await assert.rejects(repository.save(row));
  assertOpen(db, ids);
}

console.log(JSON.stringify({
  result: "V13_P0C_ATOMIC_COMPLETION_PASS",
  successCompletionConsistent: true,
  simulatedFailureRolledBack: true,
  staleFenceZeroMutation: true,
}));
