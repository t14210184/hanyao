import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { D1OutboxRepository } from "../src/repository.ts";
import { ProviderRequestError } from "../src/errors.ts";
import {
  ingestDataManagerEvent,
  retrieveDataManagerStatus,
} from "../src/provider.ts";
import {
  nextDiagnosticAt,
  nextTooRecentRetryAt,
  runScheduledCycle,
  TOO_RECENT_CLICK_REASON,
} from "../src/scheduler.ts";
import type { DataManagerIngestRequest } from "../src/payload.ts";
import {
  GOOGLE_DATA_MANAGER_EVENTS_URL,
  GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL,
  GOOGLE_OAUTH_TOKEN_URL,
  type ConversionOutboxRow,
  type FetchLike,
  type OutboxRepository,
  type UploaderEnv,
} from "../src/types.ts";

const NOW = "2026-08-28T04:00:00.000Z";
const EVENT_TIME = "2026-08-28T02:00:00.000Z";
const FAKE_ACCESS_TOKEN = "hardening-test-access-token";

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const fakeServiceAccountJson = (): string => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privateKeyPem = pair.privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();
  return JSON.stringify({
    type: "service_account",
    project_id: "hardening-test-project",
    private_key_id: "generated-only",
    private_key: privateKeyPem,
    client_email: "hardening-test-uploader@example.invalid",
    client_id: "generated-only",
    token_uri: GOOGLE_OAUTH_TOKEN_URL,
  });
};

const baseRow = (
  overrides: Partial<ConversionOutboxRow> = {}
): ConversionOutboxRow => ({
  conversion_id: "hardening-conversion-1",
  lead_token: "HY-HARDENING1",
  conversion_type: "verified_line_contact",
  event_timestamp: EVENT_TIME,
  gclid: "hardening-gclid",
  gbraid: null,
  wbraid: null,
  attribution_touch: "last",
  transaction_id: "hardening-transaction-1",
  destination_key: "HY_VERIFIED_LINE_CONTACT",
  status: "submitted",
  retry_count: 1,
  next_retry_at: null,
  last_error_code: null,
  created_at: EVENT_TIME,
  sent_at: null,
  submitted_at: "2026-08-28T03:00:00.000Z",
  google_request_id: "hardening-request-1",
  next_diagnostic_at: NOW,
  terminal_result: null,
  last_error_reason: null,
  diagnostic_status: null,
  diagnostic_record_count: null,
  diagnostic_error_reason: null,
  diagnostic_attempt_count: 0,
  updated_at: "2026-08-28T03:00:00.000Z",
  ...overrides,
});

class DiagnosticMemoryRepository implements OutboxRepository {
  row: ConversionOutboxRow;
  recoveryCalls: Array<{ staleBeforeIso: string; nowIso: string; limit: number }> = [];

  constructor(row: ConversionOutboxRow) {
    this.row = { ...row };
  }

  async recoverStaleClaims(
    staleBeforeIso: string,
    nowIso: string,
    limit: number
  ): Promise<number> {
    this.recoveryCalls.push({ staleBeforeIso, nowIso, limit });
    return 0;
  }

  async listDueUploads(): Promise<ConversionOutboxRow[]> {
    return [];
  }

  async claimUpload(): Promise<ConversionOutboxRow | null> {
    return null;
  }

  async listDueDiagnostics(
    nowIso: string,
    limit: number
  ): Promise<ConversionOutboxRow[]> {
    if (
      this.row.status === "submitted" &&
      this.row.google_request_id &&
      this.row.next_diagnostic_at &&
      this.row.next_diagnostic_at <= nowIso
    ) {
      return [{ ...this.row }].slice(0, limit);
    }
    return [];
  }

  async claimDiagnostic(
    conversionId: string,
    nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    if (
      conversionId !== this.row.conversion_id ||
      this.row.status !== "submitted" ||
      !this.row.google_request_id ||
      !this.row.next_diagnostic_at ||
      this.row.next_diagnostic_at > nowIso
    ) {
      return null;
    }
    this.row.status = "processing";
    this.row.diagnostic_attempt_count += 1;
    this.row.updated_at = nowIso;
    return { ...this.row };
  }

