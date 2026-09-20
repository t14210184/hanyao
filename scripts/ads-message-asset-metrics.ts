import {
  hasGoogleAdsAuthInput,
  resolveGoogleAdsAccessToken,
} from "./google-ads-provider-auth.ts";

export const MESSAGE_ASSET_CUSTOMER_ID = "4801404246";
export const MESSAGE_ASSET_API_VERSION = "v25";

type RecordLike = Record<string, unknown>;

export interface MessageAssetMetricRow {
  metricDate: string;
  customerId: string;
  campaignId: string;
  campaignName: string | null;
  assetId: string;
  assetResourceName: string;
  campaignAssetResourceName: string;
  assetStatus: string | null;
  primaryStatus: string | null;
  primaryStatusReasons: string[];
  impressions: number;
  interactions: number;
  clicks: number;
  conversions: number;
  allConversions: number;
  costMicros: number;
  messageChats: number;
  messageImpressions: number;
  messageChatRate: number;
}

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const rowsFromSearchStream = (payload: unknown): RecordLike[] => {
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

const assetIdFromResource = (resourceName: string): string => {
  const match = resourceName.match(/\/assets\/(\d+)$/);
  if (!match) throw new Error("MESSAGE_ASSET_RESOURCE_INVALID");
  return match[1];
};

export const buildMessageAssetMetricsQuery = (
  targetDate: string | null = null
): string => {
  if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error("MESSAGE_ASSET_DATE_INVALID");
  }
  const datePredicate = targetDate
    ? `segments.date = '${targetDate}'`
    : "segments.date DURING TODAY";

  return `SELECT
    segments.date,
    campaign.id,
    campaign.name,
    campaign_asset.resource_name,
    campaign_asset.asset,
    campaign_asset.field_type,
    campaign_asset.status,
    campaign_asset.primary_status,
    campaign_asset.primary_status_reasons,
    metrics.impressions,
    metrics.interactions,
    metrics.clicks,
    metrics.conversions,
    metrics.all_conversions,
    metrics.cost_micros,
    metrics.message_chats,
    metrics.message_impressions,
    metrics.message_chat_rate
  FROM campaign_asset
  WHERE campaign_asset.field_type = 'BUSINESS_MESSAGE'
    AND ${datePredicate}
  ORDER BY segments.date, campaign.id, campaign_asset.asset`;
};

export const normalizeMessageAssetMetricRows = (
  payload: unknown,
  customerId = MESSAGE_ASSET_CUSTOMER_ID
): MessageAssetMetricRow[] =>
  rowsFromSearchStream(payload).map((row) => {
    const segments = asRecord(row.segments) ?? {};
    const campaign = asRecord(row.campaign) ?? {};
    const campaignAsset = asRecord(row.campaignAsset) ?? {};
    const metrics = asRecord(row.metrics) ?? {};

    const metricDate = asString(segments.date);
    const campaignId = asString(campaign.id) ?? String(campaign.id ?? "");
    const assetResourceName = asString(campaignAsset.asset);
    const campaignAssetResourceName = asString(campaignAsset.resourceName);
    const fieldType = asString(campaignAsset.fieldType);

    if (!metricDate || !/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) {
      throw new Error("MESSAGE_ASSET_METRIC_DATE_MISSING");
    }
    if (!/^\d+$/.test(campaignId)) {
      throw new Error("MESSAGE_ASSET_CAMPAIGN_ID_INVALID");
    }
    if (!assetResourceName || !campaignAssetResourceName) {
      throw new Error("MESSAGE_ASSET_RESOURCE_MISSING");
    }
    if (fieldType !== "BUSINESS_MESSAGE") {
      throw new Error("MESSAGE_ASSET_FIELD_TYPE_DRIFT");
    }

    return {
      metricDate,
      customerId,
      campaignId,
      campaignName: asString(campaign.name),
      assetId: assetIdFromResource(assetResourceName),
      assetResourceName,
      campaignAssetResourceName,
      assetStatus: asString(campaignAsset.status),
      primaryStatus: asString(campaignAsset.primaryStatus),
      primaryStatusReasons: asStringArray(
        campaignAsset.primaryStatusReasons
      ).sort(),
      impressions: asNumber(metrics.impressions),
      interactions: asNumber(metrics.interactions),
      clicks: asNumber(metrics.clicks),
      conversions: asNumber(metrics.conversions),
      allConversions: asNumber(metrics.allConversions),
      costMicros: asNumber(metrics.costMicros),
      messageChats: asNumber(metrics.messageChats),
      messageImpressions: asNumber(metrics.messageImpressions),
      messageChatRate: asNumber(metrics.messageChatRate),
    };
  });

