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

export interface IngestResponse {
  requestId: string;
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
  return { requestId };
};

export interface DiagnosticResponse {
  status: "SUCCESS" | "PROCESSING" | "FAILED" | "PARTIAL_SUCCESS" | "UNKNOWN";
  reasons: string[];
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

const getReasons = (destination: Record<string, unknown>): string[] => {
  const errorInfo = asRecord(destination.errorInfo);
  const counts = Array.isArray(errorInfo?.errorCounts)
    ? errorInfo.errorCounts
    : [];
  return counts
    .map((entry) => {
      const count = asRecord(entry);
      return sanitizeProviderReason(count?.reason);
    })
    .filter((reason): reason is string => Boolean(reason));
};

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
  const status =
    statusValue === "SUCCESS" ||
    statusValue === "PROCESSING" ||
    statusValue === "FAILED" ||
    statusValue === "PARTIAL_SUCCESS"
      ? statusValue
      : "UNKNOWN";
  return {
    status,
    reasons: getReasons(destination),
    recordCount: getRecordCount(destination),
    duplicateTransactionId: getDuplicateTransactionId(destination),
  };
};
