import assert from "node:assert/strict";
import test from "node:test";
import {
  WP05_LINE_ID,
  WP05_UI_DISPATCH_GATE,
  assertWp05UiDispatchGate,
  buildWp05RollbackTarget,
  evaluateWp05UiPoststate,
  evaluateWp05UiPrestate,
  hashWp05UiPrestate,
  type Wp05UiPoststate,
  type Wp05UiPrestate,
} from "./ads-line-message-ui-execution-contract.ts";

const NOW = new Date("2026-09-18T05:45:00.000Z");

const prestate = (
  overrides: Partial<Wp05UiPrestate> = {}
): Wp05UiPrestate => ({
  schemaVersion: 1,
  capturedAt: "2026-09-18T05:35:00.000Z",
  customerId: "4801404246",
  campaignId: "1234567890",
  campaignName: "冷氣維修",
  campaignStatus: "ENABLED",
  advertiserVerificationStatus: "VERIFIED",
  messageAssetBetaEligible: true,
  linePlatformFieldPresent: true,
  lineIdFieldPresent: true,
  linePlatformValue: "Line",
  lineIdValue: WP05_LINE_ID,
  biddingStrategyType: "TARGET_SPEND",
  optimizationSetFingerprint: "sha256:optimization-before",
  nonMessageAssetAssociationFingerprint: "sha256:call-lead-before",
  canonicalHy: {
    conversionActionId: "7674301565",
    name: "HY - Verified LINE Contact",
    primary: false,
    counting: "MANY_PER_CLICK",
  },
  existingMessageAssetResourceNames: [],
  ...overrides,
});

const poststate = (
  overrides: Partial<Wp05UiPoststate> = {},
  messageOverrides: Partial<Wp05UiPoststate["messageAsset"]> = {}
): Wp05UiPoststate => ({
  ...prestate(),
  capturedAt: "2026-09-18T05:42:00.000Z",
  existingMessageAssetResourceNames: ["customers/4801404246/assets/999"],
  messageAsset: {
    resourceName: "customers/4801404246/assets/999",
    platform: "Line",
    lineId: WP05_LINE_ID,
    starterMessage:
      "您好，我的冷氣有問題，想先傳照片或症狀請協助判斷。",
    associationScope: "CAMPAIGN",
    associationCampaignId: "1234567890",
    associationStatus: "ENABLED",
    approvalStatus: "APPROVED",
    verificationStatus: "VERIFIED",
    ...messageOverrides,
  },
  ...overrides,
});

test("WP05 fresh exact LINE UI prestate is eligible", () => {
  const before = prestate();
  const result = evaluateWp05UiPrestate(before, NOW);
  assert.equal(result.status, "WP05_UI_PRESTATE_READY");
  if (result.status === "WP05_UI_PRESTATE_READY") {
    assert.equal(result.prestateHash, hashWp05UiPrestate(before));
    assert.match(result.prestateHash, /^[a-f0-9]{64}$/);
    assert.match(result.frozenHash, /^[a-f0-9]{64}$/);
  }
});

test("WP05 prestate fails closed on stale evidence or account UI mismatch", () => {
  const result = evaluateWp05UiPrestate(
    prestate({
      capturedAt: "2026-09-18T04:00:00.000Z",
      messageAssetBetaEligible: false,
      lineIdValue: "@wrong",
    }),
    NOW
  );
  assert.equal(result.status, "WP05_UI_PRESTATE_BLOCKED");
  if (result.status === "WP05_UI_PRESTATE_BLOCKED") {
    assert.ok(result.blockers.includes("PRESTATE_NOT_FRESH"));
    assert.ok(result.blockers.includes("MESSAGE_ASSET_BETA_NOT_ELIGIBLE"));
    assert.ok(result.blockers.includes("LINE_ID_MISMATCH"));
  }
});

test("WP05 prestate rejects any HY canonical conversion drift", () => {
  const result = evaluateWp05UiPrestate(
    prestate({
      canonicalHy: {
        conversionActionId: "7674301565",
        name: "HY - Verified LINE Contact",
        primary: true,
        counting: "ONE_PER_CLICK",
      },
    }),
    NOW
  );
  assert.equal(result.status, "WP05_UI_PRESTATE_BLOCKED");
  if (result.status === "WP05_UI_PRESTATE_BLOCKED") {
    assert.ok(result.blockers.includes("CANONICAL_HY_PRIMARY_DRIFT"));
    assert.ok(result.blockers.includes("CANONICAL_HY_COUNTING_DRIFT"));
  }
});