const sanitizeProviderStatus = (value: string): string =>
  value.replace(/[^A-Z0-9_:-]/gi, "_").slice(0, 100);

export const readMessageAssetMetrics = async (
  accessToken: string,
  loginCustomerId: string | null,
  targetDate: string | null,
  fetchImpl: typeof fetch = fetch
): Promise<MessageAssetMetricRow[]> => {
  if (!accessToken || /\s/.test(accessToken)) {
    throw new Error("MESSAGE_ASSET_ACCESS_TOKEN_INVALID");
  }
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const response = await fetchImpl(
    `https://googleads.googleapis.com/${MESSAGE_ASSET_API_VERSION}/customers/${MESSAGE_ASSET_CUSTOMER_ID}/googleAds:searchStream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: buildMessageAssetMetricsQuery(targetDate),
      }),
    }
  );
  const text = await response.text();
  if (!response.ok) {
    let status = "UNKNOWN";
    try {
      const parsed = asRecord(JSON.parse(text));
      status =
        asString(asRecord(parsed?.error)?.status) ??
        status;
    } catch {
      // Provider body must never be echoed.
    }
    throw new Error(
      `MESSAGE_ASSET_GOOGLE_ADS_HTTP_${response.status}_${sanitizeProviderStatus(status)}`
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("MESSAGE_ASSET_GOOGLE_ADS_RESPONSE_MALFORMED");
  }
  return normalizeMessageAssetMetricRows(payload);
};

const main = async (): Promise<void> => {
  const targetDate =
    process.env.GOOGLE_ADS_MESSAGE_METRICS_DATE?.trim() || null;
  const loginCustomerId =
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim() || null;

  if (!hasGoogleAdsAuthInput(process.env)) {
    console.log("MESSAGE_ASSET_METRICS=SKIPPED_NO_PROVIDER_AUTH");
    return;
  }

  const auth = await resolveGoogleAdsAccessToken(process.env);
  const rows = await readMessageAssetMetrics(
    auth.accessToken,
    loginCustomerId,
    targetDate
  );

  console.log(
    JSON.stringify({
      result: "MESSAGE_ASSET_METRICS_READ_PASS",
      customerId: MESSAGE_ASSET_CUSTOMER_ID,
      targetDate,
      authSource: auth.source,
      accessTokenPrinted: false,
      rowCount: rows.length,
      totals: rows.reduce(
        (acc, row) => ({
          impressions: acc.impressions + row.impressions,
          interactions: acc.interactions + row.interactions,
          clicks: acc.clicks + row.clicks,
          conversions: acc.conversions + row.conversions,
          allConversions: acc.allConversions + row.allConversions,
          costMicros: acc.costMicros + row.costMicros,
          messageChats: acc.messageChats + row.messageChats,
          messageImpressions:
            acc.messageImpressions + row.messageImpressions,
        }),
        {
          impressions: 0,
          interactions: 0,
          clicks: 0,
          conversions: 0,
          allConversions: 0,
          costMicros: 0,
          messageChats: 0,
          messageImpressions: 0,
        }
      ),
      rows,
    })
  );
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const message =
      error instanceof Error ? error.message : "MESSAGE_ASSET_UNKNOWN";
    console.error(
      `MESSAGE_ASSET_METRICS=FAIL:${sanitizeProviderStatus(message)}`
    );
    process.exitCode = 1;
  });
}
