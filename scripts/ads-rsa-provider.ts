import {
  hasGoogleAdsAuthInput,
  resolveGoogleAdsAccessToken,
} from "./google-ads-provider-auth.ts";
import {
  WP03_CREATE_GATE,
  WP03_CUSTOMER_ID,
  WP03_ENABLE_GATE,
  assertWp03Gate,
  buildWp03CreateMutateBody,
  buildWp03CreatePlan,
  buildWp03EnableMutateBody,
  buildWp03EnablePlan,
  createReadbackCoverage,
  enableReadbackCoverage,
  hashWp03CreatePlan,
  hashWp03EnablePlan,
  parseWp03TargetManifest,
  resolveWp03Targets,
  type Wp03AdGroup,
  type Wp03Campaign,
  type Wp03RsaAd,
} from "./ads-rsa-provider-contract.ts";

const API_VERSION = "v25";
const SEARCH_URL =
  `https://googleads.googleapis.com/${API_VERSION}/customers/${WP03_CUSTOMER_ID}/googleAds:searchStream`;
const MUTATE_URL =
  `https://googleads.googleapis.com/${API_VERSION}/customers/${WP03_CUSTOMER_ID}/adGroupAds:mutate`;

const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim();
const expectedPlanHash = process.env.ADS_RSA_EXPECTED_PLAN_HASH?.trim();
const productionGate = process.env.ADS_RSA_PRODUCTION_GATE?.trim();
const targetManifest = parseWp03TargetManifest(
  process.env.ADS_RSA_TARGET_AD_GROUPS_JSON
);

const args = new Set(process.argv.slice(2));
const mode = args.has("--apply-paused")
  ? "apply-paused"
  : args.has("--validate-create")
    ? "validate-create"
    : args.has("--enable")
      ? "enable"
      : args.has("--validate-enable")
        ? "validate-enable"
        : args.has("--read-enable")
          ? "read-enable"
          : "dry-run-create";

if (!hasGoogleAdsAuthInput()) {
  console.error(
    "WP03_PROVIDER_AUTH_REQUIRED:GOOGLE_ADS_ACCESS_TOKEN_OR_GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON"
  );
  process.exit(2);
}

type RecordLike = Record<string, unknown>;
const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;
const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";
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

const headersFor = (accessToken: string): Record<string, string> => ({
  authorization: "Bearer " + accessToken,
  "content-type": "application/json",
  ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
});

const safeProviderError = async (response: Response): Promise<string> => {
  const text = await response.text();
  try {
    const parsed = asRecord(JSON.parse(text));
    const error = asRecord(parsed?.error);
    const status = asString(error?.status) || "UNKNOWN";
    return `HTTP_${response.status}_${status.replace(/[^A-Z0-9_]/gi, "_")}`;
  } catch {
    return `HTTP_${response.status}_UNKNOWN`;
  }
};

const search = async (accessToken: string, query: string): Promise<RecordLike[]> => {
  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: headersFor(accessToken),
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error("WP03_SEARCH_" + (await safeProviderError(response)));
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await response.text());
  } catch {
    throw new Error("WP03_SEARCH_RESPONSE_MALFORMED");
  }
  return rowsFrom(parsed);
};

const textAssets = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => asString(asRecord(item)?.text))
        .filter((item) => item.length > 0)
    : [];

