import {
  DEFAULT_GOOGLE_ADS_ACCOUNT_ID,
  DEFAULT_GOOGLE_ADS_CONVERSION_ACTION_ID,
  type UploaderConfig,
  type UploaderEnv,
} from "./types.ts";

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

const safeAccountId = (value: string | undefined, fallback: string): string => {
  const candidate = value?.trim() || fallback;
  if (value?.trim() && candidate !== fallback) {
    throw new Error("GOOGLE_DESTINATION_CONFIGURATION_MISMATCH");
  }
  if (!/^\d{6,20}$/.test(candidate)) {
    throw new Error("INVALID_GOOGLE_ACCOUNT_CONFIGURATION");
  }
  return candidate;
};

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
  };
};
