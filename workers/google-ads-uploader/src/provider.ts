import {
  GOOGLE_DATA_MANAGER_EVENTS_URL,
  GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL,
  PROVIDER_HTTP_TIMEOUT_MS,
  type FetchLike,
} from "./types.ts";
import type { DataManagerIngestRequest } from "./payload.ts";
import {
  ProviderRequestError,
  type ProviderDispatchState,
  parseSafeErrorReason,
  retryableHttpStatus,
  sanitizeHttpReason,
  sanitizeProviderReason,
} from "./errors.ts";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parseJsonRecord = (body: string): Record<string, unknown> | null => {
  try {
    return asRecord(JSON.parse(body));
  } catch {
    return null;
  }
};

export interface DataManagerFieldWarning {
  field: string | null;
  reason: string | null;
}

const parseFieldWarnings = (
  record: Record<string, unknown> | null
): DataManagerFieldWarning[] => {
  const warnings = Array.isArray(record?.fieldWarnings) ? record.fieldWarnings : [];
  return warnings
    .map((entry) => {
      const warning = asRecord(entry);
      if (!warning) return null;
      const field = asNonEmptyString(warning.field)?.slice(0, 120) ?? null;
      const reason = sanitizeProviderReason(warning.reason);
      return field || reason ? { field, reason } : null;
    })
    .filter((warning): warning is DataManagerFieldWarning => Boolean(warning));
};

export interface IngestResponse {
  requestId: string | null;
  fieldWarnings: DataManagerFieldWarning[];
  transportOutcome: ProviderDispatchState;
}

export const ingestDataManagerEvent = async (
  accessToken: string,
  request: DataManagerIngestRequest,
  fetchImpl: FetchLike = fetch
): Promise<IngestResponse> => {
  let response: Response;
  try {
    response = await fetchImpl(GOOGLE_DATA_MANAGER_EVENTS_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(PROVIDER_HTTP_TIMEOUT_MS),
    });
  } catch {
    throw new ProviderRequestError(
      "INGEST_NETWORK_ERROR",
      false,
      null,
      null,
      "RESULT_UNKNOWN"
    );
  }

  let body: string;
  try {
    body = await response.text();
  } catch {
    throw new ProviderRequestError(
      "INGEST_RESPONSE_BODY_READ_ERROR",
      false,
      response.status,
      null,
      "RESULT_UNKNOWN"
    );
  }
  if (!response.ok) {
    throw new ProviderRequestError(
      "INGEST_HTTP_ERROR",
      retryableHttpStatus(response.status),
      response.status,
      parseSafeErrorReason(body) || sanitizeHttpReason(response.status),
      "REJECTED_CONFIRMED"
    );
  }

  const record = parseJsonRecord(body);
  const requestId = asNonEmptyString(record?.requestId);
  if (!requestId && !request.validateOnly) {
    throw new ProviderRequestError(
      "INGEST_REQUEST_ID_MISSING",
      false,
      response.status,
      null,
      "RESULT_UNKNOWN"
    );
  }
  return {
    requestId,
    fieldWarnings: parseFieldWarnings(record),
    transportOutcome: "ACKNOWLEDGED",
  };
};

export interface DiagnosticExpectation {
  destinationReference: string;
  googleAdsAccountId: string;
  googleAdsConversionActionId: string;
  expectedRecordCount: number;
  conversionType?: "verified_line_contact" | "qualified_line_lead" | "won_job";
  stageType?: "VERIFIED_LINE_CONTACT" | "QUALIFIED_CONFIRMED" | "WON_JOB";
}

export interface DiagnosticResponse {
  status: "SUCCESS" | "PROCESSING" | "FAILED" | "PARTIAL_SUCCESS" | "UNKNOWN";
  reasons: string[];
  warningReasons: string[];
  recordCount: number | null;
  duplicateTransactionId: string | null;
}

const safeRecordCount = (value: unknown): number | null => {
  const count =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
};

const getStatusRecord = (destination: Record<string, unknown>): unknown =>
  destination.eventsIngestionStatus ?? destination.status;

const getCountReasons = (
  destination: Record<string, unknown>,
  infoKey: "errorInfo" | "warningInfo",
  countsKey: "errorCounts" | "warningCounts"
): string[] => {
  const info = asRecord(destination[infoKey]);
  const counts = Array.isArray(info?.[countsKey]) ? info[countsKey] : [];
  return counts
    .map((entry) => {
      const count = asRecord(entry);
      return sanitizeProviderReason(count?.reason);
    })
    .filter((reason): reason is string => Boolean(reason));
};

const getReasons = (destination: Record<string, unknown>): string[] =>
  getCountReasons(destination, "errorInfo", "errorCounts");

const getWarningReasons = (destination: Record<string, unknown>): string[] =>
  getCountReasons(destination, "warningInfo", "warningCounts");

const getRecordCount = (destination: Record<string, unknown>): number | null => {
  const status = asRecord(getStatusRecord(destination));
  return safeRecordCount(status?.recordCount ?? status?.eventCount);
};

const getDuplicateTransactionId = (
  destination: Record<string, unknown>
): string | null => {
  const status = asRecord(getStatusRecord(destination));
  const errorInfo = asRecord(destination.errorInfo);
  return (
    asNonEmptyString(status?.transactionId) ||
    asNonEmptyString(errorInfo?.transactionId) ||
    null
  );
};

