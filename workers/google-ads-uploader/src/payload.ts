import type { UploaderConfig } from "./types.ts";
import type { ConversionOutboxRow } from "./types.ts";

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

export interface DataManagerEvent {
  destinationReferences: string[];
  transactionId: string;
  eventTimestamp: string;
  adIdentifiers: {
    gclid?: string;
    gbraid?: string;
    wbraid?: string;
  };
  eventSource: "MESSAGE";
}

export interface DataManagerIngestRequest {
  destinations: DataManagerDestination[];
  events: DataManagerEvent[];
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
  const reference = "google-ads-destination";
  const account = {
    accountType: "GOOGLE_ADS" as const,
    accountId: config.googleAdsAccountId,
  };
  return {
    destinations: [
      {
        reference,
        loginAccount: account,
        operatingAccount: account,
        productDestinationId: config.googleAdsConversionActionId,
      },
    ],
    events: [
      {
        destinationReferences: [reference],
        transactionId: row.transaction_id,
        eventTimestamp: row.event_timestamp,
        adIdentifiers,
        eventSource: "MESSAGE",
      },
    ],
    validateOnly: config.validateOnly,
  };
};
