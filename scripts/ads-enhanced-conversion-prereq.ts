import {
  hasGoogleAdsAuthInput,
  resolveGoogleAdsAccessToken,
} from "./google-ads-provider-auth.ts";

export const HQ05_GOOGLE_ADS_API_VERSION = "v25";
export const HQ05_CUSTOMER_ID = "4801404246";
export const HQ05_CANONICAL_CONVERSION_ACTION_ID = "7674301565";

type RecordLike = Record<string, unknown>;

export interface Hq05CustomerPrerequisites {
  customerId: string;
  autoTaggingEnabled: boolean;
  acceptedCustomerDataTerms: boolean;
  enhancedConversionsForLeadsEnabled: boolean;
  conversionTrackingStatus: string;
  googleAdsConversionCustomer: string | null;
}

export interface Hq05CanonicalConversion {
  id: string;
  name: string;
  status: string;
  type: string;
  category: string;
  countingType: string;
  primaryForGoal: boolean;
  includeInConversionsMetric: boolean;
  origin: string;
  ownerCustomer: string | null;
}

export interface Hq05PrerequisiteVerdict {
  result: "READY" | "BLOCKED";
  customer: Hq05CustomerPrerequisites;
  canonicalConversion: Hq05CanonicalConversion;
  destinationShapeCompatible: boolean;
  blockingReasons: string[];
}

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const asBoolean = (value: unknown): boolean =>
  value === true || value === "true";

const searchRows = (payload: unknown): RecordLike[] => {
  const chunks = Array.isArray(payload) ? payload : [payload];
  const rows: RecordLike[] = [];
  for (const chunk of chunks) {
    const record = asRecord(chunk);
    const results = Array.isArray(record?.results) ? record.results : [];
    for (const result of results) {
      const row = asRecord(result);
      if (row) rows.push(row);
    }
  }
  return rows;
};

export const buildHq05CustomerQuery = (): string => `SELECT
  customer.id,
  customer.auto_tagging_enabled,
  customer.conversion_tracking_setting.accepted_customer_data_terms,
  customer.conversion_tracking_setting.enhanced_conversions_for_leads_enabled,
  customer.conversion_tracking_setting.conversion_tracking_status,
  customer.conversion_tracking_setting.google_ads_conversion_customer
FROM customer`;

export const buildHq05CanonicalConversionQuery = (): string => `SELECT
  conversion_action.id,
  conversion_action.name,
  conversion_action.status,
  conversion_action.type,
  conversion_action.category,
  conversion_action.counting_type,
  conversion_action.primary_for_goal,
  conversion_action.include_in_conversions_metric,
  conversion_action.origin,
  conversion_action.owner_customer
FROM conversion_action
WHERE conversion_action.id = ${HQ05_CANONICAL_CONVERSION_ACTION_ID}`;

