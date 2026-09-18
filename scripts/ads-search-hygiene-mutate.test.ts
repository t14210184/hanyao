import assert from "node:assert/strict";
import test from "node:test";
import { classifySearchTermForCampaign } from "./ads-search-hygiene-rules.ts";
import {
  WP02_APPLY_GATE,
  assertWp02ApplyGate,
  buildWp02MutateBody,
  buildWp02Plan,
  hashWp02Plan,
  readbackCoverage,
  summarizeWp02Plan,
  type Wp02ObservedCandidate,
} from "./ads-search-hygiene-mutate-contract.ts";

const observed = (
  term: string,
  overrides: Partial<Wp02ObservedCandidate> = {}
): Wp02ObservedCandidate => ({
  campaignId: "100",
  campaignName: "冷氣維修",
  adGroupId: "200",
  adGroupName: "冷氣維修",
  searchTerm: term,
  searchTermStatus: "NONE",
  clicks: 2,
  costMicros: 45000000,
  decision: classifySearchTermForCampaign("冷氣維修", term),
  ...overrides,
});

test("WP02 plans only high-confidence exact negatives with paid-click evidence", () => {
  const plan = buildWp02Plan(
    [
      observed("日立 客服 電話"),
      observed("冷氣維修 diy"),
      observed("日立 冷氣 漏水"),
      observed("冷氣維修 價格"),
      observed("冷氣清洗 維修", { clicks: 1 }),
      observed("冷氣安裝", { clicks: 0 }),
    ],
    []
  );

  assert.deepEqual(
    plan.map((item) => item.text),
    ["冷氣維修 diy", "日立 客服 電話"]
  );
  assert.ok(plan.every((item) => ["A", "B"].includes(item.tier)));
});

test("WP02 preserves brand+fault and commercial research traffic", () => {
  assert.equal(
    classifySearchTermForCampaign("冷氣維修", "大金 冷氣 不冷").action,
    "KEEP"
  );
  assert.equal(
    classifySearchTermForCampaign("冷氣維修", "冷氣維修 費用").action,
    "KEEP_REVIEW"
  );
});

test("WP02 ignores malformed non-mutation review terms", () => {
  const plan = buildWp02Plan(
    [
      observed(
        "one two three four five six seven eight nine ten eleven"
      ),
    ],
    []
  );

  assert.deepEqual(plan, []);
});

test("WP02 collapses repeated evidence and skips an already-present exact negative", () => {
  const plan = buildWp02Plan(
    [
      observed("日立 客服 電話"),
      observed("日立 客服 電話", { clicks: 3, costMicros: 60000000 }),
      observed("冷氣維修 diy", { adGroupId: "201" }),
    ],
    [
      {
        campaignId: "100",
        adGroupId: "201",
        resourceName: "customers/4801404246/adGroupCriteria/201~9",
        status: "ENABLED",
        negative: true,
        text: "冷氣維修 diy",
        matchType: "EXACT",
      },
    ]
  );
  assert.equal(plan.length, 1);
  assert.equal(plan[0].text, "日立 客服 電話");
  assert.equal(plan[0].clicks, 5);
  assert.equal(plan[0].costMicros, 105000000);
});

test("WP02 mutate body is exact, negative, ad-group scoped and atomic", () => {
  const plan = buildWp02Plan([observed("日立 客服 電話")], []);
  const body = buildWp02MutateBody(plan, true);
  assert.equal(body.partialFailure, false);
  assert.equal(body.validateOnly, true);
  assert.equal(body.operations.length, 1);
  const create = body.operations[0].create as Record<string, unknown>;
  assert.equal(create.adGroup, "customers/4801404246/adGroups/200");
  assert.equal(create.negative, true);
  assert.equal(create.status, "ENABLED");
  assert.deepEqual(create.keyword, {
    text: "日立 客服 電話",
    matchType: "EXACT",
  });
  assert.equal("campaign" in create, false);
  assert.equal("bid" in create, false);
});

test("WP02 plan hash binds exact target identity, not spend counters", () => {
  const a = buildWp02Plan([observed("日立 客服 電話")], []);
  const b = buildWp02Plan(
    [observed("日立 客服 電話", { clicks: 9, costMicros: 999000000 })],
    []
  );
  assert.equal(hashWp02Plan(a), hashWp02Plan(b));

  const c = buildWp02Plan(
    [observed("日立 客服 電話", { adGroupId: "999" })],
    []
  );
  assert.notEqual(hashWp02Plan(a), hashWp02Plan(c));
});

test("WP02 production apply requires both gate and exact plan hash", () => {
  const plan = buildWp02Plan([observed("日立 客服 電話")], []);
  const hash = summarizeWp02Plan(plan).planHash;
  assert.doesNotThrow(() => assertWp02ApplyGate(WP02_APPLY_GATE, hash, hash));
  assert.throws(
    () => assertWp02ApplyGate(undefined, hash, hash),
    /WP02_PRODUCTION_GATE_REQUIRED/
  );
  assert.throws(
    () => assertWp02ApplyGate(WP02_APPLY_GATE, "bad", hash),
    /WP02_PLAN_HASH_MISMATCH/
  );
});

test("WP02 same-source readback distinguishes complete, none and partial", () => {
  const plan = buildWp02Plan(
    [
      observed("日立 客服 電話", { adGroupId: "200" }),
      observed("冷氣維修 diy", { adGroupId: "201" }),
    ],
    []
  );
  const one = {
    campaignId: "100",
    adGroupId: "200",
    resourceName: "customers/4801404246/adGroupCriteria/200~1",
    status: "ENABLED",
    negative: true,
    text: "日立 客服 電話",
    matchType: "EXACT",
  };
  assert.deepEqual(readbackCoverage(plan, []), {
    expected: 2,
    confirmed: 0,
    complete: false,
    noneApplied: true,
  });
  assert.deepEqual(readbackCoverage(plan, [one]), {
    expected: 2,
    confirmed: 1,
    complete: false,
    noneApplied: false,
  });
  const two = {
    ...one,
    adGroupId: "201",
    resourceName: "customers/4801404246/adGroupCriteria/201~2",
    text: "冷氣維修 diy",
  };
  assert.deepEqual(readbackCoverage(plan, [one, two]), {
    expected: 2,
    confirmed: 2,
    complete: true,
    noneApplied: false,
  });
});

test("WP02 rejects invalid provider identity before mutation planning", () => {
  assert.throws(
    () =>
      buildWp02Plan(
        [observed("日立 客服 電話", { adGroupId: "not-an-id" })],
        []
      ),
    /WP02_PROVIDER_ID_INVALID/
  );
});
