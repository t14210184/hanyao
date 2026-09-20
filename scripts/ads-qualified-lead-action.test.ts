import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  HQ07_ACTION_CATEGORY,
  HQ07_ACTION_COUNTING_TYPE,
  HQ07_ACTION_NAME,
  HQ07_ACTION_PRIMARY_FOR_GOAL,
  HQ07_ACTION_STATUS,
  HQ07_ACTION_TYPE,
  HQ07_CREATE_PLAN_GATE,
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
  type Hq07ConversionAction,
  type Hq07ProviderState,
} from "./ads-qualified-lead-action-contract.ts";

const owner = "customers/4801404246";

const cleanState = (): Hq07ProviderState => ({
  prerequisites: {
    customerId: "4801404246",
    conversionCustomerResource: owner,
    ready: true,
    blockingReasons: [],
  },
  actions: [],
  customConversionGoals: [],
  campaignGoalConfigs: [],
  customerConversionGoals: [],
});

const action = (
  overrides: Partial<Hq07ConversionAction> = {}
): Hq07ConversionAction => ({
  id: "9990001",
  resourceName: "customers/4801404246/conversionActions/9990001",
  name: HQ07_ACTION_NAME,
  status: HQ07_ACTION_STATUS,
  type: HQ07_ACTION_TYPE,
  category: HQ07_ACTION_CATEGORY,
  countingType: HQ07_ACTION_COUNTING_TYPE,
  primaryForGoal: HQ07_ACTION_PRIMARY_FOR_GOAL,
  includeInConversionsMetric: false,
  origin: "DATA_MANAGER",
  ownerCustomer: owner,
  ...overrides,
});

test("HQ07 inventory and goal queries are exact read-only GAQL", async () => {
  assert.match(buildHq07InventoryQuery(), /FROM conversion_action/);
  assert.match(buildHq07InventoryQuery(), /owner_customer/);
  assert.match(buildHq07CustomConversionGoalQuery(), /FROM custom_conversion_goal/);
  assert.match(
    buildHq07CampaignGoalConfigQuery(),
    /FROM conversion_goal_campaign_config/
  );
  assert.match(
    buildHq07CustomerConversionGoalQuery(),
    /FROM customer_conversion_goal/
  );
  const source = await readFile(
    "scripts/ads-qualified-lead-action-contract.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /conversionActions:mutate|events:ingest/i);
});

test("HQ07 clean prestate allows exactly one Secondary One-per-click create", () => {
  const state = cleanState();
  const decision = decideHq07Prestate(state);
  assert.equal(decision.disposition, "CREATE_ALLOWED");
  const plan = buildHq07CreatePlan(state);
  const body = buildHq07CreateMutateBody(plan, true);
  assert.equal(body.partialFailure, false);
  assert.equal(body.validateOnly, true);
  assert.equal(body.responseContentType, "RESOURCE_NAME_ONLY");
  const operations = body.operations as Array<unknown>;
  assert.equal(operations.length, 1);
  assert.deepEqual(operations[0], {
    create: {
      name: HQ07_ACTION_NAME,
      category: HQ07_ACTION_CATEGORY,
      type: HQ07_ACTION_TYPE,
      status: HQ07_ACTION_STATUS,
      countingType: HQ07_ACTION_COUNTING_TYPE,
      primaryForGoal: false,
    },
  });
  assert.equal(HQ07_CREATE_PLAN_GATE, "HANYAO_HQ07_GOAL_MODE_20260920");
});

test("HQ07 plan and prestate hashes are deterministic under row order changes", () => {
  const first = cleanState();
  first.actions = [
    action({
      id: "9990002",
      resourceName: "customers/4801404246/conversionActions/9990002",
      name: "Another action",
    }),
  ];
  const second = structuredClone(first);
  second.actions.reverse();
  const firstPlan = buildHq07CreatePlan(cleanState());
  const secondPlan = buildHq07CreatePlan(cleanState());
  assert.equal(hashHq07Prestate(first), hashHq07Prestate(second));
  assert.equal(hashHq07CreatePlan(firstPlan), hashHq07CreatePlan(secondPlan));
});

test("HQ07 exact existing action is reused only when its shape is exact", () => {
  const state = cleanState();
  state.actions = [action()];
  const decision = decideHq07Prestate(state);
  assert.equal(decision.disposition, "REUSE_EXISTING");
  assert.deepEqual(decision.blockingReasons, []);

  const drifted = cleanState();
  drifted.actions = [action({ countingType: "MANY_PER_CLICK" })];
  const driftDecision = decideHq07Prestate(drifted);
  assert.equal(driftDecision.disposition, "BLOCKED");
  assert.deepEqual(driftDecision.blockingReasons, ["EXACT_ACTION_SHAPE_DRIFT"]);
});

test("HQ07 fails closed on duplicate exact names and similar qualified uploads", () => {
  const duplicate = cleanState();
  duplicate.actions = [
    action(),
    action({
      id: "9990002",
      resourceName: "customers/4801404246/conversionActions/9990002",
    }),
  ];
  assert.deepEqual(decideHq07Prestate(duplicate).blockingReasons, [
    "DUPLICATE_EXACT_ACTION_NAME",
  ]);

  const similar = cleanState();
  similar.actions = [action({ name: "HY - Qualified LINE Lead Copy" })];
  assert.deepEqual(decideHq07Prestate(similar).blockingReasons, [
    "SIMILAR_QUALIFIED_UPLOAD_ACTION_EXISTS",
  ]);
});

test("HQ07 blocks custom-goal campaign bypass of Secondary", () => {
  const state = cleanState();
  const existing = action();
  state.actions = [existing];
  state.customConversionGoals = [
    {
      resourceName: "customers/4801404246/customConversionGoals/7",
      status: "ENABLED",
      conversionActions: [existing.resourceName],
    },
  ];
  state.campaignGoalConfigs = [
    {
      customConversionGoal:
        "customers/4801404246/customConversionGoals/7",
      goalConfigLevel: "CAMPAIGN",
      campaignId: "123",
      campaignStatus: "ENABLED",
    },
  ];
  const decision = decideHq07Prestate(state);
  assert.equal(decision.disposition, "BLOCKED");
  assert.deepEqual(decision.blockingReasons, ["CUSTOM_GOAL_BIDDING_OVERRIDE_1"]);
  assert.equal(classifyHq07Readback(state, owner), "BIDDING_OVERRIDE_BLOCKED");
});

test("HQ07 readback classification distinguishes absent, drifted, and confirmed", () => {
  const absent = cleanState();
  assert.equal(classifyHq07Readback(absent, owner), "NOT_APPLIED");

  const drifted = cleanState();
  drifted.actions = [action({ primaryForGoal: true })];
  assert.equal(classifyHq07Readback(drifted, owner), "PARTIAL_OR_AMBIGUOUS");

  const confirmed = cleanState();
  confirmed.actions = [action()];
  assert.equal(classifyHq07Readback(confirmed, owner), "CONFIRMED");
});

test("HQ07 provider runner has validate-only, one-dispatch, and sanitized-error controls", async () => {
  const source = await readFile("scripts/ads-qualified-lead-action.ts", "utf8");
  assert.match(source, /conversionActions:mutate/);
  assert.match(source, /buildHq07CreateMutateBody\(initialPlan, true\)/);
  assert.match(source, /buildHq07CreateMutateBody\(freshPlan, true\)/);
  assert.match(source, /HQ07_FRESH_PRESTATE_DRIFT/);
  assert.match(source, /retryAllowed: false/);
  assert.doesNotMatch(source, /console\.(log|error)\([^\n]*(accessToken|privateKey|serviceAccount)/i);
});