test("WP05 approved exact LINE association passes only with frozen state unchanged", () => {
  const before = prestate();
  const after = poststate();
  const result = evaluateWp05UiPoststate(before, after, NOW);
  assert.equal(result.status, "WP05_MESSAGE_ASSET_ACTIVE_PASS");
  if (result.status === "WP05_MESSAGE_ASSET_ACTIVE_PASS") {
    assert.equal(result.assetResourceName, "customers/4801404246/assets/999");
    assert.match(result.prestateHash, /^[a-f0-9]{64}$/);
    assert.match(result.poststateHash, /^[a-f0-9]{64}$/);
  }
});

test("WP05 under-review save is not promoted to ACTIVE PASS", () => {
  const result = evaluateWp05UiPoststate(
    prestate(),
    poststate(
      {},
      {
        approvalStatus: "UNDER_REVIEW",
        verificationStatus: "PENDING",
      }
    ),
    NOW
  );
  assert.equal(result.status, "WP05_MESSAGE_ASSET_SAVED_PENDING_REVIEW");
  if (result.status === "WP05_MESSAGE_ASSET_SAVED_PENDING_REVIEW") {
    assert.deepEqual(result.pending.sort(), [
      "MESSAGE_ASSET_VERIFICATION_PENDING",
      "POLICY_APPROVAL_PENDING",
    ]);
  }
});

test("WP05 stops on bidding, optimization-set, call/lead-form, or HY drift", () => {
  const before = prestate();
  const after = poststate({
    biddingStrategyType: "MAXIMIZE_CONVERSIONS",
    optimizationSetFingerprint: "sha256:changed",
    nonMessageAssetAssociationFingerprint: "sha256:changed-assets",
    canonicalHy: {
      ...before.canonicalHy,
      primary: true,
    },
  });
  const result = evaluateWp05UiPoststate(before, after, NOW);
  assert.equal(result.status, "WP05_MESSAGE_ASSET_BLOCKED");
  if (result.status === "WP05_MESSAGE_ASSET_BLOCKED") {
    assert.ok(result.blockers.includes("BIDDING_STRATEGY_DRIFT"));
    assert.ok(result.blockers.includes("OPTIMIZATION_SET_DRIFT"));
    assert.ok(result.blockers.includes("CALL_OR_LEAD_FORM_ASSOCIATION_DRIFT"));
    assert.ok(result.blockers.includes("CANONICAL_HY_DRIFT"));
  }
});

test("WP05 only accepts exact LINE identity and approved starter candidates", () => {
  const wrongLine = evaluateWp05UiPoststate(
    prestate(),
    poststate({}, { lineId: "@wrong" }),
    NOW
  );
  assert.equal(wrongLine.status, "WP05_MESSAGE_ASSET_BLOCKED");

  const wrongStarter = evaluateWp05UiPoststate(
    prestate(),
    poststate({}, { starterMessage: "免費立即到場，保證最低價" }),
    NOW
  );
  assert.equal(wrongStarter.status, "WP05_MESSAGE_ASSET_BLOCKED");
  if (wrongStarter.status === "WP05_MESSAGE_ASSET_BLOCKED") {
    assert.ok(wrongStarter.blockers.includes("STARTER_MESSAGE_NOT_APPROVED_CANDIDATE"));
  }
});

test("WP05 dispatch gate binds exact fresh prestate hash", () => {
  const before = prestate();
  const hash = hashWp05UiPrestate(before);
  assert.doesNotThrow(() =>
    assertWp05UiDispatchGate(WP05_UI_DISPATCH_GATE, hash, hash)
  );
  assert.throws(
    () => assertWp05UiDispatchGate(undefined, hash, hash),
    /WP05_UI_PRODUCTION_GATE_REQUIRED/
  );
  assert.throws(
    () => assertWp05UiDispatchGate(WP05_UI_DISPATCH_GATE, "bad", hash),
    /WP05_UI_PRESTATE_HASH_MISMATCH/
  );
});

test("WP05 rollback target disassociates exact message asset without touching business levers", () => {
  const rollback = buildWp05RollbackTarget(poststate());
  assert.equal(rollback.operation, "DISASSOCIATE_EXACT_MESSAGE_ASSET");
  assert.equal(rollback.assetResourceName, "customers/4801404246/assets/999");
  assert.equal(rollback.preserveAssetHistory, true);
  assert.equal(rollback.preserveReportingHistory, true);
  assert.equal(rollback.mutateCanonicalHy, false);
  assert.equal(rollback.mutateBudget, false);
  assert.equal(rollback.mutateKeywords, false);
});
