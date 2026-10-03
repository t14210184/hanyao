import assert from "node:assert/strict";
import test from "node:test";
import {
  API_URL,
  CUSTOMER_ID,
  CONVERSION_ACTION_ID,
  runGoogleAdsReportingMonitor,
} from "./line4d-google-ads-reporting-monitor.ts";
import {
  GOOGLE_ADS_READ_SCOPE,
  GOOGLE_ADS_REPORTING_LIMITS,
  type GoogleAdsReadScopeReceipt,
} from "./google-ads-read-scope.ts";

const FIXED_NOW = Date.parse("2026-10-04T00:00:00.000Z");

const makeValidReceipt = (
  overrides: Partial<GoogleAdsReadScopeReceipt> = {}
): GoogleAdsReadScopeReceipt => ({
  schema: "hanyao.google-ads.read-scope.v1",
  operation: "ADS_REPORTING_MONITOR_V1",
  approval_ref: "approval:monitor-test:20261004",
  custodian_ref: "custodian:monitor-test",
  credential_ref: "env:GOOGLE_ADS_ACCESS_TOKEN",
  google_cloud_project_id: "ads-read-project-123",
  google_cloud_project_api_access: "BASIC",
  project_access_evidence_ref: "cloud-console:ads-api-access",
  target_customer_id: CUSTOMER_ID,
  account_access: "DIRECT",
  login_customer_id: null,
  api_version: "v25",
  oauth_scope: GOOGLE_ADS_READ_SCOPE,
  read_only: true,
  raw_rows: false,
  max_queries: GOOGLE_ADS_REPORTING_LIMITS.maxQueries,
  max_rows: GOOGLE_ADS_REPORTING_LIMITS.maxRows,
  max_response_bytes: GOOGLE_ADS_REPORTING_LIMITS.maxResponseBytes,
  max_total_response_bytes: GOOGLE_ADS_REPORTING_LIMITS.maxTotalResponseBytes,
  expires_at_utc: "2026-10-04T01:00:00.000Z",
  credential_expires_at_utc: "2026-10-04T00:30:00.000Z",
  ...overrides,
});

test("import is side-effect free and does not execute network or exit process", () => {
  assert.equal(CUSTOMER_ID, "4801404246");
  assert.equal(CONVERSION_ACTION_ID, "7674301565");
  assert.ok(API_URL.includes("customers/4801404246/googleAds:searchStream"));
});

test("no auth input preserves SKIPPED_NO_PROVIDER_AUTH without network or token resolution", async () => {
  let tokenResolverCalled = false;
  let fetchCalled = false;

  const logs: string[] = [];
  const result = await runGoogleAdsReportingMonitor({
    env: {},
    resolveToken: async () => {
      tokenResolverCalled = true;
      throw new Error("Must not be called");
    },
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("Must not be called");
    },
    stdout: (msg) => logs.push(msg),
  });

  assert.equal(result.status, "SKIPPED_NO_PROVIDER_AUTH");
  assert.equal(tokenResolverCalled, false);
  assert.equal(fetchCalled, false);
  assert.ok(logs.includes("GOOGLE_ADS_REPORTING_MONITOR=SKIPPED_NO_PROVIDER_AUTH"));
});

test("auth present but missing receipt fails closed before token resolution or fetch", async () => {
  let tokenResolverCalled = false;
  let fetchCalled = false;
  const errors: string[] = [];

  const result = await runGoogleAdsReportingMonitor({
    env: { GOOGLE_ADS_ACCESS_TOKEN: "valid-token" },
    scopeReceipt: undefined,
    resolveToken: async () => {
      tokenResolverCalled = true;
      throw new Error("Must not be called");
    },
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("Must not be called");
    },
    stderr: (msg) => errors.push(msg),
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "ADS_READ_SCOPE_RECEIPT_MISSING_OR_OVERSIZED");
  assert.equal(tokenResolverCalled, false);
  assert.equal(fetchCalled, false);
});