const readProviderState = async (accessToken: string) => {
  const campaignNames =
    "'冷氣維修','冷氣清洗保養','冷氣安裝','商用工程'";

  const [campaignRows, adGroupRows, rsaRows] = await Promise.all([
    search(
      accessToken,
      `SELECT
  campaign.id,
  campaign.name,
  campaign.status
FROM campaign
WHERE campaign.status = 'ENABLED'
  AND campaign.advertising_channel_type = 'SEARCH'
  AND campaign.name IN (${campaignNames})`
    ),
    search(
      accessToken,
      `SELECT
  campaign.id,
  campaign.name,
  ad_group.id,
  ad_group.name,
  ad_group.status
FROM ad_group
WHERE campaign.status = 'ENABLED'
  AND ad_group.status = 'ENABLED'
  AND campaign.advertising_channel_type = 'SEARCH'
  AND campaign.name IN (${campaignNames})`
    ),
    search(
      accessToken,
      `SELECT
  campaign.id,
  campaign.name,
  ad_group.id,
  ad_group.name,
  ad_group_ad.resource_name,
  ad_group_ad.status,
  ad_group_ad.ad_strength,
  ad_group_ad.action_items,
  ad_group_ad.policy_summary.approval_status,
  ad_group_ad.policy_summary.review_status,
  ad_group_ad.primary_status,
  ad_group_ad.ad.id,
  ad_group_ad.ad.final_urls,
  ad_group_ad.ad.responsive_search_ad.headlines,
  ad_group_ad.ad.responsive_search_ad.descriptions
FROM ad_group_ad
WHERE campaign.status = 'ENABLED'
  AND ad_group.status = 'ENABLED'
  AND campaign.advertising_channel_type = 'SEARCH'
  AND campaign.name IN (${campaignNames})
  AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
  AND ad_group_ad.status != 'REMOVED'`
    ),
  ]);

  const campaigns: Wp03Campaign[] = campaignRows.map((row) => {
    const campaign = asRecord(row.campaign) ?? {};
    return {
      id: asString(campaign.id),
      name: asString(campaign.name),
      status: asString(campaign.status),
    };
  });

  const adGroups: Wp03AdGroup[] = adGroupRows.map((row) => {
    const campaign = asRecord(row.campaign) ?? {};
    const adGroup = asRecord(row.adGroup) ?? {};
    return {
      campaignId: asString(campaign.id),
      campaignName: asString(campaign.name),
      id: asString(adGroup.id),
      name: asString(adGroup.name),
      status: asString(adGroup.status),
    };
  });

  const inventory: Wp03RsaAd[] = rsaRows.map((row) => {
    const campaign = asRecord(row.campaign) ?? {};
    const adGroup = asRecord(row.adGroup) ?? {};
    const adGroupAd = asRecord(row.adGroupAd) ?? {};
    const ad = asRecord(adGroupAd.ad) ?? {};
    const rsa = asRecord(ad.responsiveSearchAd) ?? {};
    const policy = asRecord(adGroupAd.policySummary) ?? {};
    return {
      campaignId: asString(campaign.id),
      campaignName: asString(campaign.name),
      adGroupId: asString(adGroup.id),
      adGroupName: asString(adGroup.name),
      resourceName: asString(adGroupAd.resourceName),
      adId: asString(ad.id),
      status: asString(adGroupAd.status),
      adStrength: asString(adGroupAd.adStrength),
      actionItems: asStringArray(adGroupAd.actionItems),
      approvalStatus: asString(policy.approvalStatus),
      reviewStatus: asString(policy.reviewStatus),
      primaryStatus: asString(adGroupAd.primaryStatus),
      finalUrls: asStringArray(ad.finalUrls),
      headlines: textAssets(rsa.headlines),
      descriptions: textAssets(rsa.descriptions),
    };
  });

  const targets = resolveWp03Targets(campaigns, adGroups, targetManifest);
  return { campaigns, adGroups, inventory, targets };
};

const mutateRequest = async (
  accessToken: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; reason: string | null }> => {
  let response: Response;
  try {
    response = await fetch(MUTATE_URL, {
      method: "POST",
      headers: headersFor(accessToken),
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: "NETWORK_RESULT_UNKNOWN" };
  }
  if (!response.ok) {
    return { ok: false, reason: await safeProviderError(response) };
  }
  await response.text();
  return { ok: true, reason: null };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readCreateCoverage = async (
  accessToken: string,
  plan: ReturnType<typeof buildWp03CreatePlan>
) => {
  let coverage = {
    expected: plan.length,
    confirmed: 0,
    complete: plan.length === 0,
    noneApplied: true,
  };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await readProviderState(accessToken);
    coverage = createReadbackCoverage(plan, state.inventory);
    if (coverage.complete) break;
    if (attempt < 2) await sleep(1000);
  }
  return coverage;
};

const readEnableCoverage = async (
  accessToken: string,
  plan: ReturnType<typeof buildWp03EnablePlan>
) => {
  let coverage = {
    expected: plan.length,
    confirmed: 0,
    complete: plan.length === 0,
    noneApplied: true,
  };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await readProviderState(accessToken);
    coverage = enableReadbackCoverage(plan, state.inventory);
    if (coverage.complete) break;
    if (attempt < 2) await sleep(1000);
  }
  return coverage;
};

const summarizeState = (
  state: Awaited<ReturnType<typeof readProviderState>>
) => ({
  targetCampaigns: new Set(state.targets.map((item) => item.campaignId)).size,
  targetAdGroups: state.targets.length,
  existingRsaCount: state.inventory.length,
  enabledRsaCount: state.inventory.filter((item) => item.status === "ENABLED").length,
  goodOrExcellentRsaCount: state.inventory.filter((item) =>
    ["GOOD", "EXCELLENT"].includes(item.adStrength)
  ).length,
  approvedRsaCount: state.inventory.filter(
    (item) => item.approvalStatus === "APPROVED"
  ).length,
});

