import {
  hasGoogleAdsAuthInput,
  resolveGoogleAdsAccessToken,
} from "./google-ads-provider-auth.ts";
import {
  buildMessageAssetMetricsQuery,
  normalizeMessageAssetMetricRows,
  readMessageAssetMetrics,
} from "../workers/google-ads-uploader/src/message-asset-metrics.ts";

export const MESSAGE_ASSET_CUSTOMER_ID = "4801404246";

export {
  buildMessageAssetMetricsQuery,
  normalizeMessageAssetMetricRows,
  readMessageAssetMetrics,
};

const safeCode = (value: string): string =>
  value.replace(/[^A-Z0-9_:-]/gi, "_").slice(0, 120);

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
    MESSAGE_ASSET_CUSTOMER_ID,
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
    console.error(`MESSAGE_ASSET_METRICS=FAIL:${safeCode(message)}`);
    process.exitCode = 1;
  });
}
