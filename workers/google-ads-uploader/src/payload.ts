import type {
  ConversionOutboxRow,
  ConversionType,
  DataManagerEventSource,
  UploaderConfig,
} from "./types.ts";
import { buildDataManagerUserData, type DataManagerUserData } from "./enhanced-user-data.ts";

export const GOOGLE_ADS_DESTINATION_REFERENCE = "google-ads-destination";
export const VERIFIED_LINE_CONTACT_DESTINATION_KEY = "HY_VERIFIED_LINE_CONTACT";
export const QUALIFIED_LINE_LEAD_DESTINATION_KEY = "HY_QUALIFIED_LINE_LEAD";
export const WON_JOB_DESTINATION_KEY = "HY_WON_JOB";

export interface GoogleAdsProductAccount {
  accountType: "GOOGLE_ADS";
  accountId: string;
}

export interface DataManagerDestination {
  reference: string;
  loginAccount: GoogleAdsProductAccount;
  operatingAccount: GoogleAdsProductAccount;
  productDestinationId: string;
}

export interface DataManagerConsent {
  adUserData: "CONSENT_GRANTED";
}

export interface DataManagerEvent {
  destinationReferences: string[];
  transactionId: string;
  eventTimestamp: string;
  adIdentifiers?: {
    gclid?: string;
    gbraid?: string;
    wbraid?: string;
  };
  userData?: DataManagerUserData;
  consent?: DataManagerConsent;
  eventSource: DataManagerEventSource;
  conversionValueMicros?: number;
  currencyCode?: string;
}

export interface DataManagerIngestRequest {
  destinations: DataManagerDestination[];
  events: DataManagerEvent[];
  encoding?: "HEX";
  validateOnly: boolean;
}

export const getStoredClickIdentifiers = (
  row: Pick<ConversionOutboxRow, "gclid" | "gbraid" | "wbraid">
): DataManagerEvent["adIdentifiers"] | null => {
  const identifiers: DataManagerEvent["adIdentifiers"] = {};
  if (row.gclid) identifiers.gclid = row.gclid;
  if (row.gbraid) identifiers.gbraid = row.gbraid;
  if (row.wbraid) identifiers.wbraid = row.wbraid;
  return Object.keys(identifiers).length > 0 ? identifiers : null;
};

export interface ResolvedDestination {
  conversionType: ConversionType;
  destinationKey: string;
  conversionActionId: string;
  allowedEventSources: readonly DataManagerEventSource[];
  userDataOnlyEligible: boolean;
}

export const stageTypeForConversionType = (
  conversionType: ConversionType
): "VERIFIED_LINE_CONTACT" | "QUALIFIED_CONFIRMED" | "WON_JOB" =>
  conversionType === "verified_line_contact"
    ? "VERIFIED_LINE_CONTACT"
    : conversionType === "qualified_line_lead"
      ? "QUALIFIED_CONFIRMED"
      : "WON_JOB";

/**
 * Exact allowlist. A later-stage action is unavailable until its provider
 * readback ID is explicitly configured; no fallback to the Verified action is
 * permitted.
 */
export const resolveDestination = (
  conversionType: ConversionType | string,
  config: UploaderConfig
): ResolvedDestination | null => {
  if (conversionType === "verified_line_contact") {
    return {
      conversionType: "verified_line_contact",
      destinationKey: VERIFIED_LINE_CONTACT_DESTINATION_KEY,
      conversionActionId: config.googleAdsConversionActionId,
      allowedEventSources: ["MESSAGE"],
      userDataOnlyEligible: false,
    };
  }
  if (conversionType === "qualified_line_lead") {
    const actionId = config.qualifiedLineLeadConversionActionId?.trim();
    return actionId
      ? {
          conversionType: "qualified_line_lead",
          destinationKey: QUALIFIED_LINE_LEAD_DESTINATION_KEY,
          conversionActionId: actionId,
          allowedEventSources: ["MESSAGE", "PHONE"],
          userDataOnlyEligible: Boolean(config.qualifiedUserDataOnlyProviderProof),
        }
      : null;
  }
  if (conversionType === "won_job") {
    const actionId = config.wonJobConversionActionId?.trim();
    return actionId
      ? {
          conversionType: "won_job",
          destinationKey: WON_JOB_DESTINATION_KEY,
          conversionActionId: actionId,
          allowedEventSources: ["OTHER"],
          userDataOnlyEligible: Boolean(config.qualifiedUserDataOnlyProviderProof),
        }
      : null;
  }
  return null;
};