  async cleanupTerminalRows(): Promise<number> {
    return 0;
  }

  async save(row: ConversionOutboxRow): Promise<void> {
    this.row = { ...row };
  }
}

const testEnv = (serviceAccountJson: string): UploaderEnv =>
  ({
    ATTRIBUTION_DB: undefined,
    GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON: serviceAccountJson,
    GOOGLE_ADS_ACCOUNT_ID: "4801404246",
    GOOGLE_ADS_CONVERSION_ACTION_ID: "7674301565",
    GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "true",
    GOOGLE_OUTBOX_TERMINAL_RETENTION_DAYS: "90",
    UPLOADER_ENVIRONMENT: "preview",
  }) as unknown as UploaderEnv;

const tooRecentFetch = (serviceAccountJson: string) => {
  void serviceAccountJson;
  const calls: string[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = input.toString();
    calls.push(url);
    if (url === GOOGLE_OAUTH_TOKEN_URL) {
      return response({ access_token: FAKE_ACCESS_TOKEN, expires_in: 600 });
    }
    if (url.startsWith(GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL)) {
      return response({
        requestStatusPerDestination: [
          {
            requestStatus: "FAILED",
            errorInfo: {
              errorCounts: [{ reason: TOO_RECENT_CLICK_REASON, recordCount: "1" }],
            },
          },
        ],
      });
    }
    throw new Error(`unexpected URL ${url}`);
  }) as FetchLike;
  return { calls, fetchImpl };
};

test("ingest preserves sanitized fieldWarnings next to requestId", async () => {
  const fetchImpl = (async (input: RequestInfo | URL) => {
    assert.equal(input.toString(), GOOGLE_DATA_MANAGER_EVENTS_URL);
    return response({
      requestId: "warning-request-1",
      fieldWarnings: [
        {
          field: "events.events[0].optional_field",
          description: "not persisted by the uploader",
          reason: "WARNING_REASON_TEST_ONLY",
        },
      ],
    });
  }) as FetchLike;

  const result = await ingestDataManagerEvent(
    "test-token",
    {} as DataManagerIngestRequest,
    fetchImpl
  );
  assert.equal(result.requestId, "warning-request-1");
  assert.equal(result.transportOutcome, "ACKNOWLEDGED");
  assert.deepEqual(result.fieldWarnings, [
    {
      field: "events.events[0].optional_field",
      reason: "WARNING_REASON_TEST_ONLY",
    },
  ]);
});

test("post-dispatch response body failure is RESULT_UNKNOWN and never a normal retry", async () => {
  let ingestCalls = 0;
  const fetchImpl = (async (input: RequestInfo | URL) => {
    assert.equal(input.toString(), GOOGLE_DATA_MANAGER_EVENTS_URL);
    ingestCalls += 1;
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error("SIMULATED_BODY_STREAM_FAILURE"));
      },
    });
    return new Response(stream, { status: 200 });
  }) as FetchLike;

  await assert.rejects(
    ingestDataManagerEvent(
      "test-token",
      { validateOnly: false } as DataManagerIngestRequest,
      fetchImpl
    ),
    (error: unknown) =>
      error instanceof ProviderRequestError &&
      error.code === "INGEST_RESPONSE_BODY_READ_ERROR" &&
      error.retryable === false &&
      error.dispatchState === "RESULT_UNKNOWN"
  );
  assert.equal(ingestCalls, 1);
});

