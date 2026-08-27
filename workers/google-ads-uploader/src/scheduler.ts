import { getUploaderConfig } from "./config.ts";
import { exchangeServiceAccountToken } from "./auth.ts";
import { ProviderRequestError, sanitizeProviderReason } from "./errors.ts";
import { buildDataManagerRequest } from "./payload.ts";
import { D1OutboxRepository } from "./repository.ts";
import {
  DIAGNOSTIC_DELAY_CAP_MS,
  DIAGNOSTIC_TIMEBOX_MS,
  FIRST_DIAGNOSTIC_DELAY_MS,
  MAX_UPLOAD_ATTEMPTS,
  RETRY_DELAYS_MS,
  type ConversionOutboxRow,
  type FetchLike,
  type OutboxRepository,
  type UploaderEnv,
  type UploaderLogger,
} from "./types.ts";
import {
  ingestDataManagerEvent,
  retrieveDataManagerStatus,
} from "./provider.ts";

export const MAX_ROWS_PER_SCHEDULE = 5;
export const DUPLICATE_TRANSACTION_REASON =
  "PROCESSING_ERROR_REASON_DUPLICATE_TRANSACTION_ID";

const boundedRandom = (random: () => number): number => {
  const value = random();
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.5;
};

export const nextRetryAt = (
  nowIso: string,
  attemptCount: number,
  random: () => number = Math.random
): string => {
  const index = Math.min(
    Math.max(Math.floor(attemptCount) - 1, 0),
    RETRY_DELAYS_MS.length - 1
  );
  const base = RETRY_DELAYS_MS[index];
  const jitterFactor = 0.9 + boundedRandom(random) * 0.2;
  return new Date(Date.parse(nowIso) + Math.round(base * jitterFactor)).toISOString();
};

export const nextDiagnosticAt = (
  submittedAtIso: string,
  diagnosticAttemptCount: number,
  random: () => number = Math.random
): string => {
  const exponential = FIRST_DIAGNOSTIC_DELAY_MS * Math.pow(1.3, diagnosticAttemptCount);
  const base = Math.min(exponential, DIAGNOSTIC_DELAY_CAP_MS);
  // Jitter is non-negative so the first diagnostic is never earlier than 30m.
  const jitterFactor = 1 + boundedRandom(random) * 0.2;
  return new Date(
    Date.parse(submittedAtIso) + Math.min(base * jitterFactor, DIAGNOSTIC_DELAY_CAP_MS)
  ).toISOString();
};

const asProviderError = (error: unknown, fallbackCode: string): ProviderRequestError =>
  error instanceof ProviderRequestError
    ? error
    : new ProviderRequestError(fallbackCode, true);

const writeFailure = async (
  repository: OutboxRepository,
  row: ConversionOutboxRow,
  error: ProviderRequestError,
  nowIso: string,
  random: () => number
): Promise<void> => {
  row.last_error_code = error.code;
  row.last_error_reason =
    error.providerReason || (error.httpStatus ? `HTTP_${error.httpStatus}` : error.code);
  row.updated_at = nowIso;
  if (error.retryable && row.retry_count < MAX_UPLOAD_ATTEMPTS) {
    row.status = "pending";
    row.next_retry_at = nextRetryAt(nowIso, row.retry_count, random);
    row.terminal_result = null;
  } else {
    row.status = "failed";
    row.next_retry_at = null;
    row.terminal_result = error.code;
  }
  await repository.save(row);
};

const writeMissingIdentifier = async (
  repository: OutboxRepository,
  row: ConversionOutboxRow,
  nowIso: string
): Promise<void> => {
  row.status = "failed";
  row.next_retry_at = null;
  row.last_error_code = "ATTRIBUTION_IDENTIFIER_MISSING";
  row.last_error_reason = "ATTRIBUTION_IDENTIFIER_MISSING";
  row.terminal_result = "ATTRIBUTION_IDENTIFIER_MISSING";
  row.updated_at = nowIso;
  await repository.save(row);
};