test("auth present but expired receipt fails closed before token resolution or fetch", async () => {
  let tokenResolverCalled = false;
  let fetchCalled = false;

  const expiredReceipt = makeValidReceipt({
    expires_at_utc: "2026-10-03T23:59:00.000Z",
  });

  const result = await runGoogleAdsReportingMonitor({
    env: { GOOGLE_ADS_ACCESS_TOKEN: "valid-token" },
    scopeReceipt: expiredReceipt,
    now: () => FIXED_NOW,
    resolveToken: async () => {
      tokenResolverCalled = true;
      throw new Error("Must not be called");
    },
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("Must not be called");
    },
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "ADS_READ_SCOPE_RECEIPT_EXPIRED_OR_TOO_LONG");
  assert.equal(tokenResolverCalled, false);
  assert.equal(fetchCalled, false);
});

test("wrong target customer ID fails closed before token resolution or fetch", async () => {
  let tokenResolverCalled = false;
  let fetchCalled = false;

  const mismatchedReceipt = makeValidReceipt({
    target_customer_id: "9999999999",
  });

  const result = await runGoogleAdsReportingMonitor({
    env: { GOOGLE_ADS_ACCESS_TOKEN: "valid-token" },
    scopeReceipt: mismatchedReceipt,
    now: () => FIXED_NOW,
    resolveToken: async () => {
      tokenResolverCalled = true;
      throw new Error("Must not be called");
    },
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("Must not be called");
    },
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "ADS_READ_SCOPE_TARGET_MISMATCH");
  assert.equal(tokenResolverCalled, false);
  assert.equal(fetchCalled, false);
});

test("credential ref mismatch fails closed before token resolution or fetch", async () => {
  let tokenResolverCalled = false;
  let fetchCalled = false;

  const saReceipt = makeValidReceipt({
    credential_ref: "env:GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON",
    credential_expires_at_utc: null,
  });

  const result = await runGoogleAdsReportingMonitor({
    env: { GOOGLE_ADS_ACCESS_TOKEN: "direct-token-in-env" },
    scopeReceipt: saReceipt,
    now: () => FIXED_NOW,
    resolveToken: async () => {
      tokenResolverCalled = true;
      throw new Error("Must not be called");
    },
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("Must not be called");
    },
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "ADS_READ_SCOPE_CREDENTIAL_REF_MISMATCH");
  assert.equal(tokenResolverCalled, false);
  assert.equal(fetchCalled, false);
});

