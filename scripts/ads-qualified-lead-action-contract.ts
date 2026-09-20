import { createHash } from "node:crypto";

export const HQ07_CONTRACT_VERSION = "hanyao-hq07-qualified-lead-action-v1";
export const HQ07_API_VERSION = "v25";
export const HQ07_GOOGLE_ADS_API_VERSION = HQ07_API_VERSION;
export const HQ07_CUSTOMER_ID = "4801404246";
export const HQ07_CREATE_PLAN_GATE = "HANYAO_HQ07_GOAL_MODE_20260920";
export const HQ07_ACTION_NAME = "HY - Qualified LINE Lead";
export const HQ07_ACTION_CATEGORY = "QUALIFIED_LEAD";
export const HQ07_ACTION_TYPE = "UPLOAD_CLICKS";
export const HQ07_ACTION_COUNTING_TYPE = "ONE_PER_CLICK";
export const HQ07_ACTION_STATUS = "ENABLED";
export const HQ07_ACTION_PRIMARY_FOR_GOAL = false;

type RecordLike = Record<string, unknown>;

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const asString = (value: unknown): string | null => {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const asBoolean = (value: unknown): boolean => value === true || value === "true";

const resourceForCustomer = (customerId: string): string =>
  `customers/${customerId}`;

const sortStrings = (values: readonly string[]): string[] =>
  [...values].sort((left, right) => left.localeCompare(right));

export type Hq07ConversionAction = {
  id: string;
  resourceName: string;
  name: string;
  status: string;
  type: string;
  category: string;
  countingType: string;
  primaryForGoal: boolean;
  includeInConversionsMetric: boolean;
  origin: string;
  ownerCustomer: string | null;
};

export type Hq07CustomConversionGoal = {
  resourceName: string;
  status: string;
  conversionActions: string[];
};

export type Hq07CampaignGoalConfig = {
  customConversionGoal: string | null;
  goalConfigLevel: string;
  campaignId: string;
  campaignStatus: string;
};

export type Hq07CustomerConversionGoal = {
  resourceName: string;
  category: string;
  origin: string;
  biddable: boolean;
};

export type Hq07PrerequisiteStatus = {
  customerId: string;
  conversionCustomerResource: string;
  ready: boolean;
  blockingReasons: string[];
};

export type Hq07ProviderState = {
  prerequisites: Hq07PrerequisiteStatus;
  actions: Hq07ConversionAction[];
  customConversionGoals: Hq07CustomConversionGoal[];
  campaignGoalConfigs: Hq07CampaignGoalConfig[];
  customerConversionGoals: Hq07CustomerConversionGoal[];
};

export type Hq07DecisionDisposition = "CREATE_ALLOWED" | "REUSE_EXISTING" | "BLOCKED";

export type Hq07Decision = {
  disposition: Hq07DecisionDisposition;
  blockingReasons: string[];
  expectedOwner: string;
  exactMatches: Hq07ConversionAction[];
  similarMatches: Hq07ConversionAction[];
  activeCustomGoalCampaignCount: number;
  existingResourceName: string | null;
};

export type Hq07CreatePlan = {
  contractVersion: typeof HQ07_CONTRACT_VERSION;
  customerId: typeof HQ07_CUSTOMER_ID;
  expectedOwner: string;
  actionName: typeof HQ07_ACTION_NAME;
  prestateFingerprint: string;
  operation: {
    create: {
      name: typeof HQ07_ACTION_NAME;
      category: typeof HQ07_ACTION_CATEGORY;
      type: typeof HQ07_ACTION_TYPE;
      status: typeof HQ07_ACTION_STATUS;
      countingType: typeof HQ07_ACTION_COUNTING_TYPE;
      primaryForGoal: false;
    };
  };
};

export type Hq07ReadbackResult =
  | "CONFIRMED"
  | "NOT_APPLIED"
  | "PARTIAL_OR_AMBIGUOUS"
  | "BIDDING_OVERRIDE_BLOCKED";

export const buildHq07InventoryQuery = (): string => `SELECT
  conversion_action.id,
  conversion_action.resource_name,
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
WHERE conversion_action.status != 'REMOVED'`;

export const buildHq07CustomConversionGoalQuery = (): string => `SELECT
  custom_conversion_goal.resource_name,
  custom_conversion_goal.status,
  custom_conversion_goal.conversion_actions
FROM custom_conversion_goal`;

export const buildHq07CampaignGoalConfigQuery = (): string => `SELECT
  conversion_goal_campaign_config.custom_conversion_goal,
  conversion_goal_campaign_config.goal_config_level,
  campaign.id,
  campaign.status
FROM conversion_goal_campaign_config
WHERE campaign.status != 'REMOVED'`;

export const buildHq07CustomerConversionGoalQuery = (): string => `SELECT
  customer_conversion_goal.resource_name,
  customer_conversion_goal.category,
  customer_conversion_goal.origin,
  customer_conversion_goal.biddable
FROM customer_conversion_goal`;

export const rowsFromSearchStream = (payload: unknown): RecordLike[] => {
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

export const parseHq07ConversionAction = (
  row: RecordLike
): Hq07ConversionAction => {
  const action = asRecord(row.conversionAction) ?? {};
  return {
    id: asString(action.id) ?? "",
    resourceName: asString(action.resourceName) ?? "",
    name: asString(action.name) ?? "",
    status: asString(action.status) ?? "UNKNOWN",
    type: asString(action.type) ?? "UNKNOWN",
    category: asString(action.category) ?? "UNKNOWN",
    countingType: asString(action.countingType) ?? "UNKNOWN",
    primaryForGoal: asBoolean(action.primaryForGoal),
    includeInConversionsMetric: asBoolean(action.includeInConversionsMetric),
    origin: asString(action.origin) ?? "UNKNOWN",
    ownerCustomer: asString(action.ownerCustomer),
  };
};

export const parseHq07CustomConversionGoal = (
  row: RecordLike
): Hq07CustomConversionGoal => {
  const goal = asRecord(row.customConversionGoal) ?? {};
  return {
    resourceName: asString(goal.resourceName) ?? "",
    status: asString(goal.status) ?? "UNKNOWN",
    conversionActions: Array.isArray(goal.conversionActions)
      ? goal.conversionActions.filter(
          (value): value is string => typeof value === "string"
        )
      : [],
  };
};

export const parseHq07CampaignGoalConfig = (
  row: RecordLike
): Hq07CampaignGoalConfig => {
  const config = asRecord(row.conversionGoalCampaignConfig) ?? {};
  const campaign = asRecord(row.campaign) ?? {};
  return {
    customConversionGoal: asString(config.customConversionGoal),
    goalConfigLevel: asString(config.goalConfigLevel) ?? "UNKNOWN",
    campaignId: asString(campaign.id) ?? "",
    campaignStatus: asString(campaign.status) ?? "UNKNOWN",
  };
};

export const parseHq07CustomerConversionGoal = (
  row: RecordLike
): Hq07CustomerConversionGoal => {
  const goal = asRecord(row.customerConversionGoal) ?? {};
  return {
    resourceName: asString(goal.resourceName) ?? "",
    category: asString(goal.category) ?? "UNKNOWN",
    origin: asString(goal.origin) ?? "UNKNOWN",
    biddable: asBoolean(goal.biddable),
  };
};

const actionShapeMatches = (
  action: Hq07ConversionAction,
  expectedOwner: string
): boolean =>
  action.name === HQ07_ACTION_NAME &&
  action.ownerCustomer === expectedOwner &&
  action.status === HQ07_ACTION_STATUS &&
  action.type === HQ07_ACTION_TYPE &&
  action.category === HQ07_ACTION_CATEGORY &&
  action.countingType === HQ07_ACTION_COUNTING_TYPE &&
  action.primaryForGoal === HQ07_ACTION_PRIMARY_FOR_GOAL &&
  action.resourceName.length > 0;

const activeCustomGoalCampaignCount = (
  resourceName: string,
  customConversionGoals: readonly Hq07CustomConversionGoal[],
  campaignGoalConfigs: readonly Hq07CampaignGoalConfig[]
): number => {
  const enabledGoalResources = new Set(
    customConversionGoals
      .filter(
        (goal) =>
          goal.status === "ENABLED" && goal.conversionActions.includes(resourceName)
      )
      .map((goal) => goal.resourceName)
      .filter((resourceName) => resourceName.length > 0)
  );
  return campaignGoalConfigs.filter(
    (config) =>
      config.campaignStatus !== "REMOVED" &&
      config.customConversionGoal !== null &&
      enabledGoalResources.has(config.customConversionGoal)
  ).length;
};

export const decideHq07Prestate = (
  state: Hq07ProviderState
): Hq07Decision => {
  const expectedOwner =
    state.prerequisites.conversionCustomerResource ||
    resourceForCustomer(HQ07_CUSTOMER_ID);
  const exactMatches = state.actions.filter(
    (action) => action.name === HQ07_ACTION_NAME
  );
  const similarMatches = state.actions.filter(
    (action) =>
      action.name !== HQ07_ACTION_NAME &&
      action.ownerCustomer === expectedOwner &&
      action.status !== "REMOVED" &&
      action.type === HQ07_ACTION_TYPE &&
      action.category === HQ07_ACTION_CATEGORY
  );
  const reasons: string[] = [];

  if (!state.prerequisites.ready) {
    reasons.push("HQ05_PREREQUISITES_NOT_READY");
  }
  if (state.prerequisites.customerId !== HQ07_CUSTOMER_ID) {
    reasons.push("CUSTOMER_IDENTITY_DRIFT");
  }
  if (exactMatches.length > 1) {
    reasons.push("DUPLICATE_EXACT_ACTION_NAME");
  }
  if (similarMatches.length > 0 && exactMatches.length === 0) {
    reasons.push("SIMILAR_QUALIFIED_UPLOAD_ACTION_EXISTS");
  }

  if (exactMatches.length === 1) {
    const existing = exactMatches[0];
    if (!actionShapeMatches(existing, expectedOwner)) {
      reasons.push("EXACT_ACTION_SHAPE_DRIFT");
    }
    const overrideCount = activeCustomGoalCampaignCount(
      existing.resourceName,
      state.customConversionGoals,
      state.campaignGoalConfigs
    );
    if (overrideCount > 0) {
      reasons.push(`CUSTOM_GOAL_BIDDING_OVERRIDE_${overrideCount}`);
    }
    return {
      disposition:
        reasons.length === 0 ? "REUSE_EXISTING" : "BLOCKED",
      blockingReasons: reasons,
      expectedOwner,
      exactMatches,
      similarMatches,
      activeCustomGoalCampaignCount: overrideCount,
      existingResourceName: existing.resourceName || null,
    };
  }

  return {
    disposition: reasons.length === 0 ? "CREATE_ALLOWED" : "BLOCKED",
    blockingReasons: reasons,
    expectedOwner,
    exactMatches,
    similarMatches,
    activeCustomGoalCampaignCount: 0,
    existingResourceName: null,
  };
};

const prestateFingerprintInput = (state: Hq07ProviderState): RecordLike => ({
  contractVersion: HQ07_CONTRACT_VERSION,
  customerId: state.prerequisites.customerId,
  conversionCustomerResource: state.prerequisites.conversionCustomerResource,
  prerequisitesReady: state.prerequisites.ready,
  prerequisiteBlockingReasons: sortStrings(state.prerequisites.blockingReasons),
  actions: [...state.actions]
    .map((action) => ({ ...action }))
    .sort((left, right) => left.resourceName.localeCompare(right.resourceName)),
  customConversionGoals: [...state.customConversionGoals]
    .map((goal) => ({
      ...goal,
      conversionActions: sortStrings(goal.conversionActions),
    }))
    .sort((left, right) => left.resourceName.localeCompare(right.resourceName)),
  campaignGoalConfigs: [...state.campaignGoalConfigs].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right))
  ),
});

