import assert from "node:assert/strict";
import test from "node:test";
import { RSA_CANDIDATES } from "./ads-rsa-candidates.ts";
import {
  WP03_CREATE_GATE,
  WP03_ENABLE_GATE,
  assertWp03Gate,
  buildWp03CreateMutateBody,
  buildWp03CreatePlan,
  buildWp03EnableMutateBody,
  buildWp03EnablePlan,
  createReadbackCoverage,
  enableReadbackCoverage,
  expectedFinalUrl,
  hashWp03CreatePlan,
  hashWp03EnablePlan,
  parseWp03TargetManifest,
  resolveWp03Targets,
  type Wp03AdGroup,
  type Wp03Campaign,
  type Wp03RsaAd,
  type Wp03Target,
} from "./ads-rsa-provider-contract.ts";

const campaignIds = new Map([
  ["冷氣維修", "101"],
  ["冷氣清洗保養", "102"],
  ["冷氣安裝", "103"],
  ["商用工程", "104"],
]);

const groupIds = new Map([
  ["冷氣維修", "201"],
  ["冷氣清洗保養", "202"],
  ["冷氣安裝", "203"],
  ["商用工程", "204"],
]);

const campaigns: Wp03Campaign[] = RSA_CANDIDATES.map((item) => ({
  id: campaignIds.get(item.campaign)!,
  name: item.campaign,
  status: "ENABLED",
}));

const adGroups: Wp03AdGroup[] = RSA_CANDIDATES.map((item) => ({
  campaignId: campaignIds.get(item.campaign)!,
  campaignName: item.campaign,
  id: groupIds.get(item.campaign)!,
  name: item.campaign + " 主群組",
  status: "ENABLED",
}));

const targets = (): Wp03Target[] =>
  resolveWp03Targets(campaigns, adGroups, null);

const adFor = (
  target: Wp03Target,
  variantId: "A" | "B",
  overrides: Partial<Wp03RsaAd> = {}
): Wp03RsaAd => {
  const candidate = RSA_CANDIDATES.find(
    (item) => item.campaign === target.campaignName
  )!;
  const variant = candidate.variants.find((item) => item.id === variantId)!;
  const adId =
    String(3000 + Number(target.adGroupId)) + (variantId === "A" ? "1" : "2");
  return {
    campaignId: target.campaignId,
    campaignName: target.campaignName,
    adGroupId: target.adGroupId,
    adGroupName: target.adGroupName,
    resourceName:
      `customers/4801404246/adGroupAds/${target.adGroupId}~${adId}`,
    adId,
    status: "PAUSED",
    adStrength: "GOOD",
    actionItems: [],
    approvalStatus: "APPROVED",
    reviewStatus: "REVIEWED",
    primaryStatus: "PAUSED",
    finalUrls: [expectedFinalUrl(candidate)],
    headlines: [...variant.headlines],
    descriptions: [...variant.descriptions],
    ...overrides,
  };
};

test("WP03 auto-targets only when each supported campaign has one enabled ad group", () => {
  const resolved = targets();
  assert.equal(resolved.length, 4);
  assert.equal(new Set(resolved.map((item) => item.campaignId)).size, 4);

  assert.throws(
    () =>
      resolveWp03Targets(
        campaigns,
        [
          ...adGroups,
          {
            ...adGroups[0],
            id: "999",
            name: "第二群組",
          },
        ],
        null
      ),
    /WP03_AUTOMATIC_TARGET_REQUIRES_ONE_ENABLED_AD_GROUP/
  );
});