test("positive fixed read path with baseline and optional target date returns delta and evidence", async () => {
  const fetchCalls: Array<{ url: string; body: string; headers: Record<string, string> }> = [];

  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const bodyStr = String(init?.body ?? "");
    const headers = init?.headers as Record<string, string>;
    fetchCalls.push({ url, body: bodyStr, headers });

    if (bodyStr.includes("FROM conversion_action")) {
      const responsePayload = [
        {
          results: [
            {
              conversionAction: { id: CONVERSION_ACTION_ID },
              metrics: {
                allConversions: "12",
                conversionLastConversionDate: "2026-09-17",
                conversionLastReceivedRequestDateTime: "2026-09-17 14:00:00",
              },
            },
          ],
        },
      ];
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (bodyStr.includes("FROM customer")) {
      const responsePayload = [
        {
          results: [
            {
              segments: {
                date: "2026-09-17",
                conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
              },
              metrics: {
                allConversionsByConversionDate: 4,
              },
            },
          ],
        },
      ];
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    throw new Error(`Unexpected query: ${bodyStr}`);
  };

  const baselineSnapshot = {
    customerId: CUSTOMER_ID,
    conversionActionId: CONVERSION_ACTION_ID,
    allConversions: 10,
    lastConversionDate: "2026-09-16",
    lastReceivedRequestDateTime: "2026-09-16 12:00:00",
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-direct-token",
      GOOGLE_ADS_REPORTING_TARGET_DATE: "2026-09-17",
      GOOGLE_ADS_REPORTING_BASELINE_JSON: JSON.stringify(baselineSnapshot),
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-direct-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "SUCCESS");
  if (result.status === "SUCCESS") {
    assert.equal(result.result, "GOOGLE_ADS_REPORTING_DELTA_CONFIRMED");
    assert.equal(result.allConversions, 12);
    assert.equal(result.conversionDelta, 2);
    assert.equal(result.lastReceivedAdvanced, true);
    assert.equal(result.authSource, "ACCESS_TOKEN");
    assert.equal(result.targetDateEvidence?.targetDate, "2026-09-17");
    assert.equal(result.targetDateEvidence?.allConversionsByConversionDate, 4);
    assert.equal(result.targetDateEvidence?.rowReturned, true);
  }

  assert.equal(fetchCalls.length, 2);
  assert.ok(fetchCalls[0].body.includes("LIMIT 1"));
  assert.ok(fetchCalls[1].body.includes("LIMIT 201"));
  assert.equal(fetchCalls[0].headers.authorization, "Bearer valid-direct-token");
});

test("positive path with genuine zero date rows returns valid no-row evidence", async () => {
  const fakeFetch: typeof fetch = async (input, init) => {
    const bodyStr = String(init?.body ?? "");
    if (bodyStr.includes("FROM conversion_action")) {
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                conversionAction: { id: CONVERSION_ACTION_ID },
                metrics: {
                  allConversions: "5",
                  conversionLastConversionDate: "2026-09-17",
                  conversionLastReceivedRequestDateTime: "2026-09-17 12:00:00",
                },
              },
            ],
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (bodyStr.includes("FROM customer")) {
      // Genuine zero rows for this target date
      return new Response(JSON.stringify([{ results: [] }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    throw new Error(`Unexpected query: ${bodyStr}`);
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
      GOOGLE_ADS_REPORTING_TARGET_DATE: "2026-09-17",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "SUCCESS");
  if (result.status === "SUCCESS") {
    assert.equal(result.targetDateEvidence?.targetDate, "2026-09-17");
    assert.equal(result.targetDateEvidence?.rowReturned, false);
    assert.equal(result.targetDateEvidence?.allConversionsByConversionDate, 0);
  }
});

test("row count exceeding limit fails closed", async () => {
  const fakeFetch: typeof fetch = async () => {
    const overflowResults = Array.from({ length: 202 }, (_, i) => ({
      segments: {
        date: "2026-09-17",
        conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
      },
      metrics: { allConversionsByConversionDate: i },
    }));
    return new Response(JSON.stringify([{ results: overflowResults }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_QUERY_ROW_LIMIT_EXCEEDED");
});

test("response bytes exceeding limit fails closed and cancels stream", async () => {
  let streamCancelled = false;
  const oversizedStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new TextEncoder().encode("x".repeat(40000)));
    },
    cancel() {
      streamCancelled = true;
    },
  });

  const fakeFetch: typeof fetch = async () =>
    new Response(oversizedStream, {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_RESPONSE_BYTE_CAP_EXCEEDED");
  assert.equal(streamCancelled, true);
});

test("total response bytes across queries exceeding limit fails closed under valid receipt", async () => {
  const fakeFetch: typeof fetch = async (input, init) => {
    const bodyStr = String(init?.body ?? "");
    if (bodyStr.includes("FROM conversion_action")) {
      const validPayload = JSON.stringify([
        {
          results: [
            {
              conversionAction: { id: CONVERSION_ACTION_ID },
              metrics: {
                allConversions: 5,
                conversionLastConversionDate: "2026-09-17",
                conversionLastReceivedRequestDateTime: "2026-09-17 12:00:00",
              },
            },
          ],
        },
      ]);
      const padded = validPayload + " ".repeat(40000);
      return new Response(padded, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const payload2 = JSON.stringify([
      {
        results: [
          {
            segments: {
              date: "2026-09-17",
              conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
            },
            metrics: { allConversionsByConversionDate: 1 },
          },
        ],
      },
    ]);
    const padded2 = payload2 + " ".repeat(40000);
    return new Response(padded2, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
      GOOGLE_ADS_REPORTING_TARGET_DATE: "2026-09-17",
    },
    scopeReceipt: makeValidReceipt(),
    maxTotalResponseBytes: 60000,
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_TOTAL_RESPONSE_BYTES_EXCEEDED");
});

test("timeout bounds total duration, settles hung stream and cleans up readlock", async () => {
  let streamCancelled = false;
  const hungStream = new ReadableStream<Uint8Array>({
    start() {
      // Never enqueue or close
    },
    cancel() {
      streamCancelled = true;
    },
  });

  const fakeFetch: typeof fetch = async () =>
    new Response(hungStream, {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const start = Date.now();
  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    timeoutMs: 50,
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });
  const elapsed = Date.now() - start;

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_TIMEOUT");
  assert.equal(streamCancelled, true);
  assert.equal(hungStream.locked, false);
  assert.ok(elapsed >= 40 && elapsed < 2000, `Elapsed ${elapsed}ms was not bounded`);
});

test("non-settling stream cancel cleans up readlock within bounded budget without unhandled rejection", async () => {
  let cancelCalled = false;
  const nonSettlingCancelStream = new ReadableStream<Uint8Array>({
    start() {
      // Never enqueue or close
    },
    cancel() {
      cancelCalled = true;
      // Returns a promise that never settles
      return new Promise(() => {});
    },
  });

  const fakeFetch: typeof fetch = async () =>
    new Response(nonSettlingCancelStream, {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const start = Date.now();
  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    timeoutMs: 50,
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });
  const elapsed = Date.now() - start;

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_TIMEOUT");
  assert.equal(cancelCalled, true);
  assert.equal(nonSettlingCancelStream.locked, false);
  assert.ok(elapsed >= 40 && elapsed < 2000, `Elapsed ${elapsed}ms was not bounded`);
});

test("continuous body stream reading completes normally and releases lock", async () => {
  let chunkCount = 0;
  const continuousStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      chunkCount += 1;
      if (chunkCount === 1) {
        const payload = [
          {
            results: [
              {
                conversionAction: { id: CONVERSION_ACTION_ID },
                metrics: {
                  allConversions: "15",
                  conversionLastConversionDate: "2026-09-17",
                  conversionLastReceivedRequestDateTime: "2026-09-17 14:00:00",
                },
              },
            ],
          },
        ];
        controller.enqueue(new TextEncoder().encode(JSON.stringify(payload)));
        controller.close();
      }
    },
  });

  const fakeFetch: typeof fetch = async () =>
    new Response(continuousStream, {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "SUCCESS");
  assert.equal(continuousStream.locked, false);
  if (result.status === "SUCCESS") {
    assert.equal(result.allConversions, 15);
  }
});

test("hung auth resolution settles within total budget without leaking", async () => {
  const start = Date.now();
  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    timeoutMs: 50,
    now: () => FIXED_NOW,
    resolveToken: async () => new Promise(() => {
      // Never resolves or rejects
    }),
  });
  const elapsed = Date.now() - start;

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_TIMEOUT");
  assert.ok(elapsed >= 40 && elapsed < 2000, `Elapsed ${elapsed}ms was not bounded`);
});

test("hung fetch settles within total budget and aborts", async () => {
  let fetchAborted = false;
  const fakeFetch: typeof fetch = async (_input, init) => {
    init?.signal?.addEventListener("abort", () => {
      fetchAborted = true;
    });
    return new Promise(() => {
      // Never resolves
    });
  };

  const start = Date.now();
  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    timeoutMs: 50,
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });
  const elapsed = Date.now() - start;

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_TIMEOUT");
  assert.equal(fetchAborted, true);
  assert.ok(elapsed >= 40 && elapsed < 2000, `Elapsed ${elapsed}ms was not bounded`);
});

test("provider HTTP error with standard status returns sanitized HTTP error", async () => {
  const fakeFetch: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        error: {
          code: 403,
          message: "SECRET_LEAK_PLAINTEXT_SHOULD_NEVER_APPEAR",
          status: "PERMISSION_DENIED",
        },
      }),
      { status: 403, headers: { "content-type": "application/json" } }
    );

  const errors: string[] = [];
  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
    stderr: (msg) => errors.push(msg),
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_HTTP_403_PERMISSION_DENIED");
  const joinedErrors = errors.join(" ");
  assert.ok(joinedErrors.includes("GOOGLE_ADS_HTTP_403_PERMISSION_DENIED"));
  assert.equal(joinedErrors.includes("SECRET_LEAK_PLAINTEXT_SHOULD_NEVER_APPEAR"), false);
});