export const hashHq07Prestate = (state: Hq07ProviderState): string =>
  createHash("sha256")
    .update(JSON.stringify(prestateFingerprintInput(state)))
    .digest("hex");

export const buildHq07CreatePlan = (
  state: Hq07ProviderState
): Hq07CreatePlan => {
  const decision = decideHq07Prestate(state);
  if (decision.disposition !== "CREATE_ALLOWED") {
    throw new Error(
      `HQ07_CREATE_NOT_ALLOWED_${decision.disposition}_${decision.blockingReasons.join(",")}`
    );
  }
  return {
    contractVersion: HQ07_CONTRACT_VERSION,
    customerId: HQ07_CUSTOMER_ID,
    expectedOwner: decision.expectedOwner,
    actionName: HQ07_ACTION_NAME,
    prestateFingerprint: hashHq07Prestate(state),
    operation: {
      create: {
        name: HQ07_ACTION_NAME,
        category: HQ07_ACTION_CATEGORY,
        type: HQ07_ACTION_TYPE,
        status: HQ07_ACTION_STATUS,
        countingType: HQ07_ACTION_COUNTING_TYPE,
        primaryForGoal: false,
      },
    },
  };
};

export const hashHq07CreatePlan = (plan: Hq07CreatePlan): string =>
  createHash("sha256").update(JSON.stringify(plan)).digest("hex");