test("diagnostics normalize FAILURE and preserve warning reasons", async () => {
  const fetchImpl = (async (input: RequestInfo | URL) => {
    assert.ok(input.toString().startsWith(GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL));
    return response({
      requestStatusPerDestination: [
        {
          requestStatus: "FAILURE",
          eventsIngestionStatus: { recordCount: "1" },
          errorInfo: {
            errorCounts: [{ reason: "PROCESSING_ERROR_REASON_TEST", recordCount: "1" }],
          },
          warningInfo: {
            warningCounts: [{ reason: "PROCESSING_WARNING_REASON_TEST", recordCount: "1" }],
          },
        },
      ],
    });
  }) as FetchLike;

  const result = await retrieveDataManagerStatus(
    "test-token",
    "diagnostic-request-1",
    fetchImpl
  );
  assert.equal(result.status, "FAILED");
  assert.deepEqual(result.reasons, ["PROCESSING_ERROR_REASON_TEST"]);
  assert.deepEqual(result.warningReasons, ["PROCESSING_WARNING_REASON_TEST"]);
  assert.equal(result.recordCount, 1);
});

test("SUCCESS with warningInfo stays success and remains observable", async () => {
  const fetchImpl = (async () =>
    response({
      requestStatusPerDestination: [
        {
          requestStatus: "SUCCESS",
          eventsIngestionStatus: { recordCount: 1 },
          warningInfo: {
            warningCounts: [{ reason: "PROCESSING_WARNING_REASON_OPTIONAL_FIELD" }],
          },
        },
      ],
    })) as FetchLike;
  const result = await retrieveDataManagerStatus(
    "test-token",
    "diagnostic-request-success-warning",
    fetchImpl
  );
  assert.equal(result.status, "SUCCESS");
  assert.deepEqual(result.warningReasons, [
    "PROCESSING_WARNING_REASON_OPTIONAL_FIELD",
  ]);
});

test("too-recent click is requeued without changing transaction identity", async () => {
  const serviceAccountJson = fakeServiceAccountJson();
  const repository = new DiagnosticMemoryRepository(baseRow());
  const mock = tooRecentFetch(serviceAccountJson);

  await runScheduledCycle(testEnv(serviceAccountJson), {
    repository,
    fetchImpl: mock.fetchImpl,
    now: new Date(NOW),
    random: () => 0.5,
  });

  assert.equal(repository.row.status, "pending");
  assert.equal(repository.row.transaction_id, "hardening-transaction-1");
  assert.equal(repository.row.google_request_id, null);
  assert.equal(repository.row.submitted_at, null);
  assert.equal(repository.row.next_diagnostic_at, null);
  assert.equal(repository.row.diagnostic_attempt_count, 0);
  assert.equal(repository.row.last_error_code, "TOO_RECENT_CLICK_RETRY_SCHEDULED");
  assert.equal(repository.row.last_error_reason, TOO_RECENT_CLICK_REASON);
  assert.equal(
    repository.row.next_retry_at,
    nextTooRecentRetryAt(EVENT_TIME, NOW)
  );
  assert.equal(repository.row.next_retry_at, "2026-08-28T08:00:00.000Z");
  assert.equal(mock.calls.filter((url) => url === GOOGLE_OAUTH_TOKEN_URL).length, 1);
  assert.equal(
    mock.calls.filter((url) => url.startsWith(GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL)).length,
    1
  );
});

test("too-recent click at upload retry ceiling becomes explicit terminal failure instead of a zombie pending row", async () => {
  const serviceAccountJson = fakeServiceAccountJson();
  const repository = new DiagnosticMemoryRepository(baseRow({ retry_count: 8 }));
  const mock = tooRecentFetch(serviceAccountJson);

  await runScheduledCycle(testEnv(serviceAccountJson), {
    repository,
    fetchImpl: mock.fetchImpl,
    now: new Date(NOW),
    random: () => 0.5,
  });

  assert.equal(repository.row.status, "failed");
  assert.equal(repository.row.transaction_id, "hardening-transaction-1");
  assert.equal(repository.row.next_retry_at, null);
  assert.equal(
    repository.row.terminal_result,
    "TOO_RECENT_CLICK_RETRY_BUDGET_EXHAUSTED"
  );
  assert.equal(
    repository.row.last_error_code,
    "TOO_RECENT_CLICK_RETRY_BUDGET_EXHAUSTED"
  );
  assert.equal(repository.row.last_error_reason, TOO_RECENT_CLICK_REASON);
});