test("provider HTTP error with arbitrary status sanitizes to UNKNOWN and does not echo secret", async () => {
  const secretStatus = "SYNTHETIC_SECRET_STATUS_SHOULD_NOT_BE_ECHOED";
  const fakeFetch: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        error: {
          code: 403,
          message: "something went wrong",
          status: secretStatus,
        },
      }),
      { status: 403, headers: { "content-type": "application/json" } }
    );

  const errors: string[] = [];
  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
    stderr: (msg) => errors.push(msg),
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_HTTP_403_UNKNOWN");
  const joinedErrors = errors.join(" ");
  assert.equal(joinedErrors.includes(secretStatus), false);
  assert.ok(joinedErrors.includes("GOOGLE_ADS_HTTP_403_UNKNOWN"));
});

test("auth exception with HTTP-shaped secret message is sanitized to GOOGLE_ADS_AUTH_FAILED", async () => {
  const secretAuthMessage = "GOOGLE_ADS_HTTP_403_SYNTHETIC_SECRET_AUTH_LEAK";
  const errors: string[] = [];

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => {
      throw new Error(secretAuthMessage);
    },
    stderr: (msg) => errors.push(msg),
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_AUTH_FAILED");
  const joinedErrors = errors.join(" ");
  assert.equal(joinedErrors.includes(secretAuthMessage), false);
  assert.ok(joinedErrors.includes("GOOGLE_ADS_AUTH_FAILED"));
});

