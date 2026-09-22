import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import {
  REPEAT_STAGE_POLICY,
  projectConfirmedStageToCanonicalOutbox,
  recordLeadStageEvent,
  type LeadStageEventInput,
} from "../functions/_lib/business-stage-ledger.ts";
import {
  buildDataManagerRequest,
  resolveDestination,
} from "../workers/google-ads-uploader/src/payload.ts";
import type {
  ConversionOutboxRow,
  UploaderConfig,
} from "../workers/google-ads-uploader/src/types.ts";

class SqliteD1Statement {
  private args: unknown[] = [];
  private readonly database: DatabaseSync;
  private readonly sql: string;
  constructor(database: DatabaseSync, sql: string) {
    this.database = database;
    this.sql = sql;
  }
  bind(...args: unknown[]) {
    this.args = args;
    return this;
  }
  async first<T>() {
    return (this.database.prepare(this.sql).get(...this.args) ?? null) as T | null;
  }
  async all<T>() {
    return {
      success: true,
      results: this.database.prepare(this.sql).all(...this.args) as T[],
      meta: { changes: 0 },
    };
  }
  async run() {
    const result = this.database.prepare(this.sql).run(...this.args);
    return { success: true, meta: { changes: Number(result.changes ?? 0) }, results: [] };
  }
}