test("scheduler invokes bounded stale-claim recovery before normal selection", async () => {
  const repository = new DiagnosticMemoryRepository(
    baseRow({ status: "success", next_diagnostic_at: null })
  );
  const serviceAccountJson = fakeServiceAccountJson();
  const fetchImpl = (async () => {
    throw new Error("provider should not be called");
  }) as FetchLike;

  const result = await runScheduledCycle(testEnv(serviceAccountJson), {
    repository,
    fetchImpl,
    now: new Date(NOW),
  });

  assert.equal(result.staleClaimsRecovered, 0);
  assert.deepEqual(repository.recoveryCalls, [
    {
      staleBeforeIso: "2026-08-28T03:30:00.000Z",
      nowIso: NOW,
      limit: 5,
    },
  ]);
});

test("D1 stale recovery restores unique durable ACK context before generic recovery", async () => {
  const capturedSql: string[] = [];
  const capturedArgs: unknown[][] = [];
  const database = {
    prepare(sql: string) {
      const index = capturedSql.push(sql) - 1;
      return {
        bind(...args: unknown[]) {
          capturedArgs[index] = args;
          return {
            async run() {
              return { meta: { changes: index === 1 ? 2 : 0 } };
            },
          };
        },
      };
    },
  };

  const repository = new D1OutboxRepository(database as never);
  const changed = await repository.recoverStaleClaims(
    "2026-08-28T03:30:00.000Z",
    NOW,
    5
  );

  assert.equal(changed, 2);
  assert.equal(capturedSql.length, 4);
  assert.match(capturedSql[0], /WITH ack_candidates/);
  assert.match(capturedSql[0], /provider_attempt_events/);
  assert.match(capturedSql[0], /ACKNOWLEDGED/);
  assert.match(capturedSql[0], /provider_request_id/);
  assert.match(capturedSql[0], /pa.transaction_id = co.transaction_id/);
  assert.match(capturedSql[0], /pa.destination_key = co.destination_key/);
  assert.match(capturedSql[0], /pa.payload_hash = co.upload_payload_hash/);
  assert.match(capturedSql[0], /COUNT\(DISTINCT pae.provider_request_id\) = 1/);
  assert.match(capturedSql[0], /LIMIT \?3/);
  assert.deepEqual(capturedArgs[0], ["2026-08-28T03:30:00.000Z", NOW, 5]);
  assert.match(capturedSql[1], /status = CASE/);
  assert.match(capturedSql[1], /provider_attempts pa/);
  assert.match(capturedSql[1], /RECONCILIATION_REQUIRED/);
  assert.deepEqual(capturedArgs[1], ["2026-08-28T03:30:00.000Z", NOW, 5, 8]);
  assert.match(capturedSql[2], /UPDATE business_conversions/);
  assert.deepEqual(capturedArgs[2], [NOW, 5]);
  assert.match(capturedSql[3], /UPDATE provider_delivery_leases/);
  assert.match(capturedSql[3], /lease_state = 'RECONCILIATION_REQUIRED'/);
  assert.deepEqual(capturedArgs[3], [NOW, 5]);
});


test("diagnostic backoff anchors each delay to the previous check, not the original submission", () => {
  const t0 = "2026-08-28T00:00:00.000Z";
  const t1 = nextDiagnosticAt(t0, 0, () => 0);
  const t2 = nextDiagnosticAt(t1, 1, () => 0);
  const t3 = nextDiagnosticAt(t2, 2, () => 0);
  assert.equal(t1, "2026-08-28T00:30:00.000Z");
  assert.equal(t2, "2026-08-28T01:09:00.000Z");
  assert.equal(t3, "2026-08-28T01:59:42.000Z");
});

