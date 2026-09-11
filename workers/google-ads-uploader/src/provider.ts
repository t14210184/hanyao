import {
  GOOGLE_DATA_MANAGER_EVENTS_URL,
  GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL,
  type FetchLike,
} from "./types.ts";
import type { DataManagerIngestRequest } from "./payload.ts";
import {
  ProviderRequestError,
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
      const field = asNonEmptyString(warning.field);
      const reason = sanitizeProviderReason(warning.reason);
      return field || reason ? { field, reason } : null;
    })
    .filter((warning): warning is DataManagerFieldWarning => Boolean(warning));
};

export interface IngestResponse {
  requestId: string;
  fieldWarnings: DataManagerFieldWarning[];
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
    });
  } catch {
    throw new ProviderRequestError("INGEST_NETWORK_ERROR", true);
  }

  const body = await response.text();
  if (!response.ok) {
    throw new ProviderRequestError(
      "INGEST_HTTP_ERROR",
      retryableHttpStatus(response.status),
      response.status,
      parseSafeErrorReason(body) || sanitizeHttpReason(response.status)
    );
  }

  const record = parseJsonRecord(body);
  const requestId = asNonEmptyString(record?.requestId);
  if (!requestId) {
    throw new ProviderRequestError("INGEST_REQUEST_ID_MISSING", false, response.status);
  }
  return { requestId, fieldWarnings: parseFieldWarnings(record) };
};

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

export const retrieveDataManagerStatus = async (
  accessToken: string,
  requestId: string,
  fetchImpl: FetchLike = fetch
): Promise<DiagnosticResponse> => {
  const url = new URL(GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL);
  url.searchParams.set("requestId", requestId);

  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
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
  const destinations = Array.isArray(record?.requestStatusPerDestination)
    ? record.requestStatusPerDestination
    : [];
  const destination = asRecord(destinations[0]);
  if (!destination) {
    throw new ProviderRequestError("DIAGNOSTIC_RESPONSE_MALFORMED", false);
  }
  const statusValue = sanitizeProviderReason(destination.requestStatus);
  const normalizedStatusValue = statusValue === "FAILURE" ? "FAILED" : statusValue;
  const status =
    normalizedStatusValue === "SUCCESS" ||
    normalizedStatusValue === "PROCESSING" ||
    normalizedStatusValue === "FAILED" ||
    normalizedStatusValue === "PARTIAL_SUCCESS"
      ? normalizedStatusValue
      : "UNKNOWN";
  return {
    status,
    reasons: getReasons(destination),
    warningReasons: getWarningReasons(destination),
    recordCount: getRecordCount(destination),
    duplicateTransactionId: getDuplicateTransactionId(destination),
  };
};