const sqliteD1 = (
  database: DatabaseSync,
  options: { failBatchAt?: number } = {}
) => ({
  prepare(sql: string) {
    return new SqliteD1Statement(database, sql);
  },
  async batch(statements: SqliteD1Statement[]) {
    const results = [];
    database.exec("BEGIN");
    try {
      for (const [index, statement] of statements.entries()) {
        if (options.failBatchAt === index + 1) {
          throw new Error("FORCED_BATCH_FAILURE");
        }
        results.push(await statement.run());
      }
      database.exec("COMMIT");
      return results;
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  },
});

const migratedDatabase = (): DatabaseSync => {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON;");
  for (const file of fs
    .readdirSync("migrations")
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .sort()) {
    database.exec(fs.readFileSync(`migrations/${file}`, "utf8"));
  }
  return database;
};

const seedVerifiedConversion = (database: DatabaseSync): void => {
  const timestamp = "2026-09-22T00:00:00.000Z";
  database.prepare(
    `INSERT INTO attribution_sessions (
      session_id, schema_version, server_created_at, server_updated_at, expires_at
    ) VALUES (?, 1, ?, ?, ?)`
  ).run("session-stage", timestamp, timestamp, "2026-12-22T00:00:00.000Z");
  database.prepare(
    `INSERT INTO lead_tokens (
      lead_token, request_id, session_id, channel, status, server_created_at
    ) VALUES (?, ?, ?, 'line', 'issued', ?)`
  ).run("HY-STAGE01", "request-stage", "session-stage", timestamp);
  database.prepare(
    `INSERT INTO line_events (
      line_event_id, webhook_event_id, message_id, lead_token, event_type,
      match_status, line_event_timestamp, received_at, created_at, line_user_key
    ) VALUES (?, ?, ?, ?, 'message', 'MATCHED_ADS', ?, ?, ?, ?)`
  ).run(
    "line-event-stage",
    "webhook-stage",
    "message-stage",
    "HY-STAGE01",
    timestamp,
    timestamp,
    timestamp,
    "lu_v1_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  );
  database.prepare(
    `INSERT INTO business_conversions (
      business_conversion_id, transaction_id, conversion_type, subject_kind, subject_key,
      attribution_session_id, first_lead_token, first_line_event_id, first_webhook_event_id,
      conversion_time, dedupe_until, attribution_touch, gclid, lineage_observed_at,
      destination_key, conversion_action_id, eligibility_state, outcome_state,
      created_at, updated_at
    ) VALUES (?, ?, 'verified_line_contact', 'LINE_USER_HMAC', ?, ?, ?, ?, ?, ?, ?, 'last', ?, ?, ?, ?, 'ELIGIBLE', 'PENDING', ?, ?)`
  ).run(
    "business-verified-stage",
    "verified-transaction-stage",
    "subject-stage",
    "session-stage",
    "HY-STAGE01",
    "line-event-stage",
    "webhook-stage",
    timestamp,
    "2026-10-22T00:00:00.000Z",
    "gclid-stage",
    timestamp,
    "HY_VERIFIED_LINE_CONTACT",
    "7674301565",
    timestamp,
    timestamp
  );
};

const evidence = {
  realContact: true,
  serviceRelevant: true,
  commercialIntent: true,
  qualificationProof: true,
  dedupePass: true,
  sourceVerifiedContact: true,
  realBusinessEvidence: false,
  sourceIds: ["line_event:line-event-stage", "quote:quote-stage"],
  factHashes: ["a".repeat(64)],
};

const stageInput = (
  overrides: Partial<LeadStageEventInput> = {}
): LeadStageEventInput => ({
  sourceVerifiedBusinessConversionId: "business-verified-stage",
  lineUserKey: "lu_v1_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  stageType: "QUALIFIED_CONFIRMED",
  stageSource: "HUMAN_CONFIRMED",
  stageRuleVersion: "v11-qualified-v1",
  occurredAt: "2026-09-22T01:00:00.000Z",
  createdAt: "2026-09-22T01:00:00.000Z",
  eventSource: "MESSAGE",
  evidence,
  ...overrides,
});

const uploaderConfig = (
  overrides: Partial<UploaderConfig> = {}
): UploaderConfig => ({
  googleAdsAccountId: "4801404246",
  googleAdsConversionActionId: "7674301565",
  qualifiedLineLeadConversionActionId: "8800000001",
  wonJobConversionActionId: "8800000002",
  validateOnly: true,
  enhancedUserDataEnabled: true,
  adUserDataConsentGranted: true,
  qualifiedUserDataOnlyProviderProof: false,
  terminalRetentionDays: null,
  ...overrides,
});

const outboxRow = (
  overrides: Partial<ConversionOutboxRow> = {}
): ConversionOutboxRow => ({
  conversion_id: "qualified-outbox-stage",
  lead_token: "HY-STAGE01",
  conversion_type: "qualified_line_lead",
  event_timestamp: "2026-09-22T01:00:00.000Z",
  gclid: "gclid-qualified-stage",
  gbraid: null,
  wbraid: null,
  attribution_touch: "last",
  transaction_id: "qualified-transaction-stage",
  destination_key: "HY_QUALIFIED_LINE_LEAD",
  status: "pending",
  retry_count: 0,
  next_retry_at: null,
  last_error_code: null,
  created_at: "2026-09-22T01:00:00.000Z",
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
  updated_at: "2026-09-22T01:00:00.000Z",
  business_conversion_id: "stage-business-qualified",
  snapshot_version: 1,
  eligibility_rule_version: "v11-qualified-v1",
  google_ads_account_id: "4801404246",
  google_ads_conversion_action_id: "8800000001",
  event_source: "MESSAGE",
  stage_event_id: "stage-event-qualified",
  lease_generation: 0,
  lease_owner: null,
  lease_expires_at: null,
  enhanced_user_identifiers: [{ type: "EMAIL_SHA256", hash: "b".repeat(64) }],
  consent_state: "GRANTED",
  consent_source: "explicit-stage-consent",
  consent_observed_at: "2026-09-22T01:00:00.000Z",
  consent_policy_version: "v1",
  ...overrides,
});

test("T117/T118: stage ledger is deterministic, append-only, and gate-protected", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  const d1 = sqliteD1(database);

  const candidate = await recordLeadStageEvent(
    d1 as never,
    stageInput({
      stageType: "QUALIFIED_CANDIDATE",
      stageSource: "RULE",
      evidence: { ...evidence, qualificationProof: false },
    })
  );
  assert.equal(candidate.written, true);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM business_conversions WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
  await assert.rejects(
    projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      candidate.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-22T01:01:00.000Z"
    ),
    /STAGE_CANDIDATE_NOT_PROJECTABLE/
  );

  const confirmed = await recordLeadStageEvent(d1 as never, stageInput());
  const retry = await recordLeadStageEvent(d1 as never, stageInput());
  assert.equal(confirmed.written, true);
  assert.equal(retry.written, false);
  assert.equal(retry.record.stageEventId, confirmed.record.stageEventId);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM lead_stage_events WHERE stage_event_id=?").get(confirmed.record.stageEventId).count,
    1
  );
  const serialized = JSON.stringify(database.prepare("SELECT * FROM lead_stage_events WHERE stage_event_id=?").get(confirmed.record.stageEventId));
  assert.doesNotMatch(serialized, /message|phone|email|quote-stage/);
  assert.match(serialized, /evidence_digest":"[0-9a-f]{64}/);
});

