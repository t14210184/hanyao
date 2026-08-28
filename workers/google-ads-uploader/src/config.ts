import {
  DEFAULT_GOOGLE_ADS_ACCOUNT_ID,
  DEFAULT_GOOGLE_ADS_CONVERSION_ACTION_ID,
  type UploaderConfig,
  type UploaderEnv,
} from "./types.ts";

export const DEFAULT_TERMINAL_RETENTION_DAYS = 90;
export const MAX_TERMINAL_RETENTION_DAYS = 365;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const isKnownEnvironment = (value: string | undefined): boolean =>
  value === "local" || value === "preview" || value === "production";

/**
 * Fail closed. A false value is only honored with the exact production human
 * gate marker; local and preview can never perform real ingestion.
 */
export const resolveValidateOnly = (
  rawValue: unknown,
  environment = "local",
  humanGate = ""
): boolean => {
  if (rawValue !== "true" && rawValue !== "false") return true;
  if (rawValue === "true") return true;
  return !(environment === "production" && humanGate === "HUMAN_GATE_CONFIRMED");
};

const safeAccountId = (value: string | undefined, expected: string): string => {
  const candidate = value?.trim();
  if (!candidate) {
    throw new Error("GOOGLE_DESTINATION_CONFIGURATION_MISSING");
  }
  if (!/^\d{6,20}$/.test(candidate)) {
    throw new Error("INVALID_GOOGLE_ACCOUNT_CONFIGURATION");
  }
  if (candidate !== expected) {
    throw new Error("GOOGLE_DESTINATION_CONFIGURATION_MISMATCH");
  }
  return candidate;
};

const resolveTerminalRetentionDays = (
  value: string | undefined
): number | null => {
  if (value === undefined) return null;
  const candidate = value.trim();
  if (!/^\d+$/.test(candidate)) {
    throw new Error("OUTBOX_RETENTION_DAYS_INVALID");
  }
  const days = Number(candidate);
  if (
    !Number.isSafeInteger(days) ||
    days <= 0 ||
    days > MAX_TERMINAL_RETENTION_DAYS
  ) {
    throw new Error("OUTBOX_RETENTION_DAYS_INVALID");
  }
  return days;
};

export const computeTerminalRetentionCutoff = (
  now: Date,
  retentionDays: number
): string =>
  new Date(now.getTime() - retentionDays * MILLISECONDS_PER_DAY).toISOString();

export const getUploaderConfig = (env: UploaderEnv): UploaderConfig => {
  const environment = isKnownEnvironment(env.UPLOADER_ENVIRONMENT)
    ? env.UPLOADER_ENVIRONMENT
    : "local";
  const validateOnly = resolveValidateOnly(
    env.GOOGLE_DATA_MANAGER_VALIDATE_ONLY,
    environment,
    env.PRODUCTION_HUMAN_GATE
  );
  if (environment === "production" && validateOnly) {
    throw new Error("PRODUCTION_VALIDATE_ONLY_MISCONFIGURED");
  }
  return {
    googleAdsAccountId: safeAccountId(
      env.GOOGLE_ADS_ACCOUNT_ID,
      DEFAULT_GOOGLE_ADS_ACCOUNT_ID
    ),
    googleAdsConversionActionId: safeAccountId(
      env.GOOGLE_ADS_CONVERSION_ACTION_ID,
      DEFAULT_GOOGLE_ADS_CONVERSION_ACTION_ID
    ),
    validateOnly,
    terminalRetentionDays: resolveTerminalRetentionDays(
      env.GOOGLE_OUTBOX_TERMINAL_RETENTION_DAYS
    ),
  };
};
