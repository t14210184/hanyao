import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { D1OutboxRepository } from "../src/repository.ts";
import {
  ingestDataManagerEvent,
  retrieveDataManagerStatus,
} from "../src/provider.ts";
import {
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
  assert.deepEqual(result.fieldWarnings, [
    {
      field: "events.events[0].optional_field",
      reason: "WARNING_REASON_TEST_ONLY",
    },
  ]);
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

  await runScheduledCycle(testEnv(serviceAccountJson), {
    repository,
    fetchImpl,
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
  assert.equal(calls.filter((url) => url === GOOGLE_OAUTH_TOKEN_URL).length, 1);
  assert.equal(
    calls.filter((url) => url.startsWith(GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL)).length,
    1
  );
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

test("D1 stale recovery uses one bounded update and distinguishes upload from diagnostic claims", async () => {
  let capturedSql = "";
  let capturedArgs: unknown[] = [];
  const database = {
    prepare(sql: string) {
      capturedSql = sql;
      return {
        bind(...args: unknown[]) {
          capturedArgs = args;
          return {
            async run() {
              return { meta: { changes: 2 } };
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
  assert.match(capturedSql, /status = CASE/);
  assert.match(capturedSql, /google_request_id IS NULL THEN 'pending'/);
  assert.match(capturedSql, /ELSE 'submitted'/);
  assert.match(capturedSql, /status = 'processing'/);
  assert.match(capturedSql, /updated_at <= \?1/);
  assert.match(capturedSql, /LIMIT \?3/);
  assert.deepEqual(capturedArgs, ["2026-08-28T03:30:00.000Z", NOW, 5]);
});