test("T119/T126/T127/T128: one canonical outbox supports qualified and won stages idempotently", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  const d1 = sqliteD1(database);
  const qualified = await recordLeadStageEvent(d1 as never, stageInput());
  assert.equal(
    await projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      qualified.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-22T01:02:00.000Z"
    ),
    "CREATED"
  );
  assert.equal(
    await projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      qualified.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-22T01:03:00.000Z"
    ),
    "ALREADY_PRESENT"
  );
  assert.deepEqual(
    {
      ...database.prepare(
        `SELECT
           (SELECT COUNT(*) FROM business_conversions WHERE conversion_type='qualified_line_lead') AS business_count,
           (SELECT COUNT(*) FROM business_conversion_dedupe_locks WHERE conversion_type='qualified_line_lead') AS lock_count,
           (SELECT COUNT(*) FROM conversion_outbox WHERE conversion_type='qualified_line_lead') AS outbox_count`
      ).get(),
    },
    { business_count: 1, lock_count: 1, outbox_count: 1 }
  );

  const won = await recordLeadStageEvent(
    d1 as never,
    stageInput({
      stageType: "WON_JOB",
      stageSource: "PAYMENT_CONFIRMED",
      eventSource: "OTHER",
      occurredAt: "2026-09-22T02:00:00.000Z",
      evidence: { ...evidence, realBusinessEvidence: true, sourceIds: ["payment:payment-stage"] },
      conversionValueMicros: 125000,
      currencyCode: "TWD",
    })
  );
  await projectConfirmedStageToCanonicalOutbox(
    d1 as never,
    won.record.stageEventId,
    "8800000002",
    "4801404246",
    "2026-09-22T02:01:00.000Z"
  );

  const rows = database.prepare(
    `SELECT conversion_type, destination_key, transaction_id, stage_event_id,
            conversion_value_micros, currency_code
       FROM conversion_outbox ORDER BY conversion_type`
  ).all();
  assert.deepEqual(rows.map((row: Record<string, unknown>) => row.conversion_type), ["qualified_line_lead", "won_job"]);
  assert.equal(rows[0].destination_key, "HY_QUALIFIED_LINE_LEAD");
  assert.equal(rows[1].destination_key, "HY_WON_JOB");
  assert.equal(rows[1].conversion_value_micros, 125000);
  assert.equal(rows[1].currency_code, "TWD");
  assert.notEqual(rows[0].transaction_id, rows[1].transaction_id);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='conversion_outbox'").get().count,
    1
  );
  assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
});

test("T140/T146: repeat-stage policy blocks a different stage event before any canonical write", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  const d1 = sqliteD1(database);
  assert.equal(
    REPEAT_STAGE_POLICY,
    "ONE_CANONICAL_OUTCOME_PER_VERIFIED_INQUIRY_AND_STAGE_TYPE"
  );

  const first = await recordLeadStageEvent(d1 as never, stageInput());
  await projectConfirmedStageToCanonicalOutbox(
    d1 as never,
    first.record.stageEventId,
    "8800000001",
    "4801404246",
    "2026-09-22T01:02:00.000Z"
  );
  const repeat = await recordLeadStageEvent(
    d1 as never,
    stageInput({
      occurredAt: "2026-09-23T01:00:00.000Z",
      createdAt: "2026-09-23T01:00:00.000Z",
      evidence: {
        ...evidence,
        sourceIds: ["line_event:line-event-stage", "quote:repeat-stage"],
      },
    })
  );

  await assert.rejects(
    projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      repeat.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-23T01:01:00.000Z"
    ),
    /STAGE_REPEAT_OUTCOME_BLOCKED/
  );
  assert.deepEqual(
    {
      ...database.prepare(
        `SELECT
           (SELECT COUNT(*) FROM business_conversions WHERE conversion_type='qualified_line_lead') AS business_count,
           (SELECT COUNT(*) FROM business_conversion_dedupe_locks WHERE conversion_type='qualified_line_lead') AS lock_count,
           (SELECT COUNT(*) FROM conversion_outbox WHERE conversion_type='qualified_line_lead') AS outbox_count`
      ).get(),
    },
    { business_count: 1, lock_count: 1, outbox_count: 1 }
  );
});