test("auth exception with synthetic secret is sanitized and does not leak into stderr or result", async () => {
  const secretKey = "ya29.sensitive-auth-token-synthetic-secret-xyz";
  const errors: string[] = [];

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => {
      throw new Error(`Auth crash with credential token: ${secretKey}`);
    },
    stderr: (msg) => errors.push(msg),
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_AUTH_FAILED");
  const joinedErrors = errors.join(" ");
  assert.equal(joinedErrors.includes(secretKey), false);
  assert.ok(joinedErrors.includes("GOOGLE_ADS_AUTH_FAILED"));
});

test("fetch exception with synthetic secret is sanitized and does not leak into stderr or result", async () => {
  const secretHeader = "bearer_secret_token_abcdef123456";
  const errors: string[] = [];

  const fakeFetch: typeof fetch = async () => {
    throw new Error(`Network failure with authorization header: ${secretHeader}`);
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
    stderr: (msg) => errors.push(msg),
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_PROVIDER_ERROR");
  const joinedErrors = errors.join(" ");
  assert.equal(joinedErrors.includes(secretHeader), false);
  assert.ok(joinedErrors.includes("GOOGLE_ADS_PROVIDER_ERROR"));
});

test("malformed JSON response fails closed", async () => {
  const fakeFetch: typeof fetch = async () =>
    new Response("<html><body>502 Bad Gateway</body></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "GOOGLE_ADS_RESPONSE_MALFORMED");
});

test("conversion action row missing selected conversionAction.id fails closed", async () => {
  const fakeFetch: typeof fetch = async () => {
    // Missing conversionAction record / id entirely
    const invalidPayload = [
      {
        results: [
          {
            metrics: { allConversions: "3" },
          },
        ],
      },
    ];
    return new Response(JSON.stringify(invalidPayload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "MALFORMED_PROVIDER_ROW");
});

test("conversion action row with mismatched conversionAction.id fails closed", async () => {
  const fakeFetch: typeof fetch = async () => {
    const invalidPayload = [
      {
        results: [
          {
            conversionAction: { id: "9999999999" },
            metrics: { allConversions: "3" },
          },
        ],
      },
    ];
    return new Response(JSON.stringify(invalidPayload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "MALFORMED_PROVIDER_ROW");
});

test("date query row missing selected segments.date fails closed", async () => {
  const fakeFetch: typeof fetch = async (input, init) => {
    const bodyStr = String(init?.body ?? "");
    if (bodyStr.includes("FROM conversion_action")) {
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                conversionAction: { id: CONVERSION_ACTION_ID },
                metrics: { allConversions: 5 },
              },
            ],
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (bodyStr.includes("FROM customer")) {
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                // segments.date missing
                segments: {
                  conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
                },
                metrics: { allConversionsByConversionDate: 2 },
              },
            ],
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    throw new Error(`Unexpected query: ${bodyStr}`);
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
      GOOGLE_ADS_REPORTING_TARGET_DATE: "2026-09-17",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "MALFORMED_PROVIDER_ROW");
});

test("date query row missing selected segments.conversionAction fails closed", async () => {
  const fakeFetch: typeof fetch = async (input, init) => {
    const bodyStr = String(init?.body ?? "");
    if (bodyStr.includes("FROM conversion_action")) {
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                conversionAction: { id: CONVERSION_ACTION_ID },
                metrics: { allConversions: 5 },
              },
            ],
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (bodyStr.includes("FROM customer")) {
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                // conversionAction missing
                segments: {
                  date: "2026-09-17",
                },
                metrics: { allConversionsByConversionDate: 2 },
              },
            ],
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    throw new Error(`Unexpected query: ${bodyStr}`);
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
      GOOGLE_ADS_REPORTING_TARGET_DATE: "2026-09-17",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "MALFORMED_PROVIDER_ROW");
});

test("date query row with mismatched date fails closed", async () => {
  const fakeFetch: typeof fetch = async (input, init) => {
    const bodyStr = String(init?.body ?? "");
    if (bodyStr.includes("FROM conversion_action")) {
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                conversionAction: { id: CONVERSION_ACTION_ID },
                metrics: { allConversions: 5 },
              },
            ],
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (bodyStr.includes("FROM customer")) {
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                segments: {
                  date: "2026-09-18", // mismatch with requested 2026-09-17
                  conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
                },
                metrics: { allConversionsByConversionDate: 2 },
              },
            ],
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    throw new Error(`Unexpected query: ${bodyStr}`);
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
      GOOGLE_ADS_REPORTING_TARGET_DATE: "2026-09-17",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "MALFORMED_PROVIDER_ROW");
});

