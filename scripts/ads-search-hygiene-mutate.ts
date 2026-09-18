import { classifySearchTermForCampaign } from "./ads-search-hygiene-rules.ts";
import {
  hasGoogleAdsAuthInput,
  resolveGoogleAdsAccessToken,
} from "./google-ads-provider-auth.ts";
import {
  WP02_CUSTOMER_ID,
  assertWp02ApplyGate,
  buildWp02MutateBody,
  buildWp02Plan,
  hashWp02Plan,
  readbackCoverage,
  summarizeWp02Plan,
  type Wp02ExistingNegative,
  type Wp02ObservedCandidate,
} from "./ads-search-hygiene-mutate-contract.ts";

const API_VERSION = "v25";
const SEARCH_URL =
  `https://googleads.googleapis.com/${API_VERSION}/customers/${WP02_CUSTOMER_ID}/googleAds:searchStream`;
const MUTATE_URL =
  `https://googleads.googleapis.com/${API_VERSION}/customers/${WP02_CUSTOMER_ID}/adGroupCriteria:mutate`;

const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim();
const expectedPlanHash = process.env.ADS_HYGIENE_EXPECTED_PLAN_HASH?.trim();
const applyGate = process.env.ADS_HYGIENE_PRODUCTION_GATE?.trim();
const mode = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--validate")
    ? "validate"
    : "dry-run";

if (!hasGoogleAdsAuthInput()) {
  console.error(
    "WP02_PROVIDER_AUTH_REQUIRED:GOOGLE_ADS_ACCESS_TOKEN_OR_GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON"
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
const asNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const asBoolean = (value: unknown): boolean =>
  value === true || value === "true" || value === "TRUE";

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const dateRange = () => {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { start: isoDate(start), end: isoDate(end) };
};

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

const headersFor = (accessToken: string): Record<string, string> => ({
  authorization: `Bearer ${accessToken}`,
  "content-type": "application/json",
  ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
});

const search = async (accessToken: string, query: string): Promise<RecordLike[]> => {
  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: headersFor(accessToken),
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error("WP02_SEARCH_" + (await safeProviderError(response)));
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await response.text());
  } catch {
    throw new Error("WP02_SEARCH_RESPONSE_MALFORMED");
  }
  return rowsFrom(parsed);
};

const readObservedCandidates = async (
  accessToken: string
): Promise<Wp02ObservedCandidate[]> => {
  const range = dateRange();
  const query = `SELECT
  campaign.id,
  campaign.name,
  ad_group.id,
  ad_group.name,
  search_term_view.search_term,
  search_term_view.status,
  metrics.clicks,
  metrics.cost_micros
FROM search_term_view
WHERE campaign.status = 'ENABLED'
  AND ad_group.status = 'ENABLED'
  AND campaign.advertising_channel_type = 'SEARCH'
  AND segments.date BETWEEN '${range.start}' AND '${range.end}'
ORDER BY metrics.cost_micros DESC`;
  const rows = await search(accessToken, query);
  return rows.map((row) => {
    const campaign = asRecord(row.campaign) ?? {};
    const adGroup = asRecord(row.adGroup) ?? {};
    const view = asRecord(row.searchTermView) ?? {};
    const metrics = asRecord(row.metrics) ?? {};
    const campaignName = asString(campaign.name);
    const searchTerm = asString(view.searchTerm);
    return {
      campaignId: asString(campaign.id),
      campaignName,
      adGroupId: asString(adGroup.id),
      adGroupName: asString(adGroup.name),
      searchTerm,
      searchTermStatus: asString(view.status) || "UNKNOWN",
      clicks: asNumber(metrics.clicks),
      costMicros: asNumber(metrics.costMicros),
      decision: classifySearchTermForCampaign(campaignName, searchTerm),
    };
  });
};

const readExistingNegatives = async (
  accessToken: string
): Promise<Wp02ExistingNegative[]> => {
  const query = `SELECT
  campaign.id,
  ad_group.id,
  ad_group_criterion.resource_name,
  ad_group_criterion.status,
  ad_group_criterion.negative,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type
FROM ad_group_criterion
WHERE campaign.status = 'ENABLED'
  AND ad_group.status = 'ENABLED'
  AND campaign.advertising_channel_type = 'SEARCH'
  AND ad_group_criterion.type = 'KEYWORD'
  AND ad_group_criterion.negative = TRUE
  AND ad_group_criterion.status != 'REMOVED'`;
  const rows = await search(accessToken, query);
  return rows.map((row) => {
    const campaign = asRecord(row.campaign) ?? {};
    const adGroup = asRecord(row.adGroup) ?? {};
    const criterion = asRecord(row.adGroupCriterion) ?? {};
    const keyword = asRecord(criterion.keyword) ?? {};
    return {
      campaignId: asString(campaign.id),
      adGroupId: asString(adGroup.id),
      resourceName: asString(criterion.resourceName),
      status: asString(criterion.status),
      negative: asBoolean(criterion.negative),
      text: asString(keyword.text),
      matchType: asString(keyword.matchType),
    };
  });
};