export const buildHq07CreateMutateBody = (
  plan: Hq07CreatePlan,
  validateOnly: boolean
): RecordLike => ({
  operations: [plan.operation],
  partialFailure: false,
  validateOnly,
  responseContentType: "RESOURCE_NAME_ONLY",
});

export const classifyHq07Readback = (
  state: Hq07ProviderState,
  expectedOwner: string
): Hq07ReadbackResult => {
  const exactMatches = state.actions.filter(
    (action) => action.name === HQ07_ACTION_NAME
  );
  if (exactMatches.length !== 1) {
    return exactMatches.length === 0 ? "NOT_APPLIED" : "PARTIAL_OR_AMBIGUOUS";
  }
  const action = exactMatches[0];
  if (!actionShapeMatches(action, expectedOwner)) return "PARTIAL_OR_AMBIGUOUS";
  const overrideCount = activeCustomGoalCampaignCount(
    action.resourceName,
    state.customConversionGoals,
    state.campaignGoalConfigs
  );
  return overrideCount > 0 ? "BIDDING_OVERRIDE_BLOCKED" : "CONFIRMED";
};

export const summarizeHq07State = (state: Hq07ProviderState) => {
  const decision = decideHq07Prestate(state);
  return {
    customerId: state.prerequisites.customerId,
    conversionCustomerResource: state.prerequisites.conversionCustomerResource,
    prerequisiteReady: state.prerequisites.ready,
    prerequisiteBlockingReasons: state.prerequisites.blockingReasons,
    actionCount: state.actions.length,
    exactNameCount: decision.exactMatches.length,
    similarQualifiedUploadCount: decision.similarMatches.length,
    customConversionGoalCount: state.customConversionGoals.length,
    campaignGoalConfigCount: state.campaignGoalConfigs.length,
    customerConversionGoalCount: state.customerConversionGoals.length,
    decision: decision.disposition,
    decisionBlockingReasons: decision.blockingReasons,
    existingResourceName: decision.existingResourceName,
  };
};