test("validateOnly ingest accepts a successful response without requestId", async () => {
  const fetchImpl = (async () => response({ fieldWarnings: [] })) as FetchLike;
  const result = await ingestDataManagerEvent(
    "test-token",
    { validateOnly: true } as DataManagerIngestRequest,
    fetchImpl
  );
  assert.equal(result.requestId, null);
});

test("stale lease owner cannot overwrite a newer nonterminal outbox state", async () => {
  const database = {
    prepare() {
      return {
        bind() {
          return { async run() { return { meta: { changes: 0 } }; } };
        },
      };
    },
  };
  const repository = new D1OutboxRepository(database as never);
  const row = baseRow({
    status: "submitted",
    terminal_result: null,
    updated_at: NOW,
    business_conversion_id: "business-hardening-1",
    lease_generation: 7,
    lease_owner: "expired-owner",
    lease_expires_at: "2026-08-28T04:30:00.000Z",
  });
  await assert.rejects(repository.save(row), /STALE_LEASE_FENCE/);
});

test("due upload selector requires canonical eligible business conversion", async () => {
  let capturedSql = "";
  const database = {
    prepare(sql: string) {
      capturedSql = sql;
      return {
        bind() {
          return { async all() { return { results: [] }; } };
        },
      };
    },
  };
  const repository = new D1OutboxRepository(database as never);
  assert.deepEqual(await repository.listDueUploads(NOW, 5), []);
  assert.match(capturedSql, /business_conversion_id IS NOT NULL/);
  assert.match(capturedSql, /eligibility_state = 'ELIGIBLE'/);
  assert.match(capturedSql, /outcome_state = 'PENDING'/);
});

test("duplicate delivery equivalence requires one exact durable acknowledged provider context", async () => {
  let capturedSql = "";
  let capturedArgs: unknown[] = [];
  const database = {
    prepare(sql: string) {
      capturedSql = sql;
      return {
        bind(...args: unknown[]) {
          capturedArgs = args;
          return {
            async first<T>() {
              return { context_count: 1, request_count: 1 } as T;
            },
          };
        },
      };
    },
  };
  const repository = new D1OutboxRepository(database as never);
  const row = baseRow({
    business_conversion_id: "business-duplicate-1",
    transaction_id: "transaction-duplicate-1",
    destination_key: "HY_VERIFIED_LINE_CONTACT",
    upload_payload_hash: "b".repeat(64),
    google_request_id: "requests/duplicate-context-1",
  });
  assert.equal(await repository.verifyProviderRequestContext(row), true);
  assert.match(capturedSql, /provider_attempts pa/);
  assert.match(capturedSql, /provider_attempt_events pae/);
  assert.match(capturedSql, /pa.transaction_id = \?2/);
  assert.match(capturedSql, /pa.destination_key = \?3/);
  assert.match(capturedSql, /pa.payload_hash = \?4/);
  assert.match(capturedSql, /pa.operation = 'events:ingest'/);
  assert.match(capturedSql, /pa.attempt_intent = 'DELIVER_CONVERSION'/);
  assert.match(capturedSql, /pae.event_type = 'ACKNOWLEDGED'/);
  assert.match(capturedSql, /pae.provider_request_id = \?5/);
  assert.deepEqual(capturedArgs, [
    "business-duplicate-1",
    "transaction-duplicate-1",
    "HY_VERIFIED_LINE_CONTACT",
    "b".repeat(64),
    "requests/duplicate-context-1",
  ]);
});

