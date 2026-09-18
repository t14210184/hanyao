import { exchangeServiceAccountTokenForScopes } from "../workers/google-ads-uploader/src/auth.ts";
import { GOOGLE_ADS_SCOPE } from "../workers/google-ads-uploader/src/types.ts";
import {
  MESSAGE_ASSET_PREFLIGHT_VERSION,
  MESSAGE_ASSET_PUBLIC_PROVIDER_BASELINE,
  MESSAGE_ASSET_UI_ONLY_GATES,
} from "./ads-line-message-preflight-contract.ts";

const CUSTOMER_ID = "4801404246";
const PILOT_CAMPAIGN_NAME = "冷氣維修";
const API_VERSION = "v25";
const API_URL =
  "https://googleads.googleapis.com/" +
  API_VERSION +
  "/customers/" +
  CUSTOMER_ID +
  "/googleAds:searchStream";

const credential = process.env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?.trim();
const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim();
const liveRequired = process.env.MESSAGE_ASSET_PREFLIGHT_LIVE_REQUIRED === "1";

type RecordLike = Record<string, unknown>;

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const asBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const rowsFrom = (payload: unknown): RecordLike[] => {
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

const query = async (accessToken: string, gaql: string): Promise<RecordLike[]> => {
  const headers: Record<string, string> = {
    authorization: "Bearer " + accessToken,
    "content-type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: gaql }),
  });
  const text = await response.text();

  if (!response.ok) {
    let status = "UNKNOWN";
    try {
      const parsed = asRecord(JSON.parse(text));
      status = asString(asRecord(parsed?.error)?.status) ?? status;
    } catch {
      // Provider response body is intentionally not echoed.
    }
    throw new Error(
      "GOOGLE_ADS_HTTP_" +
        response.status +
        "_" +
        status.replace(/[^A-Z0-9_]/gi, "_")
    );
  }

  try {
    return rowsFrom(JSON.parse(text));
  } catch {
    throw new Error("GOOGLE_ADS_RESPONSE_MALFORMED");
  }
};

const businessAssetSnapshot = (row: RecordLike): RecordLike => {
  const asset = asRecord(row.asset) ?? {};
  const message = asRecord(asset.businessMessageAsset) ?? {};
  const policy = asRecord(asset.policySummary) ?? {};
  return {
    assetId: asString(asset.id),
    name: asString(asset.name),
    provider: asString(message.messageProvider),
    policyApprovalStatus: asString(policy.approvalStatus),
    policyReviewStatus: asString(policy.reviewStatus),
  };
};

const linkSnapshot = (
  row: RecordLike,
  linkKey: "campaignAsset" | "customerAsset" | "adGroupAsset"
): RecordLike => {
  const link = asRecord(row[linkKey]) ?? {};
  const asset = asRecord(row.asset) ?? {};
  const message = asRecord(asset.businessMessageAsset) ?? {};
  return {
    scope:
      linkKey === "campaignAsset"
        ? "CAMPAIGN"
        : linkKey === "customerAsset"
          ? "CUSTOMER"
          : "AD_GROUP",
    fieldType: asString(link.fieldType),
    status: asString(link.status),
    primaryStatus: asString(link.primaryStatus),
    primaryStatusReasons: asStringArray(link.primaryStatusReasons),
    assetId: asString(asset.id),
    assetType: asString(asset.type),
    messageProvider: asString(message.messageProvider),
    adGroupId: asString(asRecord(row.adGroup)?.id),
  };
};

if (!credential) {
  const skipped = {
    schemaVersion: 1,
    preflightVersion: MESSAGE_ASSET_PREFLIGHT_VERSION,
    result: "SKIPPED_MISSING_GOOGLE_ADS_CLOUD_PROJECT_CREDENTIAL",
    customerId: CUSTOMER_ID,
    pilotCampaignName: PILOT_CAMPAIGN_NAME,
    apiVersion: API_VERSION,
    mutationApplied: false,
    remainingUiGates: MESSAGE_ASSET_UI_ONLY_GATES,
  };
  if (liveRequired) {
    console.error("MESSAGE_ASSET_API_PREFLIGHT=FAIL:MISSING_CLOUD_PROJECT_CREDENTIAL");
    process.exit(1);
  }
  console.log(JSON.stringify(skipped));
  process.exit(0);
}

