import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  hasGoogleAdsAuthInput,
  resolveGoogleAdsAccessToken,
  type GoogleAdsAuthEnvironment,
  type GoogleAdsProviderAuthSource,
  type GoogleAdsTokenExchange,
} from "./google-ads-provider-auth.ts";
import {
  GOOGLE_ADS_REPORTING_LIMITS,
  readResponseTextBounded,
  validateGoogleAdsReadScopeReceipt,
  type GoogleAdsReadScopeReceipt,
} from "./google-ads-read-scope.ts";
import {
  evaluateReportingEvidence,
  type ReportingSnapshot,
} from "./line4d-reporting-evidence.ts";

export const CUSTOMER_ID = "4801404246";
export const CONVERSION_ACTION_ID = "7674301565";
export const API_VERSION = "v25";
export const API_URL = `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:searchStream`;

export const ADMITTED_PROVIDER_STATUSES = new Set<string>([
  "PERMISSION_DENIED",
  "UNAUTHENTICATED",
  "RESOURCE_EXHAUSTED",
  "INVALID_ARGUMENT",
  "NOT_FOUND",
  "ALREADY_EXISTS",
  "FAILED_PRECONDITION",
  "ABORTED",
  "OUT_OF_RANGE",
  "UNAVAILABLE",
  "DATA_LOSS",
  "INTERNAL",
  "DEADLINE_EXCEEDED",
  "CANCELLED",
  "UNKNOWN",
]);

type RecordLike = Record<string, unknown>;

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const rowsFrom = (payload: unknown): RecordLike[] => {
  if (!payload || typeof payload !== "object") {
    throw new Error("GOOGLE_ADS_RESPONSE_MALFORMED");
  }
  const chunks = Array.isArray(payload) ? payload : [payload];
  const rows: RecordLike[] = [];
  for (const chunk of chunks) {
    const record = asRecord(chunk);
    if (!record) {
      throw new Error("MALFORMED_PROVIDER_ROW");
    }
    if ("results" in record) {
      if (!Array.isArray(record.results)) {
        throw new Error("MALFORMED_PROVIDER_ROW");
      }
      for (const result of record.results) {
        const row = asRecord(result);
        if (!row) {
          throw new Error("MALFORMED_PROVIDER_ROW");
        }
        rows.push(row);
      }
    }
  }
  return rows;
};

const baselineFromEnv = (reportingBaselineJson?: string | null): ReportingSnapshot | null => {
  if (!reportingBaselineJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(reportingBaselineJson);
  } catch {
    throw new Error("REPORTING_BASELINE_INVALID");
  }
  const record = asRecord(parsed);
  if (!record) throw new Error("REPORTING_BASELINE_INVALID");
  const allConversions = asNumber(record.allConversions);
  const customerId = asString(record.customerId);
  const conversionActionId = asString(record.conversionActionId);
  if (allConversions === null || !customerId || !conversionActionId) {
    throw new Error("REPORTING_BASELINE_INVALID");
  }
  return {
    customerId,
    conversionActionId,
    allConversions,
    lastConversionDate: asString(record.lastConversionDate),
    lastReceivedRequestDateTime: asString(record.lastReceivedRequestDateTime),
  };
};

export interface MonitorOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  resolveToken?: (
    env?: GoogleAdsAuthEnvironment,
    exchange?: GoogleAdsTokenExchange
  ) => Promise<{
    accessToken: string;
    source: GoogleAdsProviderAuthSource;
    tokenExpiresInSeconds: number | null;
  }>;
  now?: () => number;
  scopeReceipt?: string | Record<string, unknown>;
  serializedScopeReceipt?: string;
  timeoutMs?: number;
  maxQueries?: number;
  maxRows?: number;
  maxResponseBytes?: number;
  maxTotalResponseBytes?: number;
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
  throwOnError?: boolean;
}

export type MonitorResult =
  | {
      status: "SKIPPED_NO_PROVIDER_AUTH";
      result: "SKIPPED_NO_PROVIDER_AUTH";
    }
  | {
      status: "SUCCESS";
      result: "GOOGLE_ADS_REPORTING_DELTA_CONFIRMED" | "GOOGLE_ADS_REPORTING_UNVERIFIED";
      customerId: string;
      conversionActionId: string;
      allConversions: number;
      lastConversionDate: string | null;
      lastReceivedRequestDateTime: string | null;
      authSource: GoogleAdsProviderAuthSource;
      accessTokenPrinted: boolean;
      baselineProvided: boolean;
      verificationState: string;
      reportingVisible: boolean;
      conversionDelta: number | null;
      lastReceivedAdvanced: boolean;
      targetDateEvidence: {
        targetDate: string;
        rowReturned: boolean;
        allConversionsByConversionDate: number;
      } | null;
      baselineSnapshot?: ReportingSnapshot;
    }
  | {
      status: "FAIL";
      error: string;
    };