test("malformed provider row missing metrics fails closed without fabricating zero snapshot", async () => {
  const fakeFetch: typeof fetch = async () => {
    const invalidPayload = [
      {
        results: [
          {
            conversionAction: { id: CONVERSION_ACTION_ID },
            // metrics missing entirely
          },
        ],
      },
    ];
    return new Response(JSON.stringify(invalidPayload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "METRICS_MISSING");
});

test("malformed provider row results array containing non-record fails closed", async () => {
  const fakeFetch: typeof fetch = async () => {
    const invalidPayload = [
      {
        results: [null],
      },
    ];
    return new Response(JSON.stringify(invalidPayload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => ({
      accessToken: "valid-token",
      source: "ACCESS_TOKEN",
      tokenExpiresInSeconds: null,
    }),
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "MALFORMED_PROVIDER_ROW");
});

test("target date format validation rejects invalid dates before any fetch", async () => {
  let tokenResolverCalled = false;
  let fetchCalled = false;

  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
      GOOGLE_ADS_REPORTING_TARGET_DATE: "2026-02-31",
    },
    scopeReceipt: makeValidReceipt(),
    now: () => FIXED_NOW,
    resolveToken: async () => {
      tokenResolverCalled = true;
      throw new Error("Must not be called");
    },
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("Must not be called");
    },
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "TARGET_DATE_INVALID");
  assert.equal(tokenResolverCalled, false);
  assert.equal(fetchCalled, false);
});

test("options limit validation rejects non-positive or out-of-bounds limits", async () => {
  const result = await runGoogleAdsReportingMonitor({
    env: {
      GOOGLE_ADS_ACCESS_TOKEN: "valid-token",
    },
    scopeReceipt: makeValidReceipt(),
    maxTotalResponseBytes: 9999999, // Exceeds authorized cap 131072
    now: () => FIXED_NOW,
  });

  assert.equal(result.status, "FAIL");
  assert.equal(result.error, "OPTIONS_MAX_TOTAL_RESPONSE_BYTES_INVALID");
});