const writeSubmitted = async (
  repository: OutboxRepository,
  row: ConversionOutboxRow,
  requestId: string,
  nowIso: string,
  random: () => number
): Promise<void> => {
  row.status = "submitted";
  row.next_retry_at = null;
  row.last_error_code = null;
  row.last_error_reason = null;
  row.google_request_id = requestId;
  row.submitted_at = nowIso;
  row.next_diagnostic_at = nextDiagnosticAt(nowIso, 0, random);
  row.terminal_result = null;
  row.diagnostic_status = null;
  row.diagnostic_record_count = null;
  row.diagnostic_error_reason = null;
  row.diagnostic_attempt_count = 0;
  row.updated_at = nowIso;
  await repository.save(row);
};

const writeDiagnosticRetry = async (
  repository: OutboxRepository,
  row: ConversionOutboxRow,
  error: ProviderRequestError,
  nowIso: string,
  random: () => number
): Promise<void> => {
  row.status = "submitted";
  row.next_diagnostic_at = nextDiagnosticAt(
    row.submitted_at || nowIso,
    row.diagnostic_attempt_count,
    random
  );
  row.diagnostic_status = "RETRYABLE_ERROR";
  row.last_error_code = error.code;
  row.last_error_reason =
    error.providerReason || (error.httpStatus ? `HTTP_${error.httpStatus}` : error.code);
  row.diagnostic_error_reason = row.last_error_reason;
  row.updated_at = nowIso;
  await repository.save(row);
};

const writeDiagnosticTerminal = async (
  repository: OutboxRepository,
  row: ConversionOutboxRow,
  status: "success" | "failed" | "deduplicated",
  terminalResult: string,
  diagnosticStatus: "SUCCESS" | "FAILED" | "PARTIAL_SUCCESS" | "TIMEBOX_EXCEEDED" | "UNKNOWN",
  reason: string | null,
  recordCount: number | null,
  nowIso: string
): Promise<void> => {
  row.status = status;
  row.next_diagnostic_at = null;
  row.terminal_result = terminalResult;
  row.diagnostic_status = diagnosticStatus;
  row.diagnostic_record_count = recordCount;
  row.diagnostic_error_reason = reason;
  row.last_error_reason = reason;
  row.last_error_code = status === "success" || status === "deduplicated" ? null : terminalResult;
  row.updated_at = nowIso;
  await repository.save(row);
};

const isPastDiagnosticTimebox = (
  row: ConversionOutboxRow,
  nowIso: string
): boolean =>
  Boolean(
    row.submitted_at &&
      Date.parse(nowIso) - Date.parse(row.submitted_at) >= DIAGNOSTIC_TIMEBOX_MS
  );

const acquireTokenFactory = (
  env: UploaderEnv,
  fetchImpl: FetchLike,
  now: Date
): (() => Promise<string>) => {
  let tokenPromise: Promise<string> | null = null;
  return () => {
    if (!tokenPromise) {
      const serialized = env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON;
      if (!serialized) {
        tokenPromise = Promise.reject(
          new ProviderRequestError("AUTH_CREDENTIAL_MISSING", true)
        );
      } else {
        tokenPromise = exchangeServiceAccountToken(serialized, fetchImpl, now).then(
          (result) => result.accessToken
        );
      }
    }
    return tokenPromise;
  };
};