test("T141: a conflicting dedupe lock is fail-closed with zero canonical writes", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  database.prepare(
    `INSERT INTO business_conversion_dedupe_locks (
       subject_kind, subject_key, conversion_type, active_business_conversion_id,
       dedupe_until, last_lineage_observed_at, fence_version, updated_at
     ) VALUES (?, ?, 'qualified_line_lead', ?, ?, ?, 0, ?)`
  ).run(
    "LINE_USER_HMAC",
    "subject-stage",
    "business-verified-stage",
    "2026-10-22T00:00:00.000Z",
    "2026-09-21T00:00:00.000Z",
    "2026-09-21T00:00:00.000Z"
  );
  const d1 = sqliteD1(database);
  const stage = await recordLeadStageEvent(d1 as never, stageInput());

  await assert.rejects(
    projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      stage.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-22T01:02:00.000Z"
    ),
    /STAGE_DEDUPE_LOCK_CONFLICT/
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM business_conversions WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM conversion_outbox WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
});

test("T142: a business conversion without its outbox is reconciliation-required", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  const d1 = sqliteD1(database);
  const stage = await recordLeadStageEvent(d1 as never, stageInput());
  await projectConfirmedStageToCanonicalOutbox(
    d1 as never,
    stage.record.stageEventId,
    "8800000001",
    "4801404246",
    "2026-09-22T01:02:00.000Z"
  );
  database.prepare("DELETE FROM conversion_outbox WHERE stage_event_id=?").run(stage.record.stageEventId);

  await assert.rejects(
    projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      stage.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-22T01:03:00.000Z"
    ),
    /RECONCILIATION_REQUIRED/
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM business_conversions WHERE stage_event_id=?").get(stage.record.stageEventId).count,
    1
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM conversion_outbox WHERE stage_event_id=?").get(stage.record.stageEventId).count,
    0
  );
});

test("T143: an outbox identity collision is fail-closed without repairing it", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  const d1 = sqliteD1(database);
  const stage = await recordLeadStageEvent(d1 as never, stageInput());
  const otherStage = await recordLeadStageEvent(
    d1 as never,
    stageInput({
      occurredAt: "2026-09-23T01:00:00.000Z",
      createdAt: "2026-09-23T01:00:00.000Z",
      evidence: {
        ...evidence,
        sourceIds: ["line_event:line-event-stage", "quote:other-stage"],
      },
    })
  );
  database.prepare(
    `INSERT INTO conversion_outbox (
       conversion_id, lead_token, conversion_type, event_timestamp, transaction_id,
       destination_key, created_at, updated_at, business_conversion_id,
       eligibility_rule_version, google_ads_account_id,
       google_ads_conversion_action_id, event_source, stage_event_id
     ) VALUES (?, 'HY-STAGE01', 'qualified_line_lead', ?, ?,
       'HY_QUALIFIED_LINE_LEAD', ?, ?, ?, 'v11-qualified-v1',
       '4801404246', '8800000001', 'MESSAGE', ?)`
  ).run(
    `stage_outbox_${stage.record.stageEventId}`,
    stageInput().occurredAt,
    "conflicting-transaction-stage",
    "2026-09-22T01:00:00.000Z",
    "2026-09-22T01:00:00.000Z",
    "other-business-stage",
    otherStage.record.stageEventId
  );

  await assert.rejects(
    projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      stage.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-22T01:02:00.000Z"
    ),
    /CANONICAL_STAGE_CONFLICT/
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM business_conversions WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM business_conversion_dedupe_locks WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM conversion_outbox WHERE conversion_id=?").get(`stage_outbox_${stage.record.stageEventId}`).count,
    1
  );
});

test("T144: later-stage dedupe fences use stage occurrence, not an expired Verified window", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  database.prepare(
    "UPDATE business_conversions SET dedupe_until=? WHERE business_conversion_id=?"
  ).run("2026-09-01T00:00:00.000Z", "business-verified-stage");
  const d1 = sqliteD1(database);
  const stage = await recordLeadStageEvent(d1 as never, stageInput());
  await projectConfirmedStageToCanonicalOutbox(
    d1 as never,
    stage.record.stageEventId,
    "8800000001",
    "4801404246",
    "2026-09-22T01:02:00.000Z"
  );

  const business = database.prepare(
    "SELECT dedupe_until FROM business_conversions WHERE stage_event_id=?"
  ).get(stage.record.stageEventId);
  const lock = database.prepare(
    "SELECT dedupe_until FROM business_conversion_dedupe_locks WHERE active_business_conversion_id=?"
  ).get(`stage_bc_${stage.record.stageEventId}`);
  assert.equal(business.dedupe_until, "2026-10-22T01:00:00.000Z");
  assert.equal(lock.dedupe_until, "2026-10-22T01:00:00.000Z");
  assert.notEqual(business.dedupe_until, "2026-09-01T00:00:00.000Z");
});