const resolveSerializedReceipt = (
  options: MonitorOptions,
  env: Record<string, string | undefined>
): string | undefined => {
  if (typeof options.serializedScopeReceipt === "string") {
    return options.serializedScopeReceipt;
  }
  if (typeof options.scopeReceipt === "string") {
    return options.scopeReceipt;
  }
  if (options.scopeReceipt && typeof options.scopeReceipt === "object") {
    return JSON.stringify(options.scopeReceipt);
  }
  if (env.GOOGLE_ADS_READ_SCOPE_RECEIPT_JSON) {
    return env.GOOGLE_ADS_READ_SCOPE_RECEIPT_JSON;
  }
  if (env.GOOGLE_ADS_READ_SCOPE_RECEIPT) {
    const raw = env.GOOGLE_ADS_READ_SCOPE_RECEIPT.trim();
    if (raw.startsWith("{")) return raw;
    try {
      return readFileSync(path.resolve(raw), "utf8");
    } catch {
      return raw;
    }
  }
  const argIdx = process.argv.indexOf("--scope-receipt");
  if (argIdx >= 0 && process.argv[argIdx + 1]) {
    try {
      return readFileSync(path.resolve(process.argv[argIdx + 1]), "utf8");
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const KNOWN_AUTH_ERROR_CODES = new Set<string>([
  "GOOGLE_ADS_AUTH_MISSING",
  "GOOGLE_ADS_ACCESS_TOKEN_INVALID",
  "GOOGLE_ADS_SERVICE_ACCOUNT_JSON_INVALID",
  "GOOGLE_ADS_SERVICE_ACCOUNT_KEY_TYPE_UNSUPPORTED",
  "GOOGLE_ADS_TOKEN_EXCHANGE_FAILED",
  "GOOGLE_ADS_TOKEN_RESPONSE_INVALID",
  "GOOGLE_ADS_TOKEN_EXCHANGE_ERROR",
  "GOOGLE_ADS_TIMEOUT",
]);

const sanitizeAuthErrorCode = (error: unknown): string => {
  if (error instanceof Error && typeof error.message === "string") {
    const msg = error.message.trim();
    if (KNOWN_AUTH_ERROR_CODES.has(msg)) {
      return msg;
    }
  }
  return "GOOGLE_ADS_AUTH_FAILED";
};

const KNOWN_PROVIDER_ERROR_CODES = new Set<string>([
  "TARGET_DATE_INVALID",
  "ADS_READ_SCOPE_RECEIPT_MISSING_OR_OVERSIZED",
  "ADS_READ_SCOPE_RECEIPT_INVALID_JSON",
  "ADS_READ_SCOPE_RECEIPT_INVALID",
  "ADS_READ_SCOPE_RECEIPT_SCHEMA_MISMATCH",
  "ADS_READ_SCOPE_AUTHORITY_FACTS_MISSING",
  "ADS_READ_SCOPE_CREDENTIAL_REF_UNSUPPORTED",
  "ADS_READ_SCOPE_CLOUD_PROJECT_INVALID",
  "ADS_READ_SCOPE_PROJECT_ACCESS_UNVERIFIED",
  "ADS_READ_SCOPE_TARGET_MISMATCH",
  "ADS_READ_SCOPE_ACCOUNT_ACCESS_INVALID",
  "ADS_READ_SCOPE_LOGIN_CUSTOMER_MISMATCH",
  "ADS_READ_SCOPE_API_OR_OAUTH_SCOPE_MISMATCH",
  "ADS_READ_SCOPE_READ_BOUND_MISMATCH",
  "ADS_READ_SCOPE_RECEIPT_EXPIRED_OR_TOO_LONG",
  "ADS_READ_SCOPE_ACCESS_TOKEN_EXPIRY_REQUIRED",
  "ADS_READ_SCOPE_SERVICE_ACCOUNT_EXPIRY_INVALID",
  "ADS_READ_SCOPE_CREDENTIAL_REF_MISMATCH",
  "GOOGLE_ADS_AUTH_FAILED",
  "GOOGLE_ADS_TIMEOUT",
  "GOOGLE_ADS_QUERY_COUNT_LIMIT_EXCEEDED",
  "GOOGLE_ADS_QUERY_ROW_LIMIT_EXCEEDED",
  "GOOGLE_ADS_RESPONSE_STREAM_UNAVAILABLE",
  "GOOGLE_ADS_RESPONSE_BYTE_CAP_EXCEEDED",
  "GOOGLE_ADS_TOTAL_RESPONSE_BYTES_EXCEEDED",
  "GOOGLE_ADS_RESPONSE_READ_FAILED",
  "GOOGLE_ADS_RESPONSE_MALFORMED_UTF8",
  "GOOGLE_ADS_RESPONSE_MALFORMED",
  "GOOGLE_ADS_PROVIDER_ERROR",
  "CONVERSION_ACTION_REPORTING_ROW_NOT_FOUND",
  "MALFORMED_PROVIDER_ROW",
  "METRICS_MISSING",
  "REPORTING_BASELINE_INVALID",
  "REPORTING_BASELINE_TARGET_MISMATCH",
  "OPTIONS_TIMEOUT_INVALID",
  "OPTIONS_MAX_QUERIES_INVALID",
  "OPTIONS_MAX_ROWS_INVALID",
  "OPTIONS_MAX_RESPONSE_BYTES_INVALID",
  "OPTIONS_MAX_TOTAL_RESPONSE_BYTES_INVALID",
]);

const sanitizeProviderErrorCode = (error: unknown, fallback = "GOOGLE_ADS_PROVIDER_ERROR"): string => {
  if (error instanceof Error && typeof error.message === "string") {
    const msg = error.message.trim();
    if (KNOWN_PROVIDER_ERROR_CODES.has(msg)) {
      return msg;
    }
    const match = /^GOOGLE_ADS_HTTP_([1-5]\d{2})_([A-Z0-9_]+)$/.exec(msg);
    if (match) {
      const [, httpCodeStr, statusStr] = match;
      if (ADMITTED_PROVIDER_STATUSES.has(statusStr)) {
        return `GOOGLE_ADS_HTTP_${httpCodeStr}_${statusStr}`;
      }
      return `GOOGLE_ADS_HTTP_${httpCodeStr}_UNKNOWN`;
    }
  }
  return fallback;
};

const validateNarrowLimit = (
  value: number | undefined,
  authorizedCap: number,
  errorCode: string
): number => {
  if (value === undefined) return authorizedCap;
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= authorizedCap
  ) {
    return value;
  }
  throw new Error(errorCode);
};

const raceAgainstSignal = <T>(
  promise: Promise<T>,
  signal: AbortSignal,
  onAbort?: () => Promise<void> | void
): Promise<T> => {
  if (signal.aborted) {
    if (onAbort) {
      void Promise.resolve(onAbort()).catch(() => undefined);
    }
    return Promise.reject(new Error("GOOGLE_ADS_TIMEOUT"));
  }
  return new Promise<T>((resolve, reject) => {
    const handleAbort = async () => {
      signal.removeEventListener("abort", handleAbort);
      try {
        if (onAbort) {
          await onAbort();
        }
      } finally {
        reject(new Error("GOOGLE_ADS_TIMEOUT"));
      }
    };
    signal.addEventListener("abort", handleAbort, { once: true });
    promise.then(
      (res) => {
        signal.removeEventListener("abort", handleAbort);
        resolve(res);
      },
      (err) => {
        signal.removeEventListener("abort", handleAbort);
        reject(err);
      }
    );
  });
};

const createCancellableResponseBridge = (
  response: Response,
  signal: AbortSignal
): {
  bridgedResponse: Response;
  cancelUnderlying: (reason?: unknown) => Promise<void>;
} => {
  if (!response.body) {
    return {
      bridgedResponse: response,
      cancelUnderlying: async () => undefined,
    };
  }

  const underlyingReader = response.body.getReader();
  let cancelPromise: Promise<void> | null = null;

  const cancelUnderlying = (reason?: unknown): Promise<void> => {
    if (cancelPromise) return cancelPromise;
    cancelPromise = (async () => {
      try {
        const streamCancel = underlyingReader.cancel(reason);
        void Promise.resolve(streamCancel).catch(() => undefined);
        await Promise.resolve();
      } catch {
        // Ignore underlying stream cancellation errors.
      } finally {
        try {
          underlyingReader.releaseLock();
        } catch {
          // Ignore if lock was already released.
        }
      }
    })();
    return cancelPromise;
  };

  const bridgedStream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (signal.aborted) {
        void cancelUnderlying(new Error("GOOGLE_ADS_TIMEOUT"));
        controller.error(new Error("GOOGLE_ADS_TIMEOUT"));
        throw new Error("GOOGLE_ADS_TIMEOUT");
      }

      let onAbort: (() => void) | undefined;
      const abortPromise = new Promise<never>((_, reject) => {
        onAbort = () => {
          void cancelUnderlying(new Error("GOOGLE_ADS_TIMEOUT"));
          reject(new Error("GOOGLE_ADS_TIMEOUT"));
        };
        signal.addEventListener("abort", onAbort, { once: true });
      });

      try {
        const next = await Promise.race([
          underlyingReader.read(),
          abortPromise,
        ]);
        if (onAbort) {
          signal.removeEventListener("abort", onAbort);
        }
        if (signal.aborted) {
          void cancelUnderlying(new Error("GOOGLE_ADS_TIMEOUT"));
          controller.error(new Error("GOOGLE_ADS_TIMEOUT"));
          throw new Error("GOOGLE_ADS_TIMEOUT");
        }
        if (next.done) {
          try {
            underlyingReader.releaseLock();
          } catch {
            // Ignore
          }
          controller.close();
        } else {
          controller.enqueue(next.value);
        }
      } catch (err) {
        if (onAbort) {
          signal.removeEventListener("abort", onAbort);
        }
        await cancelUnderlying(err);
        controller.error(err);
        throw err;
      }
    },
    async cancel(reason) {
      await cancelUnderlying(reason);
    },
  });

  const bridgedResponse = new Response(bridgedStream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  return {
    bridgedResponse,
    cancelUnderlying,
  };
};

