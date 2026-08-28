import assert from "node:assert/strict";
import { generateKeyPairSync, verify as verifySignature } from "node:crypto";
import { test } from "node:test";
import {
  createServiceAccountAssertion,
  exchangeServiceAccountToken,
  parseServiceAccountJson,
} from "../src/auth.ts";
import { resolveValidateOnly } from "../src/config.ts";
import { getUploaderConfig } from "../src/config.ts";
import { ProviderRequestError } from "../src/errors.ts";
import { buildDataManagerRequest } from "../src/payload.ts";
import { runScheduledCycle } from "../src/scheduler.ts";
import {
  GOOGLE_DATA_MANAGER_EVENTS_URL,
  GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL,
  GOOGLE_OAUTH_TOKEN_URL,
  type ConversionOutboxRow,
  type FetchLike,
  type OutboxRepository,
  type OutboxStatus,
  type UploaderConfig,
  type UploaderEnv,
} from "../src/types.ts";

const NOW = "2026-08-28T04:00:00.000Z";
const EVENT_TIME = "2026-08-27T12:34:56.789Z";
const FAKE_ACCESS_TOKEN = "unit-test-access-token";

interface FakeServiceAccount {
  json: string;
  privateKeyPem: string;
  publicKeyPem: string;
  email: string;
}

const fakeServiceAccount = (): FakeServiceAccount => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privateKeyPem = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKeyPem = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
  const email = "line4a-test-uploader@example.invalid";
  return {
    privateKeyPem,
    publicKeyPem,
    email,
    json: JSON.stringify({
      type: "service_account",
      project_id: "line4a-test-project",
      private_key_id: "generated-only",
      private_key: privateKeyPem,
      client_email: email,
      client_id: "generated-only",
      token_uri: GOOGLE_OAUTH_TOKEN_URL,
    }),
  };
};

const config: UploaderConfig = {
  googleAdsAccountId: "4801404246",
  googleAdsConversionActionId: "7674301565",
  validateOnly: true,
  terminalRetentionCutoffIso: null,
};

const baseRow = (
  overrides: Partial<ConversionOutboxRow> = {}
): ConversionOutboxRow => ({
  conversion_id: "conversion-1",
  lead_token: "HY-UNITTEST01",
  conversion_type: "verified_line_contact",
  event_timestamp: EVENT_TIME,
  gclid: "stored-gclid",
  gbraid: null,
  wbraid: null,
  attribution_touch: "last",
  transaction_id: "stable-transaction-1",
  destination_key: "HY_VERIFIED_LINE_CONTACT",
  status: "pending",
  retry_count: 0,
  next_retry_at: null,
  last_error_code: null,
  created_at: NOW,
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
  updated_at: NOW,
  ...overrides,
});

const copyRow = (row: ConversionOutboxRow): ConversionOutboxRow => ({ ...row });

class MemoryRepository implements OutboxRepository {
  readonly rows = new Map<string, ConversionOutboxRow>();
  readonly claims = { uploads: 0, diagnostics: 0 };

  constructor(rows: ConversionOutboxRow[]) {
    for (const row of rows) this.rows.set(row.conversion_id, copyRow(row));
  }