const readSearchStream = async (
  accessToken: string,
  loginCustomerId: string | null,
  query: string,
  fetchImpl: typeof fetch
): Promise<RecordLike[]> => {
  if (!accessToken || /\s/.test(accessToken)) {
    throw new Error("HQ05_ACCESS_TOKEN_INVALID");
  }
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const response = await fetchImpl(
    `https://googleads.googleapis.com/${HQ05_GOOGLE_ADS_API_VERSION}/customers/${HQ05_CUSTOMER_ID}/googleAds:searchStream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    }
  );
  const text = await response.text();
  if (!response.ok) {
    let status = "UNKNOWN";
    try {
      const parsed = asRecord(JSON.parse(text));
      status = asString(asRecord(parsed?.error)?.status) ?? status;
    } catch {
      // Provider response content is intentionally not surfaced.
    }
    throw new Error(
      `HQ05_GOOGLE_ADS_HTTP_${response.status}_${status
        .replace(/[^A-Z0-9_:-]/gi, "_")
        .slice(0, 80)}`
    );
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("HQ05_GOOGLE_ADS_RESPONSE_MALFORMED");
  }
  return searchRows(payload);
};

export const parseHq05Customer = (
  rows: RecordLike[]
): Hq05CustomerPrerequisites => {
  if (rows.length !== 1) throw new Error("HQ05_CUSTOMER_ROW_COUNT_INVALID");
  const customer = asRecord(rows[0].customer);
  const settings = asRecord(customer?.conversionTrackingSetting);
  const id = asString(customer?.id) ?? String(customer?.id ?? "");
  if (id !== HQ05_CUSTOMER_ID || !settings) {
    throw new Error("HQ05_CUSTOMER_IDENTITY_DRIFT");
  }
  return {
    customerId: id,
    autoTaggingEnabled: asBoolean(customer?.autoTaggingEnabled),
    acceptedCustomerDataTerms: asBoolean(
      settings.acceptedCustomerDataTerms
    ),
    enhancedConversionsForLeadsEnabled: asBoolean(
      settings.enhancedConversionsForLeadsEnabled
    ),
    conversionTrackingStatus:
      asString(settings.conversionTrackingStatus) ?? "UNKNOWN",
    googleAdsConversionCustomer:
      asString(settings.googleAdsConversionCustomer),
  };
};

export const parseHq05CanonicalConversion = (
  rows: RecordLike[]
): Hq05CanonicalConversion => {
  if (rows.length !== 1) {
    throw new Error("HQ05_CANONICAL_CONVERSION_ROW_COUNT_INVALID");
  }
  const action = asRecord(rows[0].conversionAction);
  const id = asString(action?.id) ?? String(action?.id ?? "");
  if (id !== HQ05_CANONICAL_CONVERSION_ACTION_ID) {
    throw new Error("HQ05_CANONICAL_CONVERSION_IDENTITY_DRIFT");
  }
  const name = asString(action?.name);
  if (!name) throw new Error("HQ05_CANONICAL_CONVERSION_NAME_MISSING");
  return {
    id,
    name,
    status: asString(action?.status) ?? "UNKNOWN",
    type: asString(action?.type) ?? "UNKNOWN",
    category: asString(action?.category) ?? "UNKNOWN",
    countingType: asString(action?.countingType) ?? "UNKNOWN",
    primaryForGoal: asBoolean(action?.primaryForGoal),
    includeInConversionsMetric: asBoolean(
      action?.includeInConversionsMetric
    ),
    origin: asString(action?.origin) ?? "UNKNOWN",
    ownerCustomer: asString(action?.ownerCustomer),
  };
};

const customerResource = (customerId: string): string =>
  `customers/${customerId}`;

export const classifyHq05Prerequisites = (
  customer: Hq05CustomerPrerequisites,
  canonicalConversion: Hq05CanonicalConversion
): Hq05PrerequisiteVerdict => {
  const blockingReasons: string[] = [];
  if (!customer.acceptedCustomerDataTerms) {
    blockingReasons.push("CUSTOMER_DATA_TERMS_NOT_ACCEPTED");
  }
  if (!customer.enhancedConversionsForLeadsEnabled) {
    blockingReasons.push("ENHANCED_CONVERSIONS_NOT_ENABLED");
  }
  if (!customer.autoTaggingEnabled) {
    blockingReasons.push("AUTO_TAGGING_DISABLED");
  }
  if (
    customer.conversionTrackingStatus === "NOT_CONVERSION_TRACKED" ||
    customer.conversionTrackingStatus === "UNKNOWN" ||
    customer.conversionTrackingStatus === "UNSPECIFIED"
  ) {
    blockingReasons.push("CONVERSION_TRACKING_NOT_READY");
  }
  if (canonicalConversion.status !== "ENABLED") {
    blockingReasons.push("CANONICAL_CONVERSION_NOT_ENABLED");
  }
  if (canonicalConversion.type !== "UPLOAD_CLICKS") {
    blockingReasons.push("CANONICAL_CONVERSION_TYPE_DRIFT");
  }

  const conversionOwner =
    customer.googleAdsConversionCustomer ??
    customerResource(customer.customerId);
  const destinationShapeCompatible =
    canonicalConversion.id === HQ05_CANONICAL_CONVERSION_ACTION_ID &&
    canonicalConversion.status === "ENABLED" &&
    canonicalConversion.ownerCustomer !== null &&
    canonicalConversion.ownerCustomer === conversionOwner;

  if (!destinationShapeCompatible) {
    blockingReasons.push("DATA_MANAGER_DESTINATION_OWNER_MISMATCH");
  }

  return {
    result: blockingReasons.length === 0 ? "READY" : "BLOCKED",
    customer,
    canonicalConversion,
    destinationShapeCompatible,
    blockingReasons,
  };
};

export const readHq05Prerequisites = async (
  accessToken: string,
  loginCustomerId: string | null,
  fetchImpl: typeof fetch = fetch
): Promise<Hq05PrerequisiteVerdict> => {
  const customerRows = await readSearchStream(
    accessToken,
    loginCustomerId,
    buildHq05CustomerQuery(),
    fetchImpl
  );
  const actionRows = await readSearchStream(
    accessToken,
    loginCustomerId,
    buildHq05CanonicalConversionQuery(),
    fetchImpl
  );
  return classifyHq05Prerequisites(
    parseHq05Customer(customerRows),
    parseHq05CanonicalConversion(actionRows)
  );
};

const safeCode = (value: string): string =>
  value.replace(/[^A-Z0-9_:-]/gi, "_").slice(0, 120);

const main = async (): Promise<void> => {
  if (!hasGoogleAdsAuthInput(process.env)) {
    console.log("HQ05_PREREQUISITES=SKIPPED_NO_PROVIDER_AUTH");
    return;
  }
  const auth = await resolveGoogleAdsAccessToken(process.env);
  const loginCustomerId =
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim() || null;
  const verdict = await readHq05Prerequisites(
    auth.accessToken,
    loginCustomerId
  );
  console.log(
    JSON.stringify({
      ...verdict,
      authSource: auth.source,
      accessTokenPrinted: false,
    })
  );
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const message =
      error instanceof Error ? error.message : "HQ05_UNKNOWN";
    console.error(`HQ05_PREREQUISITES=FAIL:${safeCode(message)}`);
    process.exitCode = 1;
  });
}