try {
  const auth = await exchangeServiceAccountTokenForScopes(credential, [GOOGLE_ADS_SCOPE]);

  const campaignRows = await query(
    auth.accessToken,
    [
      "SELECT",
      "  campaign.id,",
      "  campaign.name,",
      "  campaign.status,",
      "  campaign.advertising_channel_type,",
      "  campaign.bidding_strategy_type,",
      "  campaign.bidding_strategy_system_status",
      "FROM campaign",
      "WHERE campaign.name = '" + PILOT_CAMPAIGN_NAME + "'",
      "  AND campaign.status != 'REMOVED'",
    ].join("\n")
  );

  const hardFailures: string[] = [];
  const advisories: string[] = [];

  if (campaignRows.length !== 1) {
    hardFailures.push("PILOT_CAMPAIGN_COUNT_" + campaignRows.length);
  }

  const campaign = asRecord(campaignRows[0]?.campaign) ?? {};
  const campaignId = asString(campaign.id);
  const campaignStatus = asString(campaign.status);
  const channelType = asString(campaign.advertisingChannelType);
  const biddingStrategyType = asString(campaign.biddingStrategyType);
  const biddingStrategySystemStatus = asString(campaign.biddingStrategySystemStatus);

  if (!campaignId || !/^\d+$/.test(campaignId)) {
    hardFailures.push("PILOT_CAMPAIGN_ID_INVALID");
  }
  if (campaignStatus !== "ENABLED") hardFailures.push("PILOT_CAMPAIGN_NOT_ENABLED");
  if (channelType !== "SEARCH") hardFailures.push("PILOT_CAMPAIGN_NOT_SEARCH");

  if (biddingStrategyType && biddingStrategyType !== "TARGET_SPEND") {
    advisories.push("BIDDING_STRATEGY_DIFFERS_FROM_20260917_PLAN_SNAPSHOT");
  }

  let goalConfig: RecordLike | null = null;
  let campaignGoals: RecordLike[] = [];
  let messageInventory: RecordLike[] = [];
  const linkedAssets: RecordLike[] = [];

  if (campaignId && /^\d+$/.test(campaignId)) {
    const goalConfigRows = await query(
      auth.accessToken,
      [
        "SELECT",
        "  conversion_goal_campaign_config.goal_config_level,",
        "  conversion_goal_campaign_config.custom_conversion_goal",
        "FROM conversion_goal_campaign_config",
        "WHERE campaign.id = " + campaignId,
      ].join("\n")
    );

    if (goalConfigRows.length === 1) {
      const config = asRecord(goalConfigRows[0].conversionGoalCampaignConfig) ?? {};
      goalConfig = {
        goalConfigLevel: asString(config.goalConfigLevel),
        customConversionGoal: asString(config.customConversionGoal),
      };
    } else {
      hardFailures.push("GOAL_CONFIG_ROW_COUNT_" + goalConfigRows.length);
    }

    const campaignGoalRows = await query(
      auth.accessToken,
      [
        "SELECT",
        "  campaign_conversion_goal.category,",
        "  campaign_conversion_goal.origin,",
        "  campaign_conversion_goal.biddable",
        "FROM campaign_conversion_goal",
        "WHERE campaign.id = " + campaignId,
      ].join("\n")
    );

    campaignGoals = campaignGoalRows.map((row) => {
      const goal = asRecord(row.campaignConversionGoal) ?? {};
      return {
        category: asString(goal.category),
        origin: asString(goal.origin),
        biddable: asBoolean(goal.biddable) ?? false,
      };
    });

    const campaignAssetRows = await query(
      auth.accessToken,
      [
        "SELECT",
        "  campaign_asset.asset,",
        "  campaign_asset.field_type,",
        "  campaign_asset.status,",
        "  campaign_asset.primary_status,",
        "  campaign_asset.primary_status_reasons,",
        "  asset.id,",
        "  asset.type,",
        "  asset.business_message_asset.message_provider",
        "FROM campaign_asset",
        "WHERE campaign.id = " + campaignId,
        "  AND campaign_asset.status != 'REMOVED'",
        "  AND campaign_asset.field_type IN ('BUSINESS_MESSAGE', 'CALL', 'LEAD_FORM')",
      ].join("\n")
    );
    linkedAssets.push(
      ...campaignAssetRows.map((row) => linkSnapshot(row, "campaignAsset"))
    );

    const adGroupAssetRows = await query(
      auth.accessToken,
      [
        "SELECT",
        "  ad_group.id,",
        "  ad_group_asset.asset,",
        "  ad_group_asset.field_type,",
        "  ad_group_asset.status,",
        "  ad_group_asset.primary_status,",
        "  ad_group_asset.primary_status_reasons,",
        "  asset.id,",
        "  asset.type,",
        "  asset.business_message_asset.message_provider",
        "FROM ad_group_asset",
        "WHERE campaign.id = " + campaignId,
        "  AND ad_group_asset.status != 'REMOVED'",
        "  AND ad_group_asset.field_type IN ('BUSINESS_MESSAGE', 'CALL', 'LEAD_FORM')",
      ].join("\n")
    );
    linkedAssets.push(
      ...adGroupAssetRows.map((row) => linkSnapshot(row, "adGroupAsset"))
    );
  }

  const customerAssetRows = await query(
    auth.accessToken,
    [
      "SELECT",
      "  customer_asset.asset,",
      "  customer_asset.field_type,",
      "  customer_asset.status,",
      "  customer_asset.primary_status,",
      "  customer_asset.primary_status_reasons,",
      "  asset.id,",
      "  asset.type,",
      "  asset.business_message_asset.message_provider",
      "FROM customer_asset",
      "WHERE customer_asset.status != 'REMOVED'",
      "  AND customer_asset.field_type IN ('BUSINESS_MESSAGE', 'CALL', 'LEAD_FORM')",
    ].join("\n")
  );
  linkedAssets.push(
    ...customerAssetRows.map((row) => linkSnapshot(row, "customerAsset"))
  );

  const messageAssetRows = await query(
    auth.accessToken,
    [
      "SELECT",
      "  asset.id,",
      "  asset.name,",
      "  asset.type,",
      "  asset.business_message_asset.message_provider,",
      "  asset.policy_summary.approval_status,",
      "  asset.policy_summary.review_status",
      "FROM asset",
      "WHERE asset.type = 'BUSINESS_MESSAGE'",
    ].join("\n")
  );
  messageInventory = messageAssetRows.map(businessAssetSnapshot);

  const activeLinkCounts = {
    businessMessage: linkedAssets.filter(
      (item) => item.fieldType === "BUSINESS_MESSAGE" && item.status === "ENABLED"
    ).length,
    call: linkedAssets.filter(
      (item) => item.fieldType === "CALL" && item.status === "ENABLED"
    ).length,
    leadForm: linkedAssets.filter(
      (item) => item.fieldType === "LEAD_FORM" && item.status === "ENABLED"
    ).length,
  };

  if (activeLinkCounts.call > 0 || activeLinkCounts.leadForm > 0) {
    advisories.push("MESSAGE_BUTTON_CAN_SUPPRESS_OTHER_ASSET_TYPES_WHEN_SERVED");
  }
  if (messageInventory.length > 0) {
    advisories.push("EXISTING_BUSINESS_MESSAGE_ASSET_INVENTORY_PRESENT");
  }
  if (goalConfig?.goalConfigLevel === "CAMPAIGN") {
    advisories.push("CAMPAIGN_SPECIFIC_CONVERSION_GOALS_ALREADY_ACTIVE");
  }

  console.log(
    JSON.stringify({
      schemaVersion: 1,
      preflightVersion: MESSAGE_ASSET_PREFLIGHT_VERSION,
      result:
        hardFailures.length === 0
          ? "MESSAGE_ASSET_API_PRESTATE_READY_FOR_UI_CHECK"
          : "MESSAGE_ASSET_API_PRESTATE_BLOCKED",
      generatedAt: new Date().toISOString(),
      customerId: CUSTOMER_ID,
      apiVersion: API_VERSION,
      mutationApplied: false,
      campaign: {
        id: campaignId,
        name: asString(campaign.name),
        status: campaignStatus,
        advertisingChannelType: channelType,
        biddingStrategyType,
        biddingStrategySystemStatus,
      },
      goalConfig,
      campaignGoals,
      activeLinkCounts,
      messageInventory,
      linkedAssets,
      publicProviderBaseline: MESSAGE_ASSET_PUBLIC_PROVIDER_BASELINE,
      remainingUiGates: MESSAGE_ASSET_UI_ONLY_GATES,
      advisories,
      hardFailures,
    })
  );

  if (hardFailures.length > 0) process.exitCode = 2;
} catch (error) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  console.error(
    "MESSAGE_ASSET_API_PREFLIGHT=FAIL:" +
      message.replace(/[^A-Z0-9_:-]/gi, "_")
  );
  process.exitCode = 1;
}