const assertCanonicalStageSnapshot = (
  row: ConversionOutboxRow,
  destination: ResolvedDestination,
  expectedAccountId: string
): void => {
  if (
    !row.business_conversion_id ||
    !row.snapshot_version ||
    row.snapshot_version < 1 ||
    !row.eligibility_rule_version ||
    (destination.conversionType !== "verified_line_contact" && !row.stage_event_id)
  ) {
    throw new Error("CANONICAL_OUTBOX_SNAPSHOT_INVALID");
  }
  if (!row.event_source || !destination.allowedEventSources.includes(row.event_source)) {
    throw new Error("CANONICAL_EVENT_SOURCE_MISMATCH");
  }
  const accountId = row.google_ads_account_id?.trim();
  const conversionActionId = row.google_ads_conversion_action_id?.trim();
  if (!accountId || !conversionActionId) {
    throw new Error("CANONICAL_OUTBOX_SNAPSHOT_INVALID");
  }
  if (
    row.destination_key !== destination.destinationKey ||
    accountId !== expectedAccountId ||
    conversionActionId !== destination.conversionActionId
  ) {
    throw new Error("CANONICAL_DESTINATION_MISMATCH");
  }
};

export const buildDataManagerRequest = (
  row: ConversionOutboxRow,
  config: UploaderConfig
): DataManagerIngestRequest => {
  const destination = resolveDestination(row.conversion_type, config);
  if (!destination) {
    throw new Error(
      row.conversion_type === "qualified_line_lead" || row.conversion_type === "won_job"
        ? "CANONICAL_DESTINATION_UNAVAILABLE"
        : "UNKNOWN_CONVERSION_TYPE"
    );
  }
  assertCanonicalStageSnapshot(row, destination, config.googleAdsAccountId);
  const adIdentifiers = getStoredClickIdentifiers(row);
  const accountId = row.google_ads_account_id as string;
  const conversionActionId = row.google_ads_conversion_action_id as string;
  const reference = GOOGLE_ADS_DESTINATION_REFERENCE;
  const account = {
    accountType: "GOOGLE_ADS" as const,
    accountId,
  };
  const perRecordConsentGranted =
    row.consent_state === "GRANTED" &&
    Boolean(row.consent_source?.trim()) &&
    Boolean(row.consent_observed_at?.trim()) &&
    Boolean(row.consent_policy_version?.trim());
  const enhancedUserData =
    config.enhancedUserDataEnabled &&
    config.adUserDataConsentGranted &&
    perRecordConsentGranted
      ? buildDataManagerUserData(row.enhanced_user_identifiers)
      : null;

  if (
    !adIdentifiers &&
    (destination.conversionType === "verified_line_contact" ||
      !enhancedUserData ||
      !destination.userDataOnlyEligible)
  ) {
    throw new Error("ATTRIBUTION_IDENTIFIER_MISSING");
  }
  if (
    destination.conversionType === "won_job" &&
    (!Number.isSafeInteger(row.conversion_value_micros) ||
      Number(row.conversion_value_micros) <= 0 ||
      !/^[A-Z]{3}$/.test(row.currency_code ?? ""))
  ) {
    throw new Error("WON_JOB_VALUE_MISSING");
  }

  const event: DataManagerEvent = {
    destinationReferences: [reference],
    transactionId: row.transaction_id,
    eventTimestamp: row.event_timestamp,
    ...(adIdentifiers ? { adIdentifiers } : {}),
    eventSource: row.event_source as DataManagerEventSource,
  };

  if (destination.conversionType === "won_job") {
    event.conversionValueMicros = Number(row.conversion_value_micros);
    event.currencyCode = row.currency_code as string;
  }

  if (enhancedUserData) {
    event.userData = enhancedUserData;
    event.consent = { adUserData: "CONSENT_GRANTED" };
  }

  return {
    destinations: [
      {
        reference,
        loginAccount: account,
        operatingAccount: account,
        productDestinationId: conversionActionId,
      },
    ],
    events: [event],
    ...(enhancedUserData ? { encoding: "HEX" as const } : {}),
    validateOnly: config.validateOnly,
  };
};