test("WP03 explicit target manifest resolves exact existing enabled ad groups", () => {
  const manifest = parseWp03TargetManifest(
    JSON.stringify([
      { campaignName: "冷氣維修", adGroupId: "201" },
      { campaignName: "冷氣安裝", adGroupId: "203" },
    ])
  );
  const resolved = resolveWp03Targets(campaigns, adGroups, manifest);
  assert.deepEqual(
    resolved.map((item) => [item.campaignName, item.adGroupId]),
    [
      ["冷氣維修", "201"],
      ["冷氣安裝", "203"],
    ]
  );
  assert.throws(
    () =>
      parseWp03TargetManifest(
        JSON.stringify([
          { campaignName: "冷氣維修", adGroupId: "201" },
          { campaignName: "冷氣維修", adGroupId: "201" },
        ])
      ),
    /WP03_TARGET_MANIFEST_DUPLICATE/
  );
});

test("WP03 plans exactly two paused A/B RSA candidates per target ad group", () => {
  const plan = buildWp03CreatePlan(targets(), []);
  assert.equal(plan.length, 8);
  for (const target of targets()) {
    assert.deepEqual(
      plan
        .filter((row) => row.adGroupId === target.adGroupId)
        .map((row) => row.variantId),
      ["A", "B"]
    );
  }

  const body = buildWp03CreateMutateBody(plan, true);
  assert.equal(body.partialFailure, false);
  assert.equal(body.validateOnly, true);
  assert.equal(body.operations.length, 8);

  for (const operation of body.operations) {
    const create = operation.create;
    assert.equal(create.status, "PAUSED");
    assert.match(create.adGroup, /^customers\/4801404246\/adGroups\/\d+$/);
    assert.equal(create.ad.finalUrls.length, 1);
    assert.ok(create.ad.finalUrls[0].startsWith("https://www.xusen.pro/"));
    assert.ok(create.ad.responsiveSearchAd.headlines.length >= 8);
    assert.ok(create.ad.responsiveSearchAd.descriptions.length >= 2);
  }
});

test("WP03 never duplicates an exact existing candidate", () => {
  const resolved = targets();
  const existing = [adFor(resolved[0], "A")];
  const plan = buildWp03CreatePlan(resolved, existing);
  assert.equal(plan.length, 7);
  assert.equal(
    plan.some(
      (row) => row.adGroupId === resolved[0].adGroupId && row.variantId === "A"
    ),
    false
  );
});

test("WP03 fails closed if existing enabled RSA final URL drifts from promise matrix", () => {
  const resolved = targets();
  const drifted = adFor(resolved[0], "A", {
    status: "ENABLED",
    finalUrls: ["https://www.xusen.pro/other/"],
  });
  assert.throws(
    () => buildWp03CreatePlan(resolved, [drifted]),
    /WP03_EXISTING_RSA_FINAL_URL_DRIFT/
  );
});

test("WP03 create readback distinguishes complete, none and partial", () => {
  const resolved = targets().slice(0, 1);
  const plan = buildWp03CreatePlan(resolved, []);
  assert.equal(plan.length, 2);
  assert.deepEqual(createReadbackCoverage(plan, []), {
    expected: 2,
    confirmed: 0,
    complete: false,
    noneApplied: true,
  });
  assert.deepEqual(createReadbackCoverage(plan, [adFor(resolved[0], "A")]), {
    expected: 2,
    confirmed: 1,
    complete: false,
    noneApplied: false,
  });
  assert.deepEqual(
    createReadbackCoverage(plan, [
      adFor(resolved[0], "A"),
      adFor(resolved[0], "B"),
    ]),
    {
      expected: 2,
      confirmed: 2,
      complete: true,
      noneApplied: false,
    }
  );
});

