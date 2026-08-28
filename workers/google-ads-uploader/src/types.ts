import type { D1Database } from "@cloudflare/workers-types";

export const GOOGLE_DATA_MANAGER_EVENTS_URL =
  "https://datamanager.googleapis.com/v1/events:ingest";
export const GOOGLE_DATA_MANAGER_REQUEST_STATUS_URL =
  "https://datamanager.googleapis.com/v1/requestStatus:retrieve";
export const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GOOGLE_DATA_MANAGER_SCOPE =
  "https://www.googleapis.com/auth/datamanager";
export const GOOGLE_CLOUD_PLATFORM_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform";

export const DEFAULT_GOOGLE_ADS_ACCOUNT_ID = "4801404246";
export const DEFAULT_GOOGLE_ADS_CONVERSION_ACTION_ID = "7674301565";
export const DEFAULT_BATCH_SIZE = 5;
export const MAX_UPLOAD_ATTEMPTS = 8;
export const DIAGNOSTIC_TIMEBOX_MS = 24 * 60 * 60 * 1000;
export const FIRST_DIAGNOSTIC_DELAY_MS = 30 * 60 * 1000;
export const DIAGNOSTIC_DELAY_CAP_MS = 60 * 60 * 1000;

export const RETRY_DELAYS_MS = [
  5 * 60 * 1000,
  10 * 60 * 1000,
  20 * 60 * 1000,
  40 * 60 * 1000,
  60 * 60 * 1000,
] as const;

export type OutboxStatus =
  | "pending"
  | "processing"
  | "validated_only"
  | "submitted"
  | "success"
  | "failed"
  | "deduplicated"
  | "sent";

export type DiagnosticStatus =
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "PARTIAL_SUCCESS"
  | "RETRYABLE_ERROR"
  | "TIMEBOX_EXCEEDED"
  | "UNKNOWN";

export interface ConversionOutboxRow {
  conversion_id: string;
  lead_token: string;
  conversion_type: "verified_line_contact";
  event_timestamp: string;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  attribution_touch: "last" | "first" | null;
  transaction_id: string;
  destination_key: string;
  status: OutboxStatus;
  retry_count: number;
  next_retry_at: string | null;
  last_error_code: string | null;
  created_at: string;
  sent_at: string | null;
  submitted_at: string | null;
  google_request_id: string | null;
  next_diagnostic_at: string | null;
  terminal_result: string | null;
  last_error_reason: string | null;
  diagnostic_status: DiagnosticStatus | null;
  diagnostic_record_count: number | null;
  diagnostic_error_reason: string | null;
  diagnostic_attempt_count: number;
  updated_at: string;
}
export interface UploaderEnv {
  ATTRIBUTION_DB: D1Database;
  GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?: string;
  GOOGLE_ADS_ACCOUNT_ID?: string;
  GOOGLE_ADS_CONVERSION_ACTION_ID?: string;
  GOOGLE_DATA_MANAGER_VALIDATE_ONLY?: string;
  UPLOADER_ENVIRONMENT?: string;
  PRODUCTION_HUMAN_GATE?: string;
}

export interface UploaderConfig {
  googleAdsAccountId: string;
  googleAdsConversionActionId: string;
  validateOnly: boolean;
}

export interface OutboxRepository {
  listDueUploads(nowIso: string, limit: number): Promise<ConversionOutboxRow[]>;
  claimUpload(
    conversionId: string,
    nowIso: string
  ): Promise<ConversionOutboxRow | null>;
  listDueDiagnostics(
    nowIso: string,
    limit: number
  ): Promise<ConversionOutboxRow[]>;
  claimDiagnostic(
    conversionId: string,
    nowIso: string
  ): Promise<ConversionOutboxRow | null>;
  save(row: ConversionOutboxRow): Promise<void>;
}

export type FetchLike = typeof fetch;

export interface UploaderLogger {
  info?(message: string, details?: Record<string, string | number | null>): void;
  warn?(message: string, details?: Record<string, string | number | null>): void;
}
