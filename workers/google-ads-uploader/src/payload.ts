import type { UploaderConfig } from "./types.ts";
import type { ConversionOutboxRow } from "./types.ts";
import { buildDataManagerUserData, type DataManagerUserData } from "./enhanced-user-data.ts";

export const GOOGLE_ADS_DESTINATION_REFERENCE = "google-ads-destination";

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
  adIdentifiers: {
    gclid?: string;
    gbraid?: string;
    wbraid?: string;
  };
  userData?: DataManagerUserData;
  consent?: DataManagerConsent;
  eventSource: "MESSAGE";
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
export const buildDataManagerRequest = (
  row: ConversionOutboxRow,
  config: UploaderConfig
): DataManagerIngestRequest => {
  const adIdentifiers = getStoredClickIdentifiers(row);
  if (!adIdentifiers) throw new Error("ATTRIBUTION_IDENTIFIER_MISSING");
  const accountId = row.google_ads_account_id?.trim();
  const conversionActionId = row.google_ads_conversion_action_id?.trim();
  if (
    !row.business_conversion_id ||
    !row.snapshot_version || row.snapshot_version < 1 ||
    !row.eligibility_rule_version ||
    row.event_source !== "MESSAGE" ||
    !accountId || !conversionActionId
  ) {
    throw new Error("CANONICAL_OUTBOX_SNAPSHOT_INVALID");
  }
  if (
    accountId !== config.googleAdsAccountId ||
    conversionActionId !== config.googleAdsConversionActionId
  ) {
    throw new Error("CANONICAL_DESTINATION_MISMATCH");
  }
  const reference = GOOGLE_ADS_DESTINATION_REFERENCE;
  const account = {
    accountType: "GOOGLE_ADS" as const,
    accountId,
  };
  const enhancedUserData =
    config.enhancedUserDataEnabled && config.adUserDataConsentGranted
      ? buildDataManagerUserData(row.enhanced_user_identifiers)
      : null;

  const event: DataManagerEvent = {
    destinationReferences: [reference],
    transactionId: row.transaction_id,
    eventTimestamp: row.event_timestamp,
    adIdentifiers,
    eventSource: "MESSAGE",
  };

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
