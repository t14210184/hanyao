import {
  hasGoogleAdsAuthInput,
  resolveGoogleAdsAccessToken,
} from "./google-ads-provider-auth.ts";
import {
  readHq05Prerequisites,
  type Hq05PrerequisiteVerdict,
} from "./ads-enhanced-conversion-prereq.ts";
import {
  HQ07_ACTION_NAME,
  HQ07_API_VERSION,
  HQ07_CREATE_PLAN_GATE,
  HQ07_CUSTOMER_ID,
  buildHq07CampaignGoalConfigQuery,
  buildHq07CreateMutateBody,
  buildHq07CreatePlan,
  buildHq07CustomConversionGoalQuery,
  buildHq07CustomerConversionGoalQuery,
  buildHq07InventoryQuery,
  classifyHq07Readback,
  decideHq07Prestate,
  hashHq07CreatePlan,
  hashHq07Prestate,
  parseHq07CampaignGoalConfig,
  parseHq07ConversionAction,
  parseHq07CustomerConversionGoal,
  parseHq07CustomConversionGoal,
  rowsFromSearchStream,
  summarizeHq07State,
  type Hq07ProviderState,
  type Hq07ReadbackResult,
} from "./ads-qualified-lead-action-contract.ts";

const SEARCH_URL =
  `https://googleads.googleapis.com/${HQ07_API_VERSION}/customers/${HQ07_CUSTOMER_ID}/googleAds:searchStream`;
const MUTATE_URL =
  `https://googleads.googleapis.com/${HQ07_API_VERSION}/customers/${HQ07_CUSTOMER_ID}/conversionActions:mutate`;

type RecordLike = Record<string, unknown>;

export type Hq07MutationResult = {
  ok: boolean;
  reason: string;
};

const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  ?.replace(/-/g, "")
  .trim() ?? null;

const expectedPlanHash = process.env.HQ07_EXPECTED_PLAN_HASH?.trim() || null;
const productionGate = process.env.HQ07_PRODUCTION_GATE?.trim() || null;

const safeCode = (value: string): string =>
  value.replace(/[^A-Z0-9_:-]/gi, "_").slice(0, 120);

const headersFor = (
  accessToken: string,
  loginCustomerIdOverride: string | null = loginCustomerId
): Record<string, string> => ({
  authorization: `Bearer ${accessToken}`,
  "content-type": "application/json",
  ...(loginCustomerIdOverride
    ? { "login-customer-id": loginCustomerIdOverride }
    : {}),
});

const providerError = async (response: Response): Promise<string> => {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as RecordLike;
    const error = parsed.error as RecordLike | undefined;
    const status =
      error && typeof error.status === "string" ? error.status : "UNKNOWN";
    return `HTTP_${response.status}_${safeCode(status)}`;
  } catch {
    return `HTTP_${response.status}_UNKNOWN`;
  }
};