test("provider receipt save failure is not converted into a second provider failure write", async () => {
  const serviceAccountJson = fakeServiceAccountJson();
  const row = baseRow({
    status: "pending",
    retry_count: 0,
    submitted_at: null,
    google_request_id: null,
    next_diagnostic_at: null,
    business_conversion_id: "business-receipt-1",
    snapshot_version: 1,
    eligibility_rule_version: "v1",
    google_ads_account_id: "4801404246",
    google_ads_conversion_action_id: "7674301565",
    event_source: "MESSAGE",
    lease_generation: 0,
    lease_owner: null,
    lease_expires_at: null,
  });
  let current = { ...row };
  let saveCalls = 0;
  let ingestCalls = 0;
  const acknowledged: string[] = [];
  const repository: OutboxRepository = {
    async listDueUploads() { return [{ ...current }]; },
    async claimUpload(_id, nowIso) {
      current = {
        ...current,
        status: "processing",
        retry_count: 1,
        lease_generation: 1,
        lease_owner: "receipt-owner",
        lease_expires_at: "2026-08-28T04:30:00.000Z",
        updated_at: nowIso,
      };
      return { ...current };
    },
    async beginProviderAttempt() { return "attempt-receipt-1"; },
    async recordProviderAcknowledged(_row, attemptId, requestId) {
      acknowledged.push(`${attemptId}:${requestId}`);
    },
    async listDueDiagnostics() { return []; },
    async claimDiagnostic() { return null; },
    async cleanupTerminalRows() { return 0; },
    async save(saved) {
      saveCalls += 1;
      if (saved.status === "submitted") {
        throw new Error("SIMULATED_RECEIPT_SAVE_FAILURE");
      }
      current = { ...saved };
    },
  };
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url === GOOGLE_OAUTH_TOKEN_URL) {
      return response({ access_token: FAKE_ACCESS_TOKEN, expires_in: 600 });
    }
    if (url === GOOGLE_DATA_MANAGER_EVENTS_URL) {
      ingestCalls += 1;
      return response({ requestId: "receipt-request-1", fieldWarnings: [] });
    }
    throw new Error(`unexpected URL ${url}`);
  }) as FetchLike;
  const env = {
    ...testEnv(serviceAccountJson),
    GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "false",
    UPLOADER_ENVIRONMENT: "production",
    PRODUCTION_HUMAN_GATE: "HUMAN_GATE_CONFIRMED",
  };
  await assert.rejects(
    runScheduledCycle(env, {
      repository,
      fetchImpl,
      now: new Date(NOW),
      random: () => 0.5,
    }),
    /SIMULATED_RECEIPT_SAVE_FAILURE/
  );
  assert.equal(ingestCalls, 1);
  assert.deepEqual(acknowledged, ["attempt-receipt-1:receipt-request-1"]);
  assert.equal(saveCalls, 1);
  assert.equal(current.status, "processing");
  assert.equal(current.google_request_id, null);
});

test("provider attempt start persists intent event and delivery lease fence", async () => {
  const prepared: Array<{ sql: string; args: unknown[] }> = [];
  const database = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          const statement = { sql, args };
          prepared.push(statement);
          return statement;
        },
      };
    },
    async batch(statements: unknown[]) {
      assert.equal(statements.length, 4);
      return [
        { meta: { changes: 1 } },
        { meta: { changes: 1 } },
        { meta: { changes: 1 } },
        { meta: { changes: 1 } },
      ];
    },
  };
  const repository = new D1OutboxRepository(database as never);
  const row = baseRow({
    status: "processing",
    business_conversion_id: "business-attempt-1",
    lease_generation: 3,
    lease_owner: "owner-3",
    lease_expires_at: "2026-08-28T04:30:00.000Z",
    transaction_id: "attempt-transaction-1",
  });
  const payloadHash = "a".repeat(64);
  const attemptId = await repository.beginProviderAttempt(row, payloadHash, NOW);
  assert.match(attemptId, /^[0-9a-f-]{36}$/);
  assert.equal(prepared.length, 4);
  assert.match(prepared[0].sql, /INSERT INTO provider_attempts/);
  assert.match(prepared[0].sql, /DELIVER_CONVERSION/);
  assert.match(prepared[0].sql, /destination_key/);
  assert.match(prepared[0].sql, /payload_hash/);
  assert.equal(prepared[0].args[1], "business-attempt-1");
  assert.equal(prepared[0].args[2], "attempt-transaction-1");
  assert.equal(prepared[0].args[3], 3);
  assert.equal(prepared[0].args[6], "HY_VERIFIED_LINE_CONTACT");
  assert.equal(prepared[0].args[7], payloadHash);
  assert.match(prepared[1].sql, /ATTEMPT_STARTED/);
  assert.match(prepared[2].sql, /provider_delivery_leases/);
  assert.equal(prepared[2].args[0], "business-attempt-1");
  assert.equal(prepared[2].args[3], 3);
  assert.match(prepared[3].sql, /upload_payload_hash/);
  assert.equal(prepared[3].args[0], payloadHash);
  assert.equal(row.upload_payload_hash, payloadHash);
});