const readPlan = async (accessToken: string) => {
  const [observed, existing] = await Promise.all([
    readObservedCandidates(accessToken),
    readExistingNegatives(accessToken),
  ]);
  return buildWp02Plan(observed, existing);
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
  // Consume the response without logging provider payloads or resource names.
  await response.text();
  return { ok: true, reason: null };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readback = async (accessToken: string, plan: Awaited<ReturnType<typeof readPlan>>) => {
  let coverage = { expected: plan.length, confirmed: 0, complete: plan.length === 0, noneApplied: true };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await readExistingNegatives(accessToken);
    coverage = readbackCoverage(plan, existing);
    if (coverage.complete || coverage.noneApplied === false) {
      if (coverage.complete) break;
    }
    if (attempt < 2) await sleep(1000);
  }
  return coverage;
};

try {
  const auth = await resolveGoogleAdsAccessToken();
  const initialPlan = await readPlan(auth.accessToken);
  const initialSummary = summarizeWp02Plan(initialPlan);

  if (mode === "dry-run") {
    console.log(
      JSON.stringify({
        result:
          initialPlan.length === 0
            ? "WP02_NO_NEW_NEGATIVE_EXACT_CANDIDATES"
            : "WP02_NEGATIVE_EXACT_PLAN_READY",
        mode,
        customerId: WP02_CUSTOMER_ID,
        apiVersion: API_VERSION,
        authSource: auth.source,
        mutationApplied: false,
        ...initialSummary,
      })
    );
    process.exit(0);
  }

  if (initialPlan.length === 0) {
    console.log(
      JSON.stringify({
        result: "WP02_NO_MUTATION_REQUIRED",
        mode,
        customerId: WP02_CUSTOMER_ID,
        authSource: auth.source,
        mutationApplied: false,
        ...initialSummary,
      })
    );
    process.exit(0);
  }

  if (mode === "validate") {
    const validation = await mutateRequest(
      auth.accessToken,
      buildWp02MutateBody(initialPlan, true)
    );
    if (!validation.ok) {
      throw new Error("WP02_VALIDATE_FAILED_" + validation.reason);
    }
    console.log(
      JSON.stringify({
        result: "WP02_VALIDATE_ONLY_PASS",
        mode,
        customerId: WP02_CUSTOMER_ID,
        mutationApplied: false,
        ...initialSummary,
      })
    );
    process.exit(0);
  }

  assertWp02ApplyGate(applyGate, expectedPlanHash, initialSummary.planHash);

  // Fresh prestate immediately before the shared write. The approved hash is
  // bound to exact candidate identity, so a provider-side drift fails closed.
  const freshPlan = await readPlan(auth.accessToken);
  const freshHash = hashWp02Plan(freshPlan);
  if (freshHash !== initialSummary.planHash || freshHash !== expectedPlanHash) {
    throw new Error("WP02_FRESH_PRESTATE_DRIFT");
  }

  const validation = await mutateRequest(
    auth.accessToken,
    buildWp02MutateBody(freshPlan, true)
  );
  if (!validation.ok) {
    throw new Error("WP02_VALIDATE_FAILED_" + validation.reason);
  }

  // Dispatch once. Never retry this mutate blindly.
  const dispatched = await mutateRequest(
    auth.accessToken,
    buildWp02MutateBody(freshPlan, false)
  );

  const coverage = await readback(auth.accessToken, freshPlan);
  if (coverage.complete) {
    console.log(
      JSON.stringify({
        result: "WP02_MUTATION_CONFIRMED",
        mode,
        customerId: WP02_CUSTOMER_ID,
        authSource: auth.source,
        mutationApplied: true,
        providerAckObserved: dispatched.ok,
        dispatchReason: dispatched.reason,
        ...summarizeWp02Plan(freshPlan),
        readbackConfirmed: coverage.confirmed,
      })
    );
    process.exit(0);
  }

  if (coverage.noneApplied) {
    console.error(
      JSON.stringify({
        result: dispatched.ok
          ? "WP02_PROVIDER_ACK_BUT_READBACK_NOT_APPLIED"
          : "WP02_MUTATION_NOT_APPLIED",
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
      result: "WP02_MUTATION_PARTIAL_OR_AMBIGUOUS",
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
    "WP02_MUTATION_FAIL:" +
      (error instanceof Error ? error.message : "UNKNOWN").replace(
        /[^A-Z0-9_:\-]/gi,
        "_"
      )
  );
  process.exit(1);
}