try {
  const auth = await resolveGoogleAdsAccessToken();
  const initialState = await readProviderState(auth.accessToken);

  if (mode === "read-enable") {
    try {
      const enablePlan = buildWp03EnablePlan(
        initialState.targets,
        initialState.inventory
      );
      console.log(
        JSON.stringify({
          result:
            enablePlan.length === 0
              ? "WP03_RSA_ENABLE_NOT_REQUIRED"
              : "WP03_RSA_ENABLE_PLAN_READY",
          mode,
          customerId: WP03_CUSTOMER_ID,
          apiVersion: API_VERSION,
          authSource: auth.source,
          mutationApplied: false,
          ...summarizeState(initialState),
          enableRows: enablePlan.length,
          planHash: hashWp03EnablePlan(enablePlan),
        })
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          result: "WP03_RSA_ENABLE_BLOCKED",
          mode,
          customerId: WP03_CUSTOMER_ID,
          authSource: auth.source,
          mutationApplied: false,
          ...summarizeState(initialState),
          blocker:
            error instanceof Error
              ? error.message.replace(/[^A-Z0-9_:\-]/gi, "_")
              : "UNKNOWN",
        })
      );
    }
    process.exit(0);
  }

  if (mode === "validate-enable" || mode === "enable") {
    const initialPlan = buildWp03EnablePlan(
      initialState.targets,
      initialState.inventory
    );
    const initialHash = hashWp03EnablePlan(initialPlan);

    if (initialPlan.length === 0) {
      console.log(
        JSON.stringify({
          result: "WP03_RSA_ENABLE_NOT_REQUIRED",
          mode,
          customerId: WP03_CUSTOMER_ID,
          authSource: auth.source,
          mutationApplied: false,
          ...summarizeState(initialState),
          planHash: initialHash,
        })
      );
      process.exit(0);
    }

    if (mode === "validate-enable") {
      const validation = await mutateRequest(
        auth.accessToken,
        buildWp03EnableMutateBody(initialPlan, true)
      );
      if (!validation.ok) {
        throw new Error("WP03_ENABLE_VALIDATE_FAILED_" + validation.reason);
      }
      console.log(
        JSON.stringify({
          result: "WP03_RSA_ENABLE_VALIDATE_ONLY_PASS",
          mode,
          customerId: WP03_CUSTOMER_ID,
          authSource: auth.source,
          mutationApplied: false,
          enableRows: initialPlan.length,
          planHash: initialHash,
        })
      );
      process.exit(0);
    }

    assertWp03Gate(
      productionGate,
      WP03_ENABLE_GATE,
      expectedPlanHash,
      initialHash
    );

    const freshState = await readProviderState(auth.accessToken);
    const freshPlan = buildWp03EnablePlan(freshState.targets, freshState.inventory);
    const freshHash = hashWp03EnablePlan(freshPlan);
    if (freshHash !== initialHash || freshHash !== expectedPlanHash) {
      throw new Error("WP03_ENABLE_FRESH_PRESTATE_DRIFT");
    }

    const validation = await mutateRequest(
      auth.accessToken,
      buildWp03EnableMutateBody(freshPlan, true)
    );
    if (!validation.ok) {
      throw new Error("WP03_ENABLE_VALIDATE_FAILED_" + validation.reason);
    }

    const dispatched = await mutateRequest(
      auth.accessToken,
      buildWp03EnableMutateBody(freshPlan, false)
    );
    const coverage = await readEnableCoverage(auth.accessToken, freshPlan);

    if (coverage.complete) {
      console.log(
        JSON.stringify({
          result: "WP03_RSA_ENABLE_CONFIRMED",
          mode,
          customerId: WP03_CUSTOMER_ID,
          authSource: auth.source,
          mutationApplied: true,
          providerAckObserved: dispatched.ok,
          dispatchReason: dispatched.reason,
          planHash: freshHash,
          expected: coverage.expected,
          confirmed: coverage.confirmed,
        })
      );
      process.exit(0);
    }

    if (coverage.noneApplied) {
      console.error(
        JSON.stringify({
          result: dispatched.ok
            ? "WP03_RSA_ENABLE_ACK_BUT_READBACK_NOT_APPLIED"
            : "WP03_RSA_ENABLE_NOT_APPLIED",
          mutationApplied: false,
          providerAckObserved: dispatched.ok,
          dispatchReason: dispatched.reason,
          planHash: freshHash,
          expected: coverage.expected,
          confirmed: coverage.confirmed,
        })
      );
      process.exit(3);
    }

    console.error(
      JSON.stringify({
        result: "WP03_RSA_ENABLE_PARTIAL_OR_AMBIGUOUS",
        mutationApplied: true,
        providerAckObserved: dispatched.ok,
        dispatchReason: dispatched.reason,
        planHash: freshHash,
        expected: coverage.expected,
        confirmed: coverage.confirmed,
        retryAllowed: false,
      })
    );
    process.exit(4);
  }

  const initialPlan = buildWp03CreatePlan(
    initialState.targets,
    initialState.inventory
  );
  const initialHash = hashWp03CreatePlan(initialPlan);

  if (mode === "dry-run-create") {
    console.log(
      JSON.stringify({
        result:
          initialPlan.length === 0
            ? "WP03_RSA_CREATE_NOT_REQUIRED"
            : "WP03_RSA_PAUSED_CREATE_PLAN_READY",
        mode,
        customerId: WP03_CUSTOMER_ID,
        apiVersion: API_VERSION,
        mutationApplied: false,
        ...summarizeState(initialState),
        createRows: initialPlan.length,
        planHash: initialHash,
      })
    );
    process.exit(0);
  }

  if (initialPlan.length === 0) {
    console.log(
      JSON.stringify({
        result: "WP03_RSA_CREATE_NOT_REQUIRED",
        mode,
        customerId: WP03_CUSTOMER_ID,
        mutationApplied: false,
        ...summarizeState(initialState),
        planHash: initialHash,
      })
    );
    process.exit(0);
  }

  if (mode === "validate-create") {
    const validation = await mutateRequest(
      auth.accessToken,
      buildWp03CreateMutateBody(initialPlan, true)
    );
    if (!validation.ok) {
      throw new Error("WP03_CREATE_VALIDATE_FAILED_" + validation.reason);
    }
    console.log(
      JSON.stringify({
        result: "WP03_RSA_CREATE_VALIDATE_ONLY_PASS",
        mode,
        customerId: WP03_CUSTOMER_ID,
        mutationApplied: false,
        createRows: initialPlan.length,
        planHash: initialHash,
      })
    );
    process.exit(0);
  }

  assertWp03Gate(
    productionGate,
    WP03_CREATE_GATE,
    expectedPlanHash,
    initialHash
  );

  const freshState = await readProviderState(auth.accessToken);
  const freshPlan = buildWp03CreatePlan(freshState.targets, freshState.inventory);
  const freshHash = hashWp03CreatePlan(freshPlan);
  if (freshHash !== initialHash || freshHash !== expectedPlanHash) {
    throw new Error("WP03_CREATE_FRESH_PRESTATE_DRIFT");
  }

  const validation = await mutateRequest(
    auth.accessToken,
    buildWp03CreateMutateBody(freshPlan, true)
  );
  if (!validation.ok) {
    throw new Error("WP03_CREATE_VALIDATE_FAILED_" + validation.reason);
  }

  const dispatched = await mutateRequest(
    auth.accessToken,
    buildWp03CreateMutateBody(freshPlan, false)
  );
  const coverage = await readCreateCoverage(auth.accessToken, freshPlan);

  if (coverage.complete) {
    console.log(
      JSON.stringify({
        result: "WP03_RSA_PAUSED_CREATE_CONFIRMED",
        mode,
        customerId: WP03_CUSTOMER_ID,
        mutationApplied: true,
        providerAckObserved: dispatched.ok,
        dispatchReason: dispatched.reason,
        planHash: freshHash,
        expected: coverage.expected,
        confirmed: coverage.confirmed,
      })
    );
    process.exit(0);
  }

  if (coverage.noneApplied) {
    console.error(
      JSON.stringify({
        result: dispatched.ok
          ? "WP03_RSA_CREATE_ACK_BUT_READBACK_NOT_APPLIED"
          : "WP03_RSA_CREATE_NOT_APPLIED",
        mutationApplied: false,
        providerAckObserved: dispatched.ok,
        dispatchReason: dispatched.reason,
        planHash: freshHash,
        expected: coverage.expected,
        confirmed: coverage.confirmed,
      })
    );
    process.exit(3);
  }

  console.error(
    JSON.stringify({
      result: "WP03_RSA_CREATE_PARTIAL_OR_AMBIGUOUS",
      mutationApplied: true,
      providerAckObserved: dispatched.ok,
      dispatchReason: dispatched.reason,
      planHash: freshHash,
      expected: coverage.expected,
      confirmed: coverage.confirmed,
      retryAllowed: false,
    })
  );
  process.exit(4);
} catch (error) {
  console.error(
    "WP03_RSA_FAIL:" +
      (error instanceof Error ? error.message : "UNKNOWN").replace(
        /[^A-Z0-9_:\-]/gi,
        "_"
      )
  );
  process.exit(1);
}