export const searchHq07 = async (
  accessToken: string,
  query: string,
  fetchImpl: typeof fetch = fetch,
  loginCustomerIdOverride: string | null = loginCustomerId
): Promise<RecordLike[]> => {
  let response: Response;
  try {
    response = await fetchImpl(SEARCH_URL, {
      method: "POST",
      headers: headersFor(accessToken, loginCustomerIdOverride),
      body: JSON.stringify({ query }),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN";
    throw new Error(`HQ07_SEARCH_FETCH_${safeCode(reason)}`);
  }
  if (!response.ok) throw new Error(`HQ07_SEARCH_${await providerError(response)}`);
  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    throw new Error("HQ07_SEARCH_RESPONSE_MALFORMED");
  }
  return rowsFromSearchStream(payload);
};

export const mutateHq07 = async (
  accessToken: string,
  body: RecordLike,
  fetchImpl: typeof fetch = fetch,
  loginCustomerIdOverride: string | null = loginCustomerId
): Promise<Hq07MutationResult> => {
  try {
    const response = await fetchImpl(MUTATE_URL, {
      method: "POST",
      headers: headersFor(accessToken, loginCustomerIdOverride),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { ok: false, reason: await providerError(response) };
    }
    await response.text();
    return { ok: true, reason: `HTTP_${response.status}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN";
    return { ok: false, reason: `FETCH_${safeCode(reason)}` };
  }
};

const stateFromReads = (
  prerequisite: Hq05PrerequisiteVerdict,
  actionRows: RecordLike[],
  customGoalRows: RecordLike[],
  campaignGoalRows: RecordLike[],
  customerGoalRows: RecordLike[]
): Hq07ProviderState => ({
  prerequisites: {
    customerId: prerequisite.customer.customerId,
    conversionCustomerResource:
      prerequisite.customer.googleAdsConversionCustomer ??
      `customers/${prerequisite.customer.customerId}`,
    ready: prerequisite.result === "READY",
    blockingReasons: [...prerequisite.blockingReasons],
  },
  actions: actionRows.map(parseHq07ConversionAction),
  customConversionGoals: customGoalRows.map(parseHq07CustomConversionGoal),
  campaignGoalConfigs: campaignGoalRows.map(parseHq07CampaignGoalConfig),
  customerConversionGoals: customerGoalRows.map(parseHq07CustomerConversionGoal),
});

export const readHq07ProviderState = async (
  accessToken: string,
  loginCustomerIdOverride: string | null = loginCustomerId,
  fetchImpl: typeof fetch = fetch
): Promise<Hq07ProviderState> => {
  const prerequisite = await readHq05Prerequisites(
    accessToken,
    loginCustomerIdOverride,
    fetchImpl
  );
  const [actionRows, customGoalRows, campaignGoalRows, customerGoalRows] =
    await Promise.all([
      searchHq07(
        accessToken,
        buildHq07InventoryQuery(),
        fetchImpl,
        loginCustomerIdOverride
      ),
      searchHq07(
        accessToken,
        buildHq07CustomConversionGoalQuery(),
        fetchImpl,
        loginCustomerIdOverride
      ),
      searchHq07(
        accessToken,
        buildHq07CampaignGoalConfigQuery(),
        fetchImpl,
        loginCustomerIdOverride
      ),
      searchHq07(
        accessToken,
        buildHq07CustomerConversionGoalQuery(),
        fetchImpl,
        loginCustomerIdOverride
      ),
    ]);
  return stateFromReads(
    prerequisite,
    actionRows,
    customGoalRows,
    campaignGoalRows,
    customerGoalRows
  );
};

const publicSummary = (state: Hq07ProviderState) => {
  const summary = summarizeHq07State(state);
  const { existingResourceName, ...safeSummary } = summary;
  return {
    ...safeSummary,
    existingActionPresent: existingResourceName !== null,
    prestateHash: hashHq07Prestate(state),
  };
};

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const readHq07Readback = async (
  accessToken: string,
  expectedOwner: string,
  fetchImpl: typeof fetch = fetch
): Promise<{
  state: Hq07ProviderState;
  result: Hq07ReadbackResult;
  attempts: number;
}> => {
  let state = await readHq07ProviderState(accessToken, loginCustomerId, fetchImpl);
  let result = classifyHq07Readback(state, expectedOwner);
  for (let attempt = 1; attempt < 3 && result === "NOT_APPLIED"; attempt += 1) {
    await sleep(1000);
    state = await readHq07ProviderState(accessToken, loginCustomerId, fetchImpl);
    result = classifyHq07Readback(state, expectedOwner);
    if (result !== "NOT_APPLIED") return { state, result, attempts: attempt + 1 };
  }
  return { state, result, attempts: result === "NOT_APPLIED" ? 3 : 1 };
};

const modeFromArgs = (): "dry-run" | "readback" | "validate-create" | "apply" => {
  const args = new Set(process.argv.slice(2));
  if (args.has("--apply")) return "apply";
  if (args.has("--validate-create")) return "validate-create";
  if (args.has("--readback")) return "readback";
  return "dry-run";
};

const emitBlocked = (
  mode: string,
  state: Hq07ProviderState,
  reasons: string[]
): void => {
  console.log(
    JSON.stringify({
      result: "HQ07_CREATE_BLOCKED",
      mode,
      mutationCount: 0,
      mutationApplied: false,
      ...publicSummary(state),
      blocker: reasons,
    })
  );
};

const main = async (): Promise<void> => {
  const mode = modeFromArgs();
  if (!hasGoogleAdsAuthInput()) {
    if (mode === "dry-run") {
      console.log(
        JSON.stringify({
          result: "HQ07_PROVIDER_AUTH_SKIPPED_NO_PROVIDER_AUTH",
          mode,
          customerId: HQ07_CUSTOMER_ID,
          actionName: HQ07_ACTION_NAME,
          mutationCount: 0,
          mutationApplied: false,
        })
      );
      return;
    }
    throw new Error(
      "HQ07_PROVIDER_AUTH_REQUIRED_GOOGLE_ADS_ACCESS_TOKEN_OR_GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON"
    );
  }

  const auth = await resolveGoogleAdsAccessToken(process.env);
  const state = await readHq07ProviderState(auth.accessToken);
  const decision = decideHq07Prestate(state);

  if (mode === "readback") {
    console.log(
      JSON.stringify({
        result: classifyHq07Readback(
          state,
          state.prerequisites.conversionCustomerResource
        ),
        mode,
        authSource: auth.source,
        mutationCount: 0,
        mutationApplied: false,
        ...publicSummary(state),
      })
    );
    return;
  }

  if (decision.disposition === "REUSE_EXISTING") {
    console.log(
      JSON.stringify({
        result: "HQ07_ACTION_ALREADY_EXISTS_REUSE_NO_CREATE",
        mode,
        authSource: auth.source,
        mutationCount: 0,
        mutationApplied: false,
        ...publicSummary(state),
      })
    );
    return;
  }

  if (decision.disposition !== "CREATE_ALLOWED") {
    emitBlocked(mode, state, decision.blockingReasons);
    if (mode !== "dry-run") process.exitCode = 2;
    return;
  }

  const initialPlan = buildHq07CreatePlan(state);
  const initialPlanHash = hashHq07CreatePlan(initialPlan);

  if (mode === "dry-run") {
    console.log(
      JSON.stringify({
        result: "HQ07_CREATE_PLAN_READY",
        mode,
        authSource: auth.source,
        mutationCount: 0,
        mutationApplied: false,
        ...publicSummary(state),
        planHash: initialPlanHash,
      })
    );
    return;
  }

  if (mode === "validate-create") {
    const validation = await mutateHq07(
      auth.accessToken,
      buildHq07CreateMutateBody(initialPlan, true)
    );
    if (!validation.ok) {
      throw new Error(`HQ07_VALIDATE_ONLY_FAILED_${safeCode(validation.reason)}`);
    }
    console.log(
      JSON.stringify({
        result: "HQ07_CREATE_VALIDATE_ONLY_PASS",
        mode,
        authSource: auth.source,
        customerId: HQ07_CUSTOMER_ID,
        mutationCount: 0,
        mutationApplied: false,
        planHash: initialPlanHash,
      })
    );
    return;
  }

  if (productionGate !== HQ07_CREATE_PLAN_GATE) {
    throw new Error("HQ07_PRODUCTION_GATE_REQUIRED");
  }
  if (!expectedPlanHash || expectedPlanHash !== initialPlanHash) {
    throw new Error("HQ07_EXPECTED_PLAN_HASH_DRIFT");
  }

  const freshState = await readHq07ProviderState(auth.accessToken);
  const freshDecision = decideHq07Prestate(freshState);
  if (freshDecision.disposition !== "CREATE_ALLOWED") {
    emitBlocked("apply-fresh", freshState, freshDecision.blockingReasons);
    process.exitCode = 2;
    return;
  }
  const freshPlan = buildHq07CreatePlan(freshState);
  const freshPlanHash = hashHq07CreatePlan(freshPlan);
  if (freshPlanHash !== initialPlanHash || freshPlanHash !== expectedPlanHash) {
    throw new Error("HQ07_FRESH_PRESTATE_DRIFT");
  }

  const validation = await mutateHq07(
    auth.accessToken,
    buildHq07CreateMutateBody(freshPlan, true)
  );
  if (!validation.ok) {
    throw new Error(`HQ07_VALIDATE_ONLY_FAILED_${safeCode(validation.reason)}`);
  }

  const dispatched = await mutateHq07(
    auth.accessToken,
    buildHq07CreateMutateBody(freshPlan, false)
  );
  const readback = await readHq07Readback(
    auth.accessToken,
    freshDecision.expectedOwner
  );

  const base = {
    mode,
    authSource: auth.source,
    customerId: HQ07_CUSTOMER_ID,
    mutationCount: 1,
    providerAckObserved: dispatched.ok,
    dispatchReason: dispatched.reason,
    planHash: freshPlanHash,
    readback: readback.result,
    readbackAttempts: readback.attempts,
    retryAllowed: false,
  };

  if (readback.result === "CONFIRMED") {
    console.log(
      JSON.stringify({
        result: "HQ07_CREATE_CONFIRMED",
        mutationApplied: true,
        ...base,
      })
    );
    return;
  }

  console.error(
    JSON.stringify({
      result:
        readback.result === "NOT_APPLIED"
          ? dispatched.ok
            ? "HQ07_ACK_BUT_READBACK_NOT_APPLIED"
            : "HQ07_CREATE_NOT_APPLIED"
          : readback.result === "BIDDING_OVERRIDE_BLOCKED"
            ? "HQ07_CREATED_BUT_BIDDING_OVERRIDE_BLOCKED"
            : "HQ07_CREATE_PARTIAL_OR_AMBIGUOUS",
      mutationApplied: readback.result === "BIDDING_OVERRIDE_BLOCKED",
      ...base,
    })
  );
  process.exitCode = readback.result === "NOT_APPLIED" ? 3 : 4;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : "HQ07_UNKNOWN";
    console.error(`HQ07_FAIL:${safeCode(message)}`);
    process.exitCode = 1;
  });
}
