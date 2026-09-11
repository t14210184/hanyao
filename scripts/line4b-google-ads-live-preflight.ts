import { exchangeServiceAccountTokenForScopes } from "../workers/google-ads-uploader/src/auth.ts";
import { GOOGLE_ADS_SCOPE } from "../workers/google-ads-uploader/src/types.ts";

const CUSTOMER_ID = "4801404246";
const CONVERSION_ACTION_ID = "7674301565";
const GOOGLE_ADS_API_VERSION = "v25";
const API_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${CUSTOMER_ID}/googleAds:searchStream`;

const credential = process.env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?.trim();
const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim();

if (!credential) {
  console.log("GOOGLE_ADS_LIVE_GATE=SKIPPED_NO_GITHUB_CREDENTIAL");
  process.exit(0);
}

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const parseRows = (payload: unknown): JsonRecord[] => {
  const chunks = Array.isArray(payload) ? payload : [payload];
  const rows: JsonRecord[] = [];
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

const query = async (accessToken: string, gaql: string): Promise<JsonRecord[]> => {
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
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
      const error = asRecord(parsed?.error);
      status = asString(error?.status) ?? status;
    } catch {
      // Deliberately do not echo the provider response body.
    }
    throw new Error(`GOOGLE_ADS_HTTP_${response.status}_${status.replace(/[^A-Z0-9_]/gi, "_")}`);
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("GOOGLE_ADS_RESPONSE_MALFORMED");
  }
  return parseRows(payload);
};

try {
  const auth = await exchangeServiceAccountTokenForScopes(
    credential,
    [GOOGLE_ADS_SCOPE]
  );

  const actionRows = await query(
    auth.accessToken,
    `SELECT
      conversion_action.id,
      conversion_action.resource_name,
      conversion_action.name,
      conversion_action.status,
      conversion_action.type,
      conversion_action.category,
      conversion_action.origin,
      conversion_action.primary_for_goal,
      conversion_action.counting_type
    FROM conversion_action
    WHERE conversion_action.id = ${CONVERSION_ACTION_ID}
    LIMIT 1`
  );

  if (actionRows.length !== 1) throw new Error("CONVERSION_ACTION_NOT_FOUND");
  const action = asRecord(actionRows[0].conversionAction);
  if (!action) throw new Error("CONVERSION_ACTION_MALFORMED");

  const resourceName = asString(action.resourceName);
  const status = asString(action.status);
  const type = asString(action.type) ?? "UNKNOWN";
  const category = asString(action.category) ?? "UNKNOWN";
  const origin = asString(action.origin) ?? "UNKNOWN";
  const countingType = asString(action.countingType);
  // Proto3 JSON may omit scalar fields whose value is the default false.
  // For a selected bool, only explicit true means Primary/biddable here.
  const primaryForGoal = action.primaryForGoal === true;

  const hardFailures: string[] = [];
  const advisories: string[] = [];

  if (!resourceName) hardFailures.push("RESOURCE_NAME_MISSING");
  if (status !== "ENABLED") hardFailures.push(`STATUS_${status ?? "UNKNOWN"}`);
  if (countingType !== "MANY_PER_CLICK") {
    hardFailures.push(`COUNTING_TYPE_${countingType ?? "UNKNOWN"}`);
  }
  if (primaryForGoal) {
    hardFailures.push("PRIMARY_FOR_GOAL_TRUE");
  }
  if (category !== "QUALIFIED_LEAD" && category !== "CONVERTED_LEAD") {
    advisories.push(`CATEGORY_${category}`);
  }

  const customerGoalRows = await query(
    auth.accessToken,
    `SELECT
      customer_conversion_goal.resource_name,
      customer_conversion_goal.category,
      customer_conversion_goal.origin,
      customer_conversion_goal.biddable
    FROM customer_conversion_goal`
  );
  const matchingCustomerGoal = customerGoalRows
    .map((row) => asRecord(row.customerConversionGoal))
    .find((goal) => goal?.category === category && goal?.origin === origin);

  const customGoalRows = await query(
    auth.accessToken,
    `SELECT
      custom_conversion_goal.resource_name,
      custom_conversion_goal.status,
      custom_conversion_goal.conversion_actions
    FROM custom_conversion_goal`
  );
  const enabledCustomGoalResources = new Set<string>();
  for (const row of customGoalRows) {
    const goal = asRecord(row.customConversionGoal);
    if (goal?.status !== "ENABLED" || !Array.isArray(goal.conversionActions)) continue;
    if (resourceName && goal.conversionActions.includes(resourceName)) {
      const customResource = asString(goal.resourceName);
      if (customResource) enabledCustomGoalResources.add(customResource);
    }
  }

  let activeCustomGoalCampaignCount = 0;
  if (enabledCustomGoalResources.size > 0) {
    const campaignGoalRows = await query(
      auth.accessToken,
      `SELECT
        conversion_goal_campaign_config.custom_conversion_goal,
        conversion_goal_campaign_config.goal_config_level,
        campaign.id,
        campaign.status
      FROM conversion_goal_campaign_config
      WHERE campaign.status != 'REMOVED'`
    );
    activeCustomGoalCampaignCount = campaignGoalRows.filter((row) => {
      const config = asRecord(row.conversionGoalCampaignConfig);
      const customGoal = asString(config?.customConversionGoal);
      return customGoal ? enabledCustomGoalResources.has(customGoal) : false;
    }).length;
  }

  if (activeCustomGoalCampaignCount > 0) {
    hardFailures.push(`CUSTOM_GOAL_BIDDING_OVERRIDE_${activeCustomGoalCampaignCount}`);
  }

  const customerGoalBiddable = matchingCustomerGoal
    ? matchingCustomerGoal.biddable === true
    : null;

  console.log(
    JSON.stringify({
      result: hardFailures.length === 0 ? "GOOGLE_ADS_LIVE_GATE_PASS" : "GOOGLE_ADS_LIVE_GATE_BLOCKED",
      apiVersion: GOOGLE_ADS_API_VERSION,
      customerId: CUSTOMER_ID,
      conversionActionId: CONVERSION_ACTION_ID,
      status,
      type,
      category,
      origin,
      countingType,
      primaryForGoal,
      customerGoalBiddable,
      enabledCustomGoalsContainingAction: enabledCustomGoalResources.size,
      activeCustomGoalCampaignCount,
      advisories,
      hardFailures,
    })
  );

  if (hardFailures.length > 0) process.exitCode = 2;
} catch (error) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  console.error(`GOOGLE_ADS_LIVE_GATE=FAIL:${message.replace(/[^A-Z0-9_:-]/gi, "_")}`);
  process.exitCode = 1;
}