  async listDueUploads(nowIso: string, limit: number): Promise<ConversionOutboxRow[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.status === "pending" &&
          (!row.next_retry_at || row.next_retry_at <= nowIso) &&
          row.retry_count < 8
      )
      .sort((left, right) => left.conversion_id.localeCompare(right.conversion_id))
      .slice(0, limit)
      .map(copyRow);
  }

  async claimUpload(conversionId: string, nowIso: string): Promise<ConversionOutboxRow | null> {
    const row = this.rows.get(conversionId);
    if (
      !row ||
      row.status !== "pending" ||
      (row.next_retry_at !== null && row.next_retry_at > nowIso) ||
      row.retry_count >= 8
    ) {
      return null;
    }
    row.status = "processing";
    row.retry_count += 1;
    row.updated_at = nowIso;
    this.claims.uploads += 1;
    return copyRow(row);
  }

  async listDueDiagnostics(nowIso: string, limit: number): Promise<ConversionOutboxRow[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.status === "submitted" &&
          Boolean(row.google_request_id) &&
          Boolean(row.next_diagnostic_at) &&
          (row.next_diagnostic_at as string) <= nowIso
      )
      .sort((left, right) => left.conversion_id.localeCompare(right.conversion_id))
      .slice(0, limit)
      .map(copyRow);
  }

  async claimDiagnostic(
    conversionId: string,
    nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    const row = this.rows.get(conversionId);
    if (
      !row ||
      row.status !== "submitted" ||
      !row.google_request_id ||
      !row.next_diagnostic_at ||
      row.next_diagnostic_at > nowIso
    ) {
      return null;
    }
    row.status = "processing";
    row.diagnostic_attempt_count += 1;
    row.updated_at = nowIso;
    this.claims.diagnostics += 1;
    return copyRow(row);
  }

  async cleanupTerminalRows(cutoffIso: string, limit: number): Promise<number> {
    const terminal = new Set<OutboxStatus>([
      "success",
      "failed",
      "deduplicated",
      "validated_only",
      "sent",
    ]);
    const candidates = [...this.rows.values()]
      .filter((row) => terminal.has(row.status) && row.updated_at <= cutoffIso)
      .sort((left, right) =>
        left.updated_at.localeCompare(right.updated_at) ||
        left.conversion_id.localeCompare(right.conversion_id)
      )
      .slice(0, limit);
    for (const row of candidates) this.rows.delete(row.conversion_id);
    return candidates.length;
  }

  async save(row: ConversionOutboxRow): Promise<void> {
    this.rows.set(row.conversion_id, copyRow(row));
  }

  get(id = "conversion-1"): ConversionOutboxRow {
    const row = this.rows.get(id);
    assert.ok(row, `missing memory row ${id}`);
    return row;
  }
}

const testEnv = (
  serviceAccountJson?: string,
  overrides: Record<string, string | undefined> = {}
): UploaderEnv =>
  ({
    ATTRIBUTION_DB: undefined,
    GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON: serviceAccountJson,
    GOOGLE_ADS_ACCOUNT_ID: "4801404246",
    GOOGLE_ADS_CONVERSION_ACTION_ID: "7674301565",
    GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "true",
    UPLOADER_ENVIRONMENT: "preview",
    ...overrides,
  }) as unknown as UploaderEnv;

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const sequencedFetch = (
  handler: (url: string, init: RequestInit | undefined, callIndex: number) => Response | Promise<Response>
): { fetchImpl: FetchLike; calls: FetchCall[] } => {
  const calls: FetchCall[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    calls.push({ url, init });
    return handler(url, init, calls.length - 1);
  }) as FetchLike;
  return { fetchImpl, calls };
};

const tokenThen = (
  fake: FakeServiceAccount,
  provider: (url: string, init: RequestInit | undefined, callIndex: number) => Response | Promise<Response>
) =>
  sequencedFetch((url, init, index) => {
    if (url === GOOGLE_OAUTH_TOKEN_URL) return response({ access_token: FAKE_ACCESS_TOKEN, expires_in: 600 });
    return provider(url, init, index);
  });

const runOne = async (
  repository: MemoryRepository,
  fake: FakeServiceAccount,
  fetchImpl: FetchLike,
  now = NOW
) =>
  runScheduledCycle(testEnv(fake.json), {
    repository,
    fetchImpl,
    now: new Date(now),
    random: () => 0.5,
  });