test("T145: a forced SQL failure rolls back the entire canonical batch", async () => {
  const database = migratedDatabase();
  seedVerifiedConversion(database);
  const d1 = sqliteD1(database, { failBatchAt: 2 });
  const stage = await recordLeadStageEvent(d1 as never, stageInput());

  await assert.rejects(
    projectConfirmedStageToCanonicalOutbox(
      d1 as never,
      stage.record.stageEventId,
      "8800000001",
      "4801404246",
      "2026-09-22T01:02:00.000Z"
    ),
    /CANONICAL_BATCH_FAILED_ROLLED_BACK/
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM business_conversions WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM business_conversion_dedupe_locks WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM conversion_outbox WHERE conversion_type='qualified_line_lead'").get().count,
    0
  );
});

test("T120/T121/T122/T123/T124/T125/T128: destination and identity policy fail closed", () => {
  const config = uploaderConfig();
  assert.equal(resolveDestination("verified_line_contact", config)?.conversionActionId, "7674301565");
  assert.equal(resolveDestination("qualified_line_lead", config)?.destinationKey, "HY_QUALIFIED_LINE_LEAD");
  assert.equal(resolveDestination("won_job", config)?.destinationKey, "HY_WON_JOB");
  assert.equal(resolveDestination("unknown_type", config), null);
  assert.equal(resolveDestination("qualified_line_lead", uploaderConfig({ qualifiedLineLeadConversionActionId: null })), null);

  const qualified = outboxRow();
  const withClickAndUserData = buildDataManagerRequest(qualified, config);
  assert.equal(withClickAndUserData.destinations[0].productDestinationId, "8800000001");
  assert.equal(withClickAndUserData.events[0].eventSource, "MESSAGE");
  assert.equal(withClickAndUserData.events[0].transactionId, qualified.transaction_id);

  assert.throws(
    () => buildDataManagerRequest(
      outboxRow({ gclid: null, enhanced_user_identifiers: [{ type: "EMAIL_SHA256", hash: "b".repeat(64) }] }),
      config
    ),
    /ATTRIBUTION_IDENTIFIER_MISSING/
  );
  const userDataOnly = buildDataManagerRequest(
    outboxRow({ gclid: null }),
    uploaderConfig({ qualifiedUserDataOnlyProviderProof: true })
  );
  assert.equal(userDataOnly.events[0].adIdentifiers, undefined);
  assert.ok(userDataOnly.events[0].userData);

  assert.throws(
    () => buildDataManagerRequest(
      outboxRow({
        conversion_type: "verified_line_contact",
        destination_key: "HY_VERIFIED_LINE_CONTACT",
        google_ads_conversion_action_id: "7674301565",
        stage_event_id: null,
        gclid: null,
      }),
      uploaderConfig({ qualifiedUserDataOnlyProviderProof: true })
    ),
    /ATTRIBUTION_IDENTIFIER_MISSING/
  );
  assert.throws(
    () => buildDataManagerRequest(
      outboxRow({ google_ads_conversion_action_id: "7674301565" }),
      config
    ),
    /CANONICAL_DESTINATION_MISMATCH/
  );
  assert.throws(
    () => buildDataManagerRequest(
      outboxRow({ conversion_type: "unknown_type" as ConversionOutboxRow["conversion_type"] }),
      config
    ),
    /UNKNOWN_CONVERSION_TYPE/
  );

  const won = outboxRow({
    conversion_id: "won-outbox-stage",
    conversion_type: "won_job",
    destination_key: "HY_WON_JOB",
    google_ads_conversion_action_id: "8800000002",
    event_source: "OTHER",
    transaction_id: "won-transaction-stage",
    conversion_value_micros: 125000,
    currency_code: "TWD",
  });
  const wonRequest = buildDataManagerRequest(won, config);
  assert.equal(wonRequest.events[0].eventSource, "OTHER");
  assert.equal(wonRequest.events[0].conversionValueMicros, 125000);
  assert.equal(wonRequest.events[0].currencyCode, "TWD");
  assert.throws(
    () => buildDataManagerRequest({ ...won, conversion_value_micros: null }, config),
    /WON_JOB_VALUE_MISSING/
  );
});