export async function runGoogleAdsReportingMonitor(
  options: MonitorOptions = {}
): Promise<MonitorResult> {
  const env = options.env ?? process.env;
  const stdout = options.stdout ?? console.log;
  const stderr = options.stderr ?? console.error;

  const loginCustomerId = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim() || null;
  const targetDate = env.GOOGLE_ADS_REPORTING_TARGET_DATE?.trim() ?? null;
  const reportingBaselineJson = env.GOOGLE_ADS_REPORTING_BASELINE_JSON?.trim();

  let maxQueries: number;
  let maxRows: number;
  let maxResponseBytes: number;
  let maxTotalBytes: number;
  let timeoutMs: number;

  try {
    maxQueries = validateNarrowLimit(
      options.maxQueries,
      GOOGLE_ADS_REPORTING_LIMITS.maxQueries,
      "OPTIONS_MAX_QUERIES_INVALID"
    );
    maxRows = validateNarrowLimit(
      options.maxRows,
      GOOGLE_ADS_REPORTING_LIMITS.maxRows,
      "OPTIONS_MAX_ROWS_INVALID"
    );
    maxResponseBytes = validateNarrowLimit(
      options.maxResponseBytes,
      GOOGLE_ADS_REPORTING_LIMITS.maxResponseBytes,
      "OPTIONS_MAX_RESPONSE_BYTES_INVALID"
    );
    maxTotalBytes = validateNarrowLimit(
      options.maxTotalResponseBytes,
      GOOGLE_ADS_REPORTING_LIMITS.maxTotalResponseBytes,
      "OPTIONS_MAX_TOTAL_RESPONSE_BYTES_INVALID"
    );
    if (options.timeoutMs !== undefined) {
      if (
        typeof options.timeoutMs !== "number" ||
        !Number.isSafeInteger(options.timeoutMs) ||
        options.timeoutMs <= 0 ||
        options.timeoutMs > 120_000
      ) {
        throw new Error("OPTIONS_TIMEOUT_INVALID");
      }
      timeoutMs = options.timeoutMs;
    } else {
      timeoutMs = 15_000;
    }
  } catch (err) {
    const error = sanitizeProviderErrorCode(err, "OPTIONS_MAX_TOTAL_RESPONSE_BYTES_INVALID");
    stderr(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${error}`);
    if (options.throwOnError) throw new Error(error);
    return { status: "FAIL", error };
  }

  if (targetDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      const error = "TARGET_DATE_INVALID";
      stderr(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${error}`);
      if (options.throwOnError) throw new Error(error);
      return { status: "FAIL", error };
    }
    const ms = Date.parse(targetDate + "T00:00:00Z");
    if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== targetDate) {
      const error = "TARGET_DATE_INVALID";
      stderr(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${error}`);
      if (options.throwOnError) throw new Error(error);
      return { status: "FAIL", error };
    }
  }

  if (!hasGoogleAdsAuthInput(env)) {
    stdout("GOOGLE_ADS_REPORTING_MONITOR=SKIPPED_NO_PROVIDER_AUTH");
    return {
      status: "SKIPPED_NO_PROVIDER_AUTH",
      result: "SKIPPED_NO_PROVIDER_AUTH",
    };
  }

  const nowMs = typeof options.now === "function" ? options.now() : (options.now ?? Date.now());
  const serializedReceipt = resolveSerializedReceipt(options, env);
  const scopeValidation = validateGoogleAdsReadScopeReceipt(
    serializedReceipt,
    {
      targetCustomerId: CUSTOMER_ID,
      apiVersion: API_VERSION,
      loginCustomerId,
    },
    nowMs
  );

  if (!scopeValidation.ok) {
    const error = sanitizeProviderErrorCode(new Error(scopeValidation.reason), "ADS_READ_SCOPE_RECEIPT_INVALID");
    stderr(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${error}`);
    if (options.throwOnError) throw new Error(error);
    return { status: "FAIL", error };
  }

  const receipt: GoogleAdsReadScopeReceipt = scopeValidation.receipt;
  const hasDirectToken = Boolean(env.GOOGLE_ADS_ACCESS_TOKEN?.trim());
  if (hasDirectToken && receipt.credential_ref !== "env:GOOGLE_ADS_ACCESS_TOKEN") {
    const error = "ADS_READ_SCOPE_CREDENTIAL_REF_MISMATCH";
    stderr(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${error}`);
    if (options.throwOnError) throw new Error(error);
    return { status: "FAIL", error };
  }
  if (!hasDirectToken && receipt.credential_ref !== "env:GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON") {
    const error = "ADS_READ_SCOPE_CREDENTIAL_REF_MISMATCH";
    stderr(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${error}`);
    if (options.throwOnError) throw new Error(error);
    return { status: "FAIL", error };
  }

  // Create total deadline and timeout controller covering auth, fetch, and body reading.
  const startMs = Date.now();
  const deadline = startMs + timeoutMs;
  const globalTimeoutController = new AbortController();
  const globalTimeoutId = setTimeout(() => {
    globalTimeoutController.abort(new Error("GOOGLE_ADS_TIMEOUT"));
  }, timeoutMs);

  const resolveToken = options.resolveToken ?? resolveGoogleAdsAccessToken;
  let auth: { accessToken: string; source: GoogleAdsProviderAuthSource; tokenExpiresInSeconds: number | null };

  try {
    try {
      auth = await raceAgainstSignal(
        resolveToken(env),
        globalTimeoutController.signal
      );
    } catch (error) {
      if (globalTimeoutController.signal.aborted || Date.now() >= deadline) {
        throw new Error("GOOGLE_ADS_TIMEOUT");
      }
      throw new Error(sanitizeAuthErrorCode(error));
    }

    let queryCount = 0;
    let totalResponseBytes = 0;
    const fetchImpl = options.fetchImpl ?? fetch;

    const queryRows = async (query: string, maxRowsAllowed: number): Promise<RecordLike[]> => {
      queryCount += 1;
      if (queryCount > maxQueries) {
        throw new Error("GOOGLE_ADS_QUERY_COUNT_LIMIT_EXCEEDED");
      }

      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0 || globalTimeoutController.signal.aborted) {
        throw new Error("GOOGLE_ADS_TIMEOUT");
      }

      const headers: Record<string, string> = {
        authorization: `Bearer ${auth.accessToken}`,
        "content-type": "application/json",
      };
      if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

      let rawResponse: Response;
      try {
        rawResponse = await raceAgainstSignal(
          fetchImpl(API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ query }),
            signal: globalTimeoutController.signal,
          }),
          globalTimeoutController.signal
        );
      } catch (error) {
        if (globalTimeoutController.signal.aborted || Date.now() >= deadline) {
          throw new Error("GOOGLE_ADS_TIMEOUT");
        }
        throw new Error(sanitizeProviderErrorCode(error, "GOOGLE_ADS_PROVIDER_ERROR"));
      }

      const remainingTotalBytes = maxTotalBytes - totalResponseBytes;
      if (remainingTotalBytes <= 0) {
        if (rawResponse.body) {
          await rawResponse.body.cancel().catch(() => undefined);
        }
        throw new Error("GOOGLE_ADS_TOTAL_RESPONSE_BYTES_EXCEEDED");
      }

      const maxBytesForThis = Math.min(maxResponseBytes, remainingTotalBytes);
      const { bridgedResponse, cancelUnderlying } = createCancellableResponseBridge(
        rawResponse,
        globalTimeoutController.signal
      );

      try {
        let text: string;
        let bytes: number;
        try {
          ({ text, bytes } = await raceAgainstSignal(
            readResponseTextBounded(bridgedResponse, maxBytesForThis),
            globalTimeoutController.signal,
            async () => {
              await cancelUnderlying(new Error("GOOGLE_ADS_TIMEOUT"));
            }
          ));
        } catch (err) {
          await cancelUnderlying(err);
          if (globalTimeoutController.signal.aborted || Date.now() >= deadline) {
            throw new Error("GOOGLE_ADS_TIMEOUT");
          }
          if (
            err instanceof Error &&
            err.message === "GOOGLE_ADS_RESPONSE_BYTE_CAP_EXCEEDED" &&
            maxBytesForThis === remainingTotalBytes &&
            remainingTotalBytes < maxResponseBytes
          ) {
            throw new Error("GOOGLE_ADS_TOTAL_RESPONSE_BYTES_EXCEEDED");
          }
          throw new Error(sanitizeProviderErrorCode(err, "GOOGLE_ADS_RESPONSE_READ_FAILED"));
        }

        if (globalTimeoutController.signal.aborted || Date.now() >= deadline) {
          throw new Error("GOOGLE_ADS_TIMEOUT");
        }

        totalResponseBytes += bytes;
        if (totalResponseBytes > maxTotalBytes) {
          throw new Error("GOOGLE_ADS_TOTAL_RESPONSE_BYTES_EXCEEDED");
        }

        if (!rawResponse.ok) {
          let status = "UNKNOWN";
          try {
            const parsed = asRecord(JSON.parse(text));
            const candidateStatus = asString(asRecord(parsed?.error)?.status);
            if (candidateStatus && ADMITTED_PROVIDER_STATUSES.has(candidateStatus)) {
              status = candidateStatus;
            }
          } catch {
            // Never echo the provider response body.
          }
          const httpStatus =
            Number.isSafeInteger(rawResponse.status) && rawResponse.status >= 100 && rawResponse.status <= 599
              ? rawResponse.status
              : 500;
          throw new Error(`GOOGLE_ADS_HTTP_${httpStatus}_${status}`);
        }

        let payload: unknown;
        try {
          payload = JSON.parse(text);
        } catch {
          throw new Error("GOOGLE_ADS_RESPONSE_MALFORMED");
        }

        const rows = rowsFrom(payload);
        if (rows.length > maxRowsAllowed) {
          throw new Error("GOOGLE_ADS_QUERY_ROW_LIMIT_EXCEEDED");
        }
        return rows;
      } finally {
        await cancelUnderlying().catch(() => undefined);
      }
    };

    const currentRows = await queryRows(
      `SELECT
        conversion_action.id,
        metrics.all_conversions,
        metrics.conversion_last_conversion_date,
        metrics.conversion_last_received_request_date_time
      FROM conversion_action
      WHERE conversion_action.id = ${CONVERSION_ACTION_ID}
      LIMIT 1`,
      1
    );

    if (currentRows.length !== 1) {
      throw new Error("CONVERSION_ACTION_REPORTING_ROW_NOT_FOUND");
    }

    const firstRow = currentRows[0];
    const conversionActionRecord = asRecord(firstRow.conversionAction ?? firstRow.conversion_action);
    if (!conversionActionRecord) {
      throw new Error("MALFORMED_PROVIDER_ROW");
    }
    const rawConversionActionId = conversionActionRecord.id;
    const returnedConversionActionId =
      typeof rawConversionActionId === "number" || typeof rawConversionActionId === "string"
        ? String(rawConversionActionId).trim()
        : null;
    if (!returnedConversionActionId || returnedConversionActionId !== CONVERSION_ACTION_ID) {
      throw new Error("MALFORMED_PROVIDER_ROW");
    }

    const metricsRecord = asRecord(firstRow.metrics);
    if (!metricsRecord) {
      throw new Error("METRICS_MISSING");
    }

    const allConversionsVal = asNumber(metricsRecord.allConversions ?? metricsRecord.all_conversions);
    if (allConversionsVal === null || allConversionsVal < 0) {
      throw new Error("METRICS_MISSING");
    }

    const currentSnapshot: ReportingSnapshot = {
      customerId: CUSTOMER_ID,
      conversionActionId: CONVERSION_ACTION_ID,
      allConversions: allConversionsVal,
      lastConversionDate: asString(
        metricsRecord.conversionLastConversionDate ?? metricsRecord.conversion_last_conversion_date
      ),
      lastReceivedRequestDateTime: asString(
        metricsRecord.conversionLastReceivedRequestDateTime ??
          metricsRecord.conversion_last_received_request_date_time
      ),
    };

    const baseline = baselineFromEnv(reportingBaselineJson);
    const evidence = evaluateReportingEvidence(currentSnapshot, baseline);

    let targetDateEvidence: {
      targetDate: string;
      rowReturned: boolean;
      allConversionsByConversionDate: number;
    } | null = null;

    if (targetDate) {
      const dateRows = await queryRows(
        `SELECT
          segments.date,
          segments.conversion_action,
          metrics.all_conversions_by_conversion_date
        FROM customer
        WHERE segments.date = '${targetDate}'
          AND segments.conversion_action =
            'customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}'
        LIMIT 201`,
        maxRows
      );

      let totalDateConversions = 0;
      for (const row of dateRows) {
        const segments = asRecord(row.segments);
        if (!segments) {
          throw new Error("MALFORMED_PROVIDER_ROW");
        }
        const rawRowDate = segments.date;
        const rowDate =
          typeof rawRowDate === "string" && rawRowDate.trim().length > 0
            ? rawRowDate.trim()
            : null;
        if (!rowDate || rowDate !== targetDate) {
          throw new Error("MALFORMED_PROVIDER_ROW");
        }

        const rawRowConversionAction = segments.conversionAction ?? segments.conversion_action;
        const rowConversionAction =
          typeof rawRowConversionAction === "string" && rawRowConversionAction.trim().length > 0
            ? rawRowConversionAction.trim()
            : null;
        const expectedConversionAction = `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`;
        if (!rowConversionAction || rowConversionAction !== expectedConversionAction) {
          throw new Error("MALFORMED_PROVIDER_ROW");
        }

        const dateMetrics = asRecord(row.metrics);
        if (!dateMetrics) throw new Error("METRICS_MISSING");
        const dateConversionCount = asNumber(
          dateMetrics.allConversionsByConversionDate ?? dateMetrics.all_conversions_by_conversion_date
        );
        if (dateConversionCount === null || dateConversionCount < 0) {
          throw new Error("METRICS_MISSING");
        }
        totalDateConversions += dateConversionCount;
      }

      targetDateEvidence = {
        targetDate,
        rowReturned: dateRows.length > 0,
        allConversionsByConversionDate: totalDateConversions,
      };
    }

    const successResult: MonitorResult = {
      status: "SUCCESS",
      result: evidence.reportingVisible
        ? "GOOGLE_ADS_REPORTING_DELTA_CONFIRMED"
        : "GOOGLE_ADS_REPORTING_UNVERIFIED",
      ...currentSnapshot,
      authSource: auth.source,
      accessTokenPrinted: false,
      baselineProvided: baseline !== null,
      ...evidence,
      targetDateEvidence,
      baselineSnapshot: baseline === null ? currentSnapshot : undefined,
    };

    stdout(JSON.stringify(successResult));
    return successResult;
  } catch (error) {
    const safeError = sanitizeProviderErrorCode(error, "GOOGLE_ADS_PROVIDER_ERROR");
    stderr(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${safeError}`);
    if (options.throwOnError) throw new Error(safeError);
    return { status: "FAIL", error: safeError };
  } finally {
    clearTimeout(globalTimeoutId);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  const result = await runGoogleAdsReportingMonitor();
  if (result.status === "FAIL") {
    process.exitCode = 1;
  }
}
