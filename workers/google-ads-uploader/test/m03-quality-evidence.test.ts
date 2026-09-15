import assert from "node:assert/strict";
import { test } from "node:test";
import { GOOGLE_ADS_DESTINATION_REFERENCE } from "../src/payload.ts";
import { retrieveDataManagerStatus } from "../src/provider.ts";
import { D1OutboxRepository } from "../src/repository.ts";
import { runScheduledCycle } from "../src/scheduler.ts";
import type {
  ConversionOutboxRow,
  FetchLike,
  OutboxRepository,
  UploaderEnv,
} from "../src/types.ts";

const NOW = "2026-08-28T04:00:00.000Z";
const EXPECTED = {
  destinationReference: GOOGLE_ADS_DESTINATION_REFERENCE,
  googleAdsAccountId: "4801404246",
  googleAdsConversionActionId: "7674301565",
  expectedRecordCount: 1,
};

const destination = () => ({
  reference: GOOGLE_ADS_DESTINATION_REFERENCE,
  operatingAccount: { accountType: "GOOGLE_ADS", accountId: "4801404246" },
  productDestinationId: "7674301565",
});

const response = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

test("M03 rejects missing or multiple diagnostic destinations", async () => {
  for (const requestStatusPerDestination of [
    [],
    [
      { requestStatus: "SUCCESS", eventsIngestionStatus: { recordCount: 1 } },
      { requestStatus: "SUCCESS", eventsIngestionStatus: { recordCount: 1 } },
    ],
  ]) {
    const result = await retrieveDataManagerStatus(
      "test-token",
      "diagnostic-m03-destination-count",
      EXPECTED,
      (async () => response({ requestStatusPerDestination })) as FetchLike
    );
    assert.equal(result.status, "UNKNOWN");
    assert.deepEqual(result.reasons, ["DIAGNOSTIC_DESTINATION_COUNT_MISMATCH"]);
  }
});

test("M03 rejects a SUCCESS for the wrong destination identity", async () => {
  const result = await retrieveDataManagerStatus(
    "test-token",
    "diagnostic-m03-wrong-destination",
    EXPECTED,
    (async () => response({
      requestStatusPerDestination: [{
        destination: {
          reference: "wrong-reference",          operatingAccount: { accountType: "GOOGLE_ADS", accountId: "9999999999" },
          productDestinationId: "1111111111",
        },
        requestStatus: "SUCCESS",
        eventsIngestionStatus: { recordCount: 1 },
      }],
    })) as FetchLike
  );
  assert.equal(result.status, "UNKNOWN");
  assert.deepEqual(result.reasons, ["DIAGNOSTIC_DESTINATION_MISMATCH"]);
  assert.equal(result.recordCount, 1);
});

test("M03 rejects terminal record counts outside the one-event contract", async () => {
  for (const recordCount of [0, 2]) {
    const result = await retrieveDataManagerStatus(
      "test-token",
      `diagnostic-m03-count-${recordCount}`,
      EXPECTED,
      (async () => response({
        requestStatusPerDestination: [{
          destination: destination(),
          requestStatus: "SUCCESS",
          eventsIngestionStatus: { recordCount },
        }],
      })) as FetchLike
    );
    assert.equal(result.status, "UNKNOWN");
    assert.deepEqual(result.reasons, ["DIAGNOSTIC_RECORD_COUNT_MISMATCH"]);
  }
});

test("M03 preserves SUCCESS warning evidence", async () => {
  const result = await retrieveDataManagerStatus(
    "test-token",
    "diagnostic-m03-success-warning",
    EXPECTED,
    (async () => response({
      requestStatusPerDestination: [{
        destination: destination(),
        requestStatus: "SUCCESS",
        eventsIngestionStatus: { recordCount: 1 },
        warningInfo: {
          warningCounts: [{ reason: "PROCESSING_WARNING_REASON_M03" }],
        },
      }],
    })) as FetchLike
  );
  assert.equal(result.status, "SUCCESS");
  assert.equal(result.recordCount, 1);
  assert.deepEqual(result.warningReasons, ["PROCESSING_WARNING_REASON_M03"]);
});