test("ambiguous ingest network result becomes reconciliation-required instead of pending retry", async () => {
  const serviceAccountJson = fakeServiceAccountJson();
  let current = baseRow({
    status: "pending",
    retry_count: 0,
    submitted_at: null,
    google_request_id: null,
    next_diagnostic_at: null,
    business_conversion_id: "business-unknown-1",
    snapshot_version: 1,
    eligibility_rule_version: "v1",
    google_ads_account_id: "4801404246",
    google_ads_conversion_action_id: "7674301565",
    event_source: "MESSAGE",
    lease_generation: 0,
    lease_owner: null,
    lease_expires_at: null,
  });
  let beginCalls = 0;
  let unknownCalls = 0;
  let saveCalls = 0;
  let ingestCalls = 0;
  const repository: OutboxRepository = {
    async listDueUploads() {
      return current.status === "pending" ? [{ ...current }] : [];
    },
    async claimUpload(_id, nowIso) {
      current = {
        ...current,
        status: "processing",
        retry_count: 1,
        lease_generation: 1,
        lease_owner: "unknown-owner",
        lease_expires_at: "2026-08-28T04:30:00.000Z",
        updated_at: nowIso,
      };
      return { ...current };
    },
    async listDueDiagnostics() { return []; },
    async claimDiagnostic() { return null; },
    async beginProviderAttempt() {
      beginCalls += 1;
      return "attempt-unknown-1";
    },
    async recordProviderUnknown(_row, attemptId, reason) {
      unknownCalls += 1;
      assert.equal(attemptId, "attempt-unknown-1");
      assert.equal(reason, "INGEST_NETWORK_ERROR");
    },
    async cleanupTerminalRows() { return 0; },
    async save(saved) {
      saveCalls += 1;
      current = { ...saved, lease_owner: null, lease_expires_at: null };
    },
  };
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url === GOOGLE_OAUTH_TOKEN_URL) {
      return response({ access_token: FAKE_ACCESS_TOKEN, expires_in: 600 });
    }
    if (url === GOOGLE_DATA_MANAGER_EVENTS_URL) {
      ingestCalls += 1;
      throw new Error("simulated ambiguous network result");
    }
    throw new Error(`unexpected URL ${url}`);
  }) as FetchLike;
  const env = {
    ...testEnv(serviceAccountJson),
    GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "false",
    UPLOADER_ENVIRONMENT: "production",
    PRODUCTION_HUMAN_GATE: "HUMAN_GATE_CONFIRMED",
  };
  await runScheduledCycle(env, {
    repository,
    fetchImpl,
    now: new Date(NOW),
    random: () => 0.5,
  });
  assert.equal(beginCalls, 1);
  assert.equal(unknownCalls, 1);
  assert.equal(ingestCalls, 1);
  assert.equal(saveCalls, 1);
  assert.equal(current.status, "failed");
  assert.equal(current.next_retry_at, null);
  assert.equal(current.terminal_result, "RECONCILIATION_REQUIRED");
  assert.equal(current.last_error_code, "INGEST_NETWORK_ERROR");

  await runScheduledCycle(env, {
    repository,
    fetchImpl,
    now: new Date("2026-08-28T04:05:00.000Z"),
    random: () => 0.5,
  });
  assert.equal(ingestCalls, 1, "RESULT_UNKNOWN must not be blindly resent");
});