const processUpload = async (
  repository: OutboxRepository,
  row: ConversionOutboxRow,
  config: ReturnType<typeof getUploaderConfig>,
  acquireToken: () => Promise<string>,
  fetchImpl: FetchLike,
  nowIso: string,
  random: () => number
): Promise<void> => {
  let request;
  try {
    request = buildDataManagerRequest(row, config);
  } catch (error) {
    if (error instanceof Error && error.message === "ATTRIBUTION_IDENTIFIER_MISSING") {
      await writeMissingIdentifier(repository, row, nowIso);
      return;
    }
    await writeFailure(
      repository,
      row,
      new ProviderRequestError("LOCAL_PAYLOAD_INVALID", false),
      nowIso,
      random
    );
    return;
  }

  let accessToken: string;
  try {
    accessToken = await acquireToken();
  } catch (error) {
    await writeFailure(
      repository,
      row,
      asProviderError(error, "AUTH_TOKEN_ACQUISITION_FAILED"),
      nowIso,
      random
    );
    return;
  }

  try {
    const response = await ingestDataManagerEvent(accessToken, request, fetchImpl);
    await writeSubmitted(repository, row, response.requestId, nowIso, random);
  } catch (error) {
    await writeFailure(
      repository,
      row,
      asProviderError(error, "INGEST_REQUEST_FAILED"),
      nowIso,
      random
    );
  }
};

const processDiagnostic = async (
  repository: OutboxRepository,
  row: ConversionOutboxRow,
  acquireToken: () => Promise<string>,
  fetchImpl: FetchLike,
  nowIso: string,
  random: () => number
): Promise<void> => {
  if (!row.google_request_id || !row.submitted_at) {
    await writeDiagnosticTerminal(
      repository,
      row,
      "failed",
      "DIAGNOSTIC_PREREQUISITE_MISSING",
      "UNKNOWN",
      "DIAGNOSTIC_PREREQUISITE_MISSING",
      null,
      nowIso
    );
    return;
  }
  if (isPastDiagnosticTimebox(row, nowIso)) {
    await writeDiagnosticTerminal(
      repository,
      row,
      "failed",
      "DIAGNOSTIC_TIMEBOX_EXCEEDED",
      "TIMEBOX_EXCEEDED",
      "DIAGNOSTIC_TIMEBOX_EXCEEDED",
      row.diagnostic_record_count,
      nowIso
    );
    return;
  }

  let accessToken: string;
  try {
    accessToken = await acquireToken();
  } catch (error) {
    const providerError = asProviderError(error, "AUTH_TOKEN_ACQUISITION_FAILED");
    if (providerError.retryable) {
      await writeDiagnosticRetry(repository, row, providerError, nowIso, random);
    } else {
      await writeDiagnosticTerminal(
        repository,
        row,
        "failed",
        providerError.code,
        "FAILED",
        providerError.providerReason || providerError.code,
        row.diagnostic_record_count,
        nowIso
      );
    }
    return;
  }

  try {
    const response = await retrieveDataManagerStatus(
      accessToken,
      row.google_request_id,
      fetchImpl
    );
    const reason = response.reasons[0] || null;
    if (response.status === "SUCCESS") {
      await writeDiagnosticTerminal(
        repository,
        row,
        "success",
        "SUCCESS",
        "SUCCESS",
        null,
        response.recordCount,
        nowIso
      );
      return;
    }
    if (response.status === "PROCESSING") {
      row.status = "submitted";
      row.next_diagnostic_at = nextDiagnosticAt(
        row.submitted_at,
        row.diagnostic_attempt_count,
        random
      );
      row.diagnostic_status = "PROCESSING";
      row.diagnostic_record_count = response.recordCount;
      row.diagnostic_error_reason = null;
      row.last_error_code = null;
      row.last_error_reason = null;
      row.updated_at = nowIso;
      await repository.save(row);
      return;
    }
    if (response.status === "FAILED" && response.reasons.includes(DUPLICATE_TRANSACTION_REASON)) {
      const matchingTransaction =
        !response.duplicateTransactionId ||
        response.duplicateTransactionId === row.transaction_id;
      if (matchingTransaction) {
        await writeDiagnosticTerminal(
          repository,
          row,
          "deduplicated",
          "DEDUPLICATED_SUCCESS_EQUIVALENT",
          "FAILED",
          DUPLICATE_TRANSACTION_REASON,
          response.recordCount,
          nowIso
        );
        return;
      }
    }
    if (response.status === "PARTIAL_SUCCESS") {
      await writeDiagnosticTerminal(
        repository,
        row,
        "failed",
        "PARTIAL_SUCCESS_HUMAN_REVIEW",
        "PARTIAL_SUCCESS",
        reason || "PARTIAL_SUCCESS",
        response.recordCount,
        nowIso
      );
      return;
    }
    if (response.status === "FAILED") {
      await writeDiagnosticTerminal(
        repository,
        row,
        "failed",
        "DIAGNOSTIC_FAILED",
        "FAILED",
        reason || "DIAGNOSTIC_FAILED",
        response.recordCount,
        nowIso
      );
      return;
    }
    await writeDiagnosticTerminal(
      repository,
      row,
      "failed",
      "DIAGNOSTIC_STATUS_UNKNOWN",
      "UNKNOWN",
      "DIAGNOSTIC_STATUS_UNKNOWN",
      response.recordCount,
      nowIso
    );
  } catch (error) {
    const providerError = asProviderError(error, "DIAGNOSTIC_REQUEST_FAILED");
    if (providerError.retryable && !isPastDiagnosticTimebox(row, nowIso)) {
      await writeDiagnosticRetry(repository, row, providerError, nowIso, random);
      return;
    }
    await writeDiagnosticTerminal(
      repository,
      row,
      "failed",
      providerError.code,
      "FAILED",
      providerError.providerReason || providerError.code,
      row.diagnostic_record_count,
      nowIso
    );
  }
};