const baseRow = (overrides: Partial<ConversionOutboxRow> = {}): ConversionOutboxRow => ({
  conversion_id: "m03-conversion-1",
  lead_token: "HY-M03TEST01",
  conversion_type: "verified_line_contact",
  event_timestamp: "2026-08-28T02:00:00.000Z",
  gclid: "m03-gclid",
  gbraid: null,
  wbraid: null,  attribution_touch: "last",
  transaction_id: "m03-transaction-1",
  destination_key: "HY_VERIFIED_LINE_CONTACT",
  status: "submitted",
  retry_count: 1,
  next_retry_at: null,
  last_error_code: null,
  created_at: NOW,
  sent_at: null,
  submitted_at: "2026-08-28T03:00:00.000Z",
  google_request_id: "m03-request-1",
  next_diagnostic_at: NOW,
  terminal_result: null,
  last_error_reason: null,
  diagnostic_status: null,
  diagnostic_record_count: null,
  diagnostic_error_reason: null,
  diagnostic_attempt_count: 0,
  updated_at: NOW,
  business_conversion_id: "m03-business-1",
  snapshot_version: 1,
  eligibility_rule_version: "v1",
  google_ads_account_id: "4801404246",
  google_ads_conversion_action_id: "7674301565",
  event_source: "MESSAGE",
  lease_generation: 1,
  lease_owner: "m03-owner",
  lease_expires_at: "2026-08-28T04:30:00.000Z",
  upload_payload_hash: "a".repeat(64),
  ...overrides,
});

test("M03 writes provider warning evidence into the durable ACK ledger", async () => {
  let capturedSql = "";
  let capturedArgs: unknown[] = [];
  const database = {
    prepare(sql: string) {
      capturedSql = sql;
      return {
        bind(...args: unknown[]) {
          capturedArgs = args;
          return { async run() { return { meta: { changes: 1 } }; } };
        },
      };
    },
  };
  const repository = new D1OutboxRepository(database as never);
  const warningJson = JSON.stringify({
    ingest: [{ field: "events[0]", reason: "WARNING_M03" }],
    diagnostic: [],
  });
  await repository.recordProviderAcknowledged(
    baseRow(),
    "attempt-m03-ack",
    "request-m03-ack",
    NOW,
    warningJson
  );
  assert.match(capturedSql, /provider_warning_json/);
  assert.equal(capturedArgs.at(-1), warningJson);
});

test("M03 production diagnostics fail closed without durable destination identity", async () => {
  let current = baseRow({
    google_ads_account_id: null,
    google_ads_conversion_action_id: null,
  });
  const repository: OutboxRepository = {
    async listDueUploads() { return []; },
    async claimUpload() { return null; },
    async listDueDiagnostics() { return [{ ...current }]; },
    async claimDiagnostic() { return { ...current }; },
    async cleanupTerminalRows() { return 0; },
    async save(row) { current = { ...row }; },
  };
  const env = {
    ATTRIBUTION_DB: undefined,
    GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON: undefined,
    GOOGLE_ADS_ACCOUNT_ID: "4801404246",
    GOOGLE_ADS_CONVERSION_ACTION_ID: "7674301565",
    GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "false",
    GOOGLE_OUTBOX_TERMINAL_RETENTION_DAYS: "90",
    UPLOADER_ENVIRONMENT: "production",
    PRODUCTION_HUMAN_GATE: "HUMAN_GATE_CONFIRMED",
  } as unknown as UploaderEnv;
  let providerCalls = 0;
  await runScheduledCycle(env, {
    repository,
    now: new Date(NOW),
    fetchImpl: (async () => { providerCalls += 1; throw new Error("provider must not be called"); }) as FetchLike,
  });  assert.equal(providerCalls, 0);
  assert.equal(current.status, "failed");
  assert.equal(current.terminal_result, "DIAGNOSTIC_PREREQUISITE_MISSING");
  assert.equal(current.last_error_reason, "DIAGNOSTIC_PREREQUISITE_MISSING");
});