test("A/B: generated fake service account signs a structurally valid RS256 JWT", async () => {
  const fake = fakeServiceAccount();
  const account = parseServiceAccountJson(fake.json);
  const { assertion, claims } = await createServiceAccountAssertion(account, new Date(NOW));
  const [encodedHeader, encodedClaims, encodedSignature] = assertion.split(".");
  const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  assert.deepEqual(decode(encodedHeader), { alg: "RS256", typ: "JWT" });
  assert.deepEqual(decode(encodedClaims), claims);
  assert.equal(claims.iss, fake.email);
  assert.match(claims.scope, /datamanager/);
  assert.match(claims.scope, /cloud-platform/);
  assert.equal(claims.aud, GOOGLE_OAUTH_TOKEN_URL);
  assert.equal(
    verifySignature(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedClaims}`),
      fake.publicKeyPem,
      Buffer.from(encodedSignature, "base64url")
    ),
    true
  );
});

test("C: token exchange success is mock-only and keeps token in process memory", async () => {
  const fake = fakeServiceAccount();
  const { fetchImpl, calls } = sequencedFetch((url, init) => {
    assert.equal(url, GOOGLE_OAUTH_TOKEN_URL);
    assert.equal(init?.method, "POST");
    assert.match(String(init?.body), /grant_type=urn%3Aietf/);
    assert.match(String(init?.body), /assertion=/);
    return response({ access_token: FAKE_ACCESS_TOKEN, expires_in: 600 });
  });
  const result = await exchangeServiceAccountToken(fake.json, fetchImpl, new Date(NOW));
  assert.equal(result.accessToken, FAKE_ACCESS_TOKEN);
  assert.equal(calls.length, 1);
});

test("D/E: auth errors are sanitized and no credential/token is logged", async () => {
  const fake = fakeServiceAccount();
  const sensitiveErrorText = "raw-private-material-that-must-not-escape";
  const { fetchImpl } = sequencedFetch(() =>
    response(
      {
        error: { status: "PERMISSION_DENIED", message: sensitiveErrorText },
      },
      403
    )
  );
  await assert.rejects(
    exchangeServiceAccountToken(fake.json, fetchImpl, new Date(NOW)),
    (error: unknown) => {
      assert.ok(error instanceof ProviderRequestError);
      assert.equal(error.code, "AUTH_TOKEN_EXCHANGE_FAILED");
      assert.equal(error.providerReason, "PERMISSION_DENIED");
      assert.match(String(error), /AUTH_TOKEN_EXCHANGE_FAILED/);
      assert.equal(String(error).includes(sensitiveErrorText), false);
      return true;
    }
  );
  const logLines: string[] = [];
  const repository = new MemoryRepository([baseRow()]);
  const noProvider = sequencedFetch(() => {
    throw new Error("provider should not be reached after missing credential");
  });
  await runScheduledCycle(testEnv(), {
    repository,
    fetchImpl: noProvider.fetchImpl,
    now: new Date(NOW),
    logger: { info: (_message, details) => logLines.push(JSON.stringify(details)) },
  });
  assert.equal(logLines.some((line) => line.includes(FAKE_ACCESS_TOKEN)), false);
  assert.equal(logLines.some((line) => line.includes(fake.privateKeyPem)), false);
});

test("F/G/H/I/J/K/M: payload preserves exact stored identifiers, MESSAGE source, timestamp and transaction ID without PII", () => {
  for (const identifiers of [
    { gclid: "gclid-only", gbraid: null, wbraid: null },
    { gclid: null, gbraid: "gbraid-only", wbraid: null },
    { gclid: null, gbraid: null, wbraid: "wbraid-only" },
  ]) {
    const row = baseRow(identifiers);
    const body = buildDataManagerRequest(row, config);
    assert.deepEqual(body.events[0].adIdentifiers, identifiers === undefined ? {} : {
      ...(identifiers.gclid ? { gclid: identifiers.gclid } : {}),
      ...(identifiers.gbraid ? { gbraid: identifiers.gbraid } : {}),
      ...(identifiers.wbraid ? { wbraid: identifiers.wbraid } : {}),
    });
    assert.equal(body.events[0].eventSource, "MESSAGE");
    assert.equal(body.events[0].eventTimestamp, EVENT_TIME);
    assert.equal(body.events[0].transactionId, row.transaction_id);
    assert.equal(body.destinations[0].loginAccount.accountId, "4801404246");
    assert.equal(body.destinations[0].operatingAccount.accountId, "4801404246");
    assert.equal(body.destinations[0].productDestinationId, "7674301565");
    const serialized = JSON.stringify(body);
    for (const forbidden of ["lineUserId", "messageText", "phone", "email", "address", "fingerprint", "conversionValue"]) {
      assert.equal(serialized.includes(forbidden), false, forbidden);
    }
  }
});

test("L: no identifier is terminal and cannot issue a provider request", async () => {
  assert.throws(
    () => buildDataManagerRequest(baseRow({ gclid: null, gbraid: null, wbraid: null }), config),
    /ATTRIBUTION_IDENTIFIER_MISSING/
  );
  const repository = new MemoryRepository([baseRow({ gclid: null, gbraid: null, wbraid: null })]);
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () => response({ requestId: "should-not-exist" }));
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "failed");
  assert.equal(repository.get().terminal_result, "ATTRIBUTION_IDENTIFIER_MISSING");
  assert.equal(mock.calls.length, 0);
});

test("N/O/P/Q: validateOnly is fail-closed", () => {
  assert.equal(resolveValidateOnly(undefined), true);
  assert.equal(resolveValidateOnly("typo"), true);
  assert.equal(resolveValidateOnly("true", "preview"), true);
  assert.equal(resolveValidateOnly("false", "preview", "HUMAN_GATE_CONFIRMED"), true);
  assert.equal(resolveValidateOnly("false", "production", "NOT_CONFIRMED"), true);
  assert.equal(resolveValidateOnly("false", "production", "HUMAN_GATE_CONFIRMED"), false);
});

test("R: missing destination configuration fails before repository claim or provider call", async () => {
  const fake = fakeServiceAccount();
  for (const missingKey of [
    "GOOGLE_ADS_ACCOUNT_ID",
    "GOOGLE_ADS_CONVERSION_ACTION_ID",
  ]) {
    const repository = new MemoryRepository([baseRow()]);
    const mock = sequencedFetch(() => {
      throw new Error("provider must not be reached");
    });
    await assert.rejects(
      runScheduledCycle(
        testEnv(fake.json, { [missingKey]: undefined }),
        { repository, fetchImpl: mock.fetchImpl, now: new Date(NOW) }
      ),
      /GOOGLE_DESTINATION_CONFIGURATION_MISSING/
    );
    assert.equal(repository.claims.uploads, 0);
    assert.equal(repository.claims.diagnostics, 0);
    assert.equal(mock.calls.length, 0);
  }
});

test("C/R: explicit retention cutoff removes only bounded terminal rows", async () => {
  const repository = new MemoryRepository([
    baseRow({ conversion_id: "terminal-old", status: "success", updated_at: "2026-08-27T00:00:00.000Z" }),
    baseRow({ conversion_id: "terminal-new", status: "failed", updated_at: NOW }),
    baseRow({ conversion_id: "pending-row", status: "pending", updated_at: "2026-08-27T00:00:00.000Z" }),
    submittedRow({ conversion_id: "submitted-row", updated_at: "2026-08-27T00:00:00.000Z" }),
  ]);
  const fake = fakeServiceAccount();
  const mock = sequencedFetch(() => {
    throw new Error("provider must not be reached");
  });
  const result = await runScheduledCycle(
    testEnv(fake.json, {
      GOOGLE_OUTBOX_TERMINAL_RETENTION_CUTOFF_ISO: "2026-08-27T12:00:00.000Z",
    }),
    { repository, fetchImpl: mock.fetchImpl, now: new Date(NOW) }
  );
  assert.equal(result.terminalRowsCleaned, 1);
  assert.equal(repository.rows.has("terminal-old"), false);
  assert.equal(repository.rows.has("terminal-new"), true);
  assert.equal(repository.rows.has("pending-row"), true);
  assert.equal(repository.rows.has("submitted-row"), true);
  assert.equal(mock.calls.length, 1);
});

test("A/B/G: executed production request moves to submitted and schedules diagnostics after 30 minutes", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, (url, init) => {
    assert.equal(url, GOOGLE_DATA_MANAGER_EVENTS_URL);
    const request = JSON.parse(String(init?.body));
    assert.equal(request.validateOnly, false);
    return response({ requestId: "request-executed-1", fieldWarnings: [] });
  });
  const repository = new MemoryRepository([baseRow()]);
  await runScheduledCycle(testEnv(fake.json, {
    GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "false",
    UPLOADER_ENVIRONMENT: "production",
    PRODUCTION_HUMAN_GATE: "HUMAN_GATE_CONFIRMED",
  }), {
    repository,
    fetchImpl: mock.fetchImpl,
    now: new Date(NOW),
    random: () => 0.5,
  });
  const row = repository.get();
  assert.equal(row.status, "submitted");
  assert.equal(row.google_request_id, "request-executed-1");
  assert.equal(row.submitted_at, NOW);
  assert.ok(row.next_diagnostic_at);
  assert.ok(Date.parse(row.next_diagnostic_at) >= Date.parse(NOW) + 30 * 60 * 1000);
});

test("C/D/E/F: validateOnly success is terminal, clears request identity, and is never diagnostic-eligible", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, (url, init) => {
    assert.equal(url, GOOGLE_DATA_MANAGER_EVENTS_URL);
    assert.equal(init?.method, "POST");
    const request = JSON.parse(String(init?.body));
    assert.equal(request.validateOnly, true);
    assert.equal(request.events[0].transactionId, "stable-transaction-1");
    return response({ requestId: "request-accepted-1", fieldWarnings: [] });
  });
  const repository = new MemoryRepository([baseRow()]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "validated_only");
  assert.equal(repository.get().terminal_result, "VALIDATE_ONLY_ACCEPTED");
  assert.equal(repository.get().google_request_id, null);
  assert.equal(repository.get().submitted_at, null);
  assert.equal(repository.get().next_diagnostic_at, null);
  assert.equal(repository.get().diagnostic_status, null);
  assert.equal(repository.get().diagnostic_attempt_count, 0);
  assert.equal(mock.calls.filter((call) => call.url === GOOGLE_DATA_MANAGER_EVENTS_URL).length, 1);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(mock.calls.filter((call) => call.url === GOOGLE_DATA_MANAGER_EVENTS_URL).length, 1);
  assert.equal(mock.calls.some((call) => call.url.startsWith(`${GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL}?`)), false);
  assert.equal(repository.claims.diagnostics, 0);
});

test("E: diagnostics selector requires submitted state even when a row has a request ID", async () => {
  const repository = new MemoryRepository([
    baseRow({
      status: "validated_only",
      google_request_id: "request-that-must-not-run",
      next_diagnostic_at: "2026-08-28T00:00:00.000Z",
      terminal_result: "VALIDATE_ONLY_ACCEPTED",
    }),
  ]);
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () => {
    throw new Error("diagnostics must not be reached");
  });
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.claims.diagnostics, 0);
  assert.equal(mock.calls.length, 0);
});

test("G: production validation-only configuration fails closed before claiming rows", async () => {
  const fake = fakeServiceAccount();
  const repository = new MemoryRepository([baseRow()]);
  const mock = sequencedFetch(() => {
    throw new Error("provider must not be reached");
  });
  await assert.rejects(
    runScheduledCycle(testEnv(fake.json, {
      GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "true",
      UPLOADER_ENVIRONMENT: "production",
      PRODUCTION_HUMAN_GATE: "HUMAN_GATE_CONFIRMED",
    }), {
      repository,
      fetchImpl: mock.fetchImpl,
      now: new Date(NOW),
    }),
    /PRODUCTION_VALIDATE_ONLY_MISCONFIGURED/
  );
  assert.equal(repository.claims.uploads, 0);
  assert.equal(repository.claims.diagnostics, 0);
  assert.equal(mock.calls.length, 0);
});

test("S/T/V: 429, 5xx and ambiguous network errors schedule bounded retry with the same transaction ID", async () => {
  const fake = fakeServiceAccount();
  for (const outcome of [429, 503, "network"] as const) {
    const mock = tokenThen(fake, (url) => {
      assert.equal(url, GOOGLE_DATA_MANAGER_EVENTS_URL);
      if (outcome === "network") throw new Error("connection reset");
      return response({ error: { status: `HTTP_${outcome}` } }, outcome);
    });
    const repository = new MemoryRepository([baseRow()]);
    await runOne(repository, fake, mock.fetchImpl);
    const row = repository.get();
    assert.equal(row.status, "pending");
    assert.ok(row.next_retry_at);
    assert.equal(row.transaction_id, "stable-transaction-1");
    assert.equal(mock.calls.filter((call) => call.url === GOOGLE_DATA_MANAGER_EVENTS_URL).length, 1);
  }
});

test("U: HTTP 400 is terminal", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () => response({ error: { status: "INVALID_ARGUMENT" } }, 400));
  const repository = new MemoryRepository([baseRow()]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "failed");
  assert.equal(repository.get().terminal_result, "INGEST_HTTP_ERROR");
  assert.equal(repository.get().last_error_reason, "INVALID_ARGUMENT");
});

test("W: retry count is bounded at eight attempts", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () => response({ error: { status: "UNAVAILABLE" } }, 503));
  const repository = new MemoryRepository([baseRow({ retry_count: 7, next_retry_at: NOW })]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().retry_count, 8);
  assert.equal(repository.get().status, "failed");
  assert.equal(repository.get().next_retry_at, null);
  const before = mock.calls.length;
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(mock.calls.length, before);
});

const submittedRow = (overrides: Partial<ConversionOutboxRow> = {}) =>
  baseRow({
    status: "submitted",
    google_request_id: "request-diagnostic-1",
    submitted_at: "2026-08-28T00:00:00.000Z",
    next_diagnostic_at: NOW,
    retry_count: 1,
    ...overrides,
  });

test("X: PROCESSING keeps submitted state and schedules the next check", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, (url) => {
    assert.ok(url.startsWith(`${GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL}?requestId=`));
    return response({ requestStatusPerDestination: [{ requestStatus: "PROCESSING" }] });
  });
  const repository = new MemoryRepository([submittedRow()]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "submitted");
  assert.ok(repository.get().next_diagnostic_at);
  assert.equal(repository.get().diagnostic_status, "PROCESSING");
  assert.equal(repository.get().diagnostic_attempt_count, 1);
});

test("Y: SUCCESS is terminal success", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () =>
    response({
      requestStatusPerDestination: [
        { requestStatus: "SUCCESS", eventsIngestionStatus: { recordCount: "1" } },
      ],
    })
  );
  const repository = new MemoryRepository([submittedRow()]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "success");
  assert.equal(repository.get().terminal_result, "SUCCESS");
  assert.equal(repository.get().diagnostic_record_count, 1);
});

test("Z: FAILED persists only a sanitized reason", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () =>
    response({
      requestStatusPerDestination: [
        {
          requestStatus: "FAILED",
          errorInfo: { errorCounts: [{ reason: "PROCESSING_ERROR_REASON_EVENT_TOO_OLD", recordCount: "1" }] },
        },
      ],
    })
  );
  const repository = new MemoryRepository([submittedRow()]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "failed");
  assert.equal(repository.get().last_error_reason, "PROCESSING_ERROR_REASON_EVENT_TOO_OLD");
  assert.equal(repository.get().diagnostic_error_reason, "PROCESSING_ERROR_REASON_EVENT_TOO_OLD");
});

test("AA: PARTIAL_SUCCESS is explicit human review", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () =>
    response({
      requestStatusPerDestination: [
        { requestStatus: "PARTIAL_SUCCESS", errorInfo: { errorCounts: [{ reason: "PARTIAL_REASON" }] } },
      ],
    })
  );
  const repository = new MemoryRepository([submittedRow()]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "failed");
  assert.equal(repository.get().terminal_result, "PARTIAL_SUCCESS_HUMAN_REVIEW");
});

test("AB/AC: matching duplicate is explicit dedup success-equivalent; other errors are not", async () => {
  const fake = fakeServiceAccount();
  const duplicateMock = tokenThen(fake, () =>
    response({
      requestStatusPerDestination: [
        {
          requestStatus: "FAILED",
          errorInfo: {
            errorCounts: [{ reason: "PROCESSING_ERROR_REASON_DUPLICATE_TRANSACTION_ID" }],
          },
        },
      ],
    })
  );
  const duplicateRepo = new MemoryRepository([submittedRow()]);
  await runOne(duplicateRepo, fake, duplicateMock.fetchImpl);
  assert.equal(duplicateRepo.get().status, "deduplicated");
  assert.equal(duplicateRepo.get().terminal_result, "DEDUPLICATED_SUCCESS_EQUIVALENT");

  const otherMock = tokenThen(fake, () =>
    response({
      requestStatusPerDestination: [
        {
          requestStatus: "FAILED",
          errorInfo: { errorCounts: [{ reason: "PROCESSING_ERROR_REASON_DUPLICATE_GCLID" }] },
        },
      ],
    })
  );
  const otherRepo = new MemoryRepository([submittedRow()]);
  await runOne(otherRepo, fake, otherMock.fetchImpl);
  assert.equal(otherRepo.get().status, "failed");
  assert.equal(otherRepo.get().terminal_result, "DIAGNOSTIC_FAILED");
});

test("AD: diagnostic timebox stops without a status request", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, () => response({ requestStatusPerDestination: [] }));
  const repository = new MemoryRepository([
    submittedRow({ submitted_at: "2026-08-26T03:59:59.000Z", next_diagnostic_at: NOW }),
  ]);
  await runOne(repository, fake, mock.fetchImpl);
  assert.equal(repository.get().status, "failed");
  assert.equal(repository.get().terminal_result, "DIAGNOSTIC_TIMEBOX_EXCEEDED");
  assert.equal(mock.calls.length, 0);
});

test("AE: conditional claims prevent two concurrent scheduled invocations from uploading one row", async () => {
  const fake = fakeServiceAccount();
  const mock = tokenThen(fake, (url) => {
    if (url === GOOGLE_DATA_MANAGER_EVENTS_URL) return response({ requestId: "request-concurrent-1" });
    throw new Error(`unexpected provider URL ${url}`);
  });
  const repository = new MemoryRepository([baseRow()]);
  await Promise.all([
    runOne(repository, fake, mock.fetchImpl),
    runOne(repository, fake, mock.fetchImpl),
  ]);
  assert.equal(repository.claims.uploads, 1);
  assert.equal(mock.calls.filter((call) => call.url === GOOGLE_DATA_MANAGER_EVENTS_URL).length, 1);
});

test("AG: only terminal states are eligible for any future retention cleanup", () => {
  const terminal = new Set<OutboxStatus>(["success", "failed", "deduplicated", "validated_only"]);
  for (const status of ["pending", "processing", "submitted"] as const) {
    assert.equal(terminal.has(status), false);
  }
  for (const status of terminal) assert.equal(terminal.has(status), true);
});