export interface ScheduledCycleOptions {
  now?: Date;
  fetchImpl?: FetchLike;
  random?: () => number;
  repository?: OutboxRepository;
  logger?: UploaderLogger;
}

export interface ScheduledCycleSummary {
  uploadCandidates: number;
  diagnosticCandidates: number;
  claimedRows: number;
}

export const runScheduledCycle = async (
  env: UploaderEnv,
  options: ScheduledCycleOptions = {}
): Promise<ScheduledCycleSummary> => {
  const now = options.now || new Date();
  const nowIso = now.toISOString();
  const fetchImpl = options.fetchImpl || fetch;
  const random = options.random || Math.random;
  const repository = options.repository || new D1OutboxRepository(env.ATTRIBUTION_DB);
  const config = getUploaderConfig(env);
  const acquireToken = acquireTokenFactory(env, fetchImpl, now);

  const uploadCandidates = await repository.listDueUploads(nowIso, MAX_ROWS_PER_SCHEDULE);
  let claimedRows = 0;
  let remaining = MAX_ROWS_PER_SCHEDULE;
  for (const candidate of uploadCandidates) {
    if (remaining <= 0) break;
    const row = await repository.claimUpload(candidate.conversion_id, nowIso);
    if (!row) continue;
    claimedRows += 1;
    remaining -= 1;
    await processUpload(
      repository,
      row,
      config,
      acquireToken,
      fetchImpl,
      nowIso,
      random
    );
  }

  const diagnosticCandidates = await repository.listDueDiagnostics(nowIso, remaining);
  for (const candidate of diagnosticCandidates) {
    if (remaining <= 0) break;
    const row = await repository.claimDiagnostic(candidate.conversion_id, nowIso);
    if (!row) continue;
    claimedRows += 1;
    remaining -= 1;
    await processDiagnostic(
      repository,
      row,
      acquireToken,
      fetchImpl,
      nowIso,
      random
    );
  }

  options.logger?.info?.("google-ads-uploader cycle complete", {
    upload_candidates: uploadCandidates.length,
    diagnostic_candidates: diagnosticCandidates.length,
    claimed_rows: claimedRows,
  });
  return {
    uploadCandidates: uploadCandidates.length,
    diagnosticCandidates: diagnosticCandidates.length,
    claimedRows,
  };
};