const normalizeStatus = (
  destination: Record<string, unknown>
): DiagnosticResponse["status"] => {
  const statusValue = sanitizeProviderReason(destination.requestStatus);
  const normalized = statusValue === "FAILURE" ? "FAILED" : statusValue;
  return normalized === "SUCCESS" ||
    normalized === "PROCESSING" ||
    normalized === "FAILED" ||
    normalized === "PARTIAL_SUCCESS"
    ? normalized
    : "UNKNOWN";
};

const diagnosticUnknown = (
  reason: string,
  warningReasons: string[],
  recordCount: number | null = null
): DiagnosticResponse => ({
  status: "UNKNOWN",
  reasons: [reason],
  warningReasons,
  recordCount,
  duplicateTransactionId: null,
});

const destinationIdentityMatches = (
  statusDestination: Record<string, unknown>,
  expectation: DiagnosticExpectation
): boolean => {
  const destination = asRecord(statusDestination.destination);
  if (!destination) return false;
  if (asNonEmptyString(destination.reference) !== expectation.destinationReference) return false;
  if (asNonEmptyString(destination.productDestinationId) !== expectation.googleAdsConversionActionId) {
    return false;
  }
  const operating = asRecord(destination.operatingAccount);
  if (
    !operating ||
    asNonEmptyString(operating.accountType) !== "GOOGLE_ADS" ||
    asNonEmptyString(operating.accountId) !== expectation.googleAdsAccountId
  ) {
    return false;
  }
  const login = asRecord(destination.loginAccount);
  if (
    login &&
    (asNonEmptyString(login.accountType) !== "GOOGLE_ADS" ||
      asNonEmptyString(login.accountId) !== expectation.googleAdsAccountId)
  ) {
    return false;
  }
  if (expectation.conversionType) {
    const observedType =
      asNonEmptyString(statusDestination.conversionType) ||
      asNonEmptyString(asRecord(statusDestination.eventsIngestionStatus)?.conversionType);
    if (observedType !== expectation.conversionType) return false;
  }
  if (expectation.stageType) {
    const observedStage =
      asNonEmptyString(statusDestination.stageType) ||
      asNonEmptyString(asRecord(statusDestination.eventsIngestionStatus)?.stageType);
    if (observedStage !== expectation.stageType) return false;
  }
  return true;
};

export const retrieveDataManagerStatus = async (
  accessToken: string,
  requestId: string,
  expectationOrFetch: DiagnosticExpectation | FetchLike,
  fetchImplArg?: FetchLike
): Promise<DiagnosticResponse> => {
  const legacyFixtureMode = typeof expectationOrFetch === "function";
  const expectation = legacyFixtureMode ? null : expectationOrFetch;
  const fetchImpl = legacyFixtureMode ? expectationOrFetch : (fetchImplArg || fetch);
  const url = new URL(GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL);
  url.searchParams.set("requestId", requestId);

  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(PROVIDER_HTTP_TIMEOUT_MS),
    });
  } catch {
    throw new ProviderRequestError("DIAGNOSTIC_NETWORK_ERROR", true);
  }

  const body = await response.text();
  if (!response.ok) {
    throw new ProviderRequestError(
      "DIAGNOSTIC_HTTP_ERROR",
      retryableHttpStatus(response.status),
      response.status,
      parseSafeErrorReason(body) || sanitizeHttpReason(response.status)
    );
  }

  const record = parseJsonRecord(body);
  const rawDestinations = Array.isArray(record?.requestStatusPerDestination)
    ? record.requestStatusPerDestination
    : [];
  const destinations = rawDestinations
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const warningReasons = destinations.flatMap(getWarningReasons).slice(0, 20);

  if (legacyFixtureMode) {
    const destination = destinations[0];
    if (!destination) {
      throw new ProviderRequestError("DIAGNOSTIC_RESPONSE_MALFORMED", false);
    }
    return {
      status: normalizeStatus(destination),
      reasons: getReasons(destination),
      warningReasons: getWarningReasons(destination),
      recordCount: getRecordCount(destination),
      duplicateTransactionId: getDuplicateTransactionId(destination),
    };
  }

  if (rawDestinations.length !== 1 || destinations.length !== 1) {
    return diagnosticUnknown("DIAGNOSTIC_DESTINATION_COUNT_MISMATCH", warningReasons);
  }
  const destination = destinations[0];
  const recordCount = getRecordCount(destination);
  if (!expectation || !destinationIdentityMatches(destination, expectation)) {
    return diagnosticUnknown(
      "DIAGNOSTIC_DESTINATION_MISMATCH",
      warningReasons,
      recordCount
    );
  }

  const status = normalizeStatus(destination);
  if (
    (status === "SUCCESS" || status === "FAILED" || status === "PARTIAL_SUCCESS") &&
    recordCount !== expectation.expectedRecordCount
  ) {
    return diagnosticUnknown(
      "DIAGNOSTIC_RECORD_COUNT_MISMATCH",
      warningReasons,
      recordCount
    );
  }

  return {
    status,
    reasons: getReasons(destination),
    warningReasons,
    recordCount,
    duplicateTransactionId: getDuplicateTransactionId(destination),
  };
};