test("WP03 enable stage requires exact A/B identity, Good/Excellent and approved policy", () => {
  const resolved = targets();
  const inventory = resolved.flatMap((target) => [
    adFor(target, "A"),
    adFor(target, "B", { adStrength: "EXCELLENT" }),
  ]);
  const plan = buildWp03EnablePlan(resolved, inventory);
  assert.equal(plan.length, 8);

  const body = buildWp03EnableMutateBody(plan, true);
  assert.equal(body.partialFailure, false);
  assert.equal(body.validateOnly, true);
  assert.equal(body.operations.length, 8);
  for (const operation of body.operations) {
    assert.deepEqual(operation.updateMask, "status");
    assert.deepEqual(Object.keys(operation.update).sort(), [
      "resourceName",
      "status",
    ]);
    assert.equal(operation.update.status, "ENABLED");
  }

  assert.throws(
    () =>
      buildWp03EnablePlan(resolved, [
        ...inventory.filter(
          (ad) =>
            !(
              ad.adGroupId === resolved[0].adGroupId &&
              ad.headlines[0] === inventory[0].headlines[0]
            )
        ),
        adFor(resolved[0], "A", { adStrength: "POOR" }),
      ]),
    /WP03_ENABLE_AD_STRENGTH_BLOCKED/
  );

  assert.throws(
    () =>
      buildWp03EnablePlan(resolved, [
        ...inventory.filter(
          (ad) =>
            !(
              ad.adGroupId === resolved[0].adGroupId &&
              ad.headlines[0] === inventory[0].headlines[0]
            )
        ),
        adFor(resolved[0], "A", { approvalStatus: "DISAPPROVED" }),
      ]),
    /WP03_ENABLE_POLICY_BLOCKED/
  );
});

test("WP03 enabled exact candidates are idempotent and excluded from enable plan", () => {
  const resolved = targets();
  const inventory = resolved.flatMap((target) => [
    adFor(target, "A", { status: "ENABLED" }),
    adFor(target, "B", { status: "ENABLED" }),
  ]);
  const plan = buildWp03EnablePlan(resolved, inventory);
  assert.equal(plan.length, 0);
});

test("WP03 enable readback verifies exact resource status and quality gates", () => {
  const resolved = targets().slice(0, 1);
  const before = [adFor(resolved[0], "A"), adFor(resolved[0], "B")];
  const plan = buildWp03EnablePlan(resolved, before);
  assert.deepEqual(enableReadbackCoverage(plan, before), {
    expected: 2,
    confirmed: 0,
    complete: false,
    noneApplied: true,
  });
  const partial = [
    { ...before[0], status: "ENABLED" },
    before[1],
  ];
  assert.deepEqual(enableReadbackCoverage(plan, partial), {
    expected: 2,
    confirmed: 1,
    complete: false,
    noneApplied: false,
  });
  const complete = before.map((ad) => ({ ...ad, status: "ENABLED" }));
  assert.deepEqual(enableReadbackCoverage(plan, complete), {
    expected: 2,
    confirmed: 2,
    complete: true,
    noneApplied: false,
  });
});

test("WP03 plan hashes bind exact targets and both Production gates fail closed", () => {
  const createPlan = buildWp03CreatePlan(targets(), []);
  const createHash = hashWp03CreatePlan(createPlan);
  assert.doesNotThrow(() =>
    assertWp03Gate(
      WP03_CREATE_GATE,
      WP03_CREATE_GATE,
      createHash,
      createHash
    )
  );
  assert.throws(
    () =>
      assertWp03Gate(undefined, WP03_CREATE_GATE, createHash, createHash),
    /WP03_PRODUCTION_GATE_REQUIRED/
  );
  assert.throws(
    () =>
      assertWp03Gate(WP03_CREATE_GATE, WP03_CREATE_GATE, "bad", createHash),
    /WP03_PLAN_HASH_MISMATCH/
  );

  const resolved = targets();
  const inventory = resolved.flatMap((target) => [
    adFor(target, "A"),
    adFor(target, "B"),
  ]);
  const enablePlan = buildWp03EnablePlan(resolved, inventory);
  const enableHash = hashWp03EnablePlan(enablePlan);
  assert.doesNotThrow(() =>
    assertWp03Gate(
      WP03_ENABLE_GATE,
      WP03_ENABLE_GATE,
      enableHash,
      enableHash
    )
  );
});
