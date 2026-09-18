import { createHash } from "node:crypto";
import { MESSAGE_PILOT } from "./ads-line-message-pilot.ts";

export const WP05_UI_CONTRACT_VERSION = "hanyao-wp05-line-ui-v1";
export const WP05_CUSTOMER_ID = "4801404246";
export const WP05_CAMPAIGN_NAME = "冷氣維修";
export const WP05_LINE_ID = "@451vpomq";
export const WP05_UI_DISPATCH_GATE = "HANYAO_WP05_LINE_UI_APPROVED_20260918";

export type Wp05CanonicalHySnapshot = {
  conversionActionId: string;
  name: string;
  primary: boolean;
  counting: string;
};

export type Wp05UiPrestate = {
  schemaVersion: 1;
  capturedAt: string;
  customerId: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  advertiserVerificationStatus: string;
  messageAssetBetaEligible: boolean;
  linePlatformFieldPresent: boolean;
  lineIdFieldPresent: boolean;
  linePlatformValue: string;
  lineIdValue: string;
  biddingStrategyType: string;
  optimizationSetFingerprint: string;
  nonMessageAssetAssociationFingerprint: string;
  canonicalHy: Wp05CanonicalHySnapshot;
  existingMessageAssetResourceNames: string[];
};

export type Wp05UiPoststate = Wp05UiPrestate & {
  messageAsset: {
    resourceName: string;
    platform: string;
    lineId: string;
    starterMessage: string;
    associationScope: "CAMPAIGN";
    associationCampaignId: string;
    associationStatus: string;
    approvalStatus: string;
    verificationStatus: string;
  };
};

export type Wp05PrestateVerdict =
  | {
      status: "WP05_UI_PRESTATE_READY";
      prestateHash: string;
      frozenHash: string;
    }
  | {
      status: "WP05_UI_PRESTATE_BLOCKED";
      blockers: string[];
    };

export type Wp05PoststateVerdict =
  | {
      status: "WP05_MESSAGE_ASSET_ACTIVE_PASS";
      assetResourceName: string;
      prestateHash: string;
      poststateHash: string;
    }
  | {
      status: "WP05_MESSAGE_ASSET_SAVED_PENDING_REVIEW";
      assetResourceName: string;
      prestateHash: string;
      poststateHash: string;
      pending: string[];
    }
  | {
      status: "WP05_MESSAGE_ASSET_BLOCKED";
      blockers: string[];
    };

const isoTimestamp = (value: string): number => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("WP05_CAPTURE_TIME_INVALID");
  return parsed;
};

const nonEmpty = (value: string): boolean => value.trim().length > 0;
const digits = (value: string): boolean => /^\d+$/.test(value);

const canonicalJson = (value: unknown): string => JSON.stringify(value);

const sha256 = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();

const canonicalHySnapshot = (value: Wp05CanonicalHySnapshot) => ({
  conversionActionId: value.conversionActionId,
  name: value.name,
  primary: value.primary,
  counting: value.counting,
});

export const frozenWp05UiSnapshot = (value: Wp05UiPrestate) => ({
  customerId: value.customerId,
  campaignId: value.campaignId,
  campaignName: value.campaignName,
  campaignStatus: value.campaignStatus,
  biddingStrategyType: value.biddingStrategyType,
  optimizationSetFingerprint: value.optimizationSetFingerprint,
  nonMessageAssetAssociationFingerprint:
    value.nonMessageAssetAssociationFingerprint,
  canonicalHy: canonicalHySnapshot(value.canonicalHy),
});

export const hashWp05FrozenUiSnapshot = (
  value: Wp05UiPrestate
): string => sha256(frozenWp05UiSnapshot(value));

export const hashWp05UiPrestate = (value: Wp05UiPrestate): string =>
  sha256({
    ...frozenWp05UiSnapshot(value),
    advertiserVerificationStatus: value.advertiserVerificationStatus,
    messageAssetBetaEligible: value.messageAssetBetaEligible,
    linePlatformFieldPresent: value.linePlatformFieldPresent,
    lineIdFieldPresent: value.lineIdFieldPresent,
    linePlatformValue: value.linePlatformValue,
    lineIdValue: value.lineIdValue,
    existingMessageAssetResourceNames: uniqueSorted(
      value.existingMessageAssetResourceNames
    ),
  });

export const hashWp05UiPoststate = (value: Wp05UiPoststate): string =>
  sha256({
    prestate: hashWp05UiPrestate(value),
    messageAsset: value.messageAsset,
  });

const validateCanonicalHy = (
  value: Wp05CanonicalHySnapshot,
  blockers: string[]
): void => {
  if (value.conversionActionId !== MESSAGE_PILOT.canonicalConversion.conversionActionId) {
    blockers.push("CANONICAL_HY_ACTION_ID_DRIFT");
  }
  if (value.name !== MESSAGE_PILOT.canonicalConversion.name) {
    blockers.push("CANONICAL_HY_NAME_DRIFT");
  }
  if (value.primary !== false) blockers.push("CANONICAL_HY_PRIMARY_DRIFT");
  if (value.counting !== "MANY_PER_CLICK") {
    blockers.push("CANONICAL_HY_COUNTING_DRIFT");
  }
};

const validateCommonIdentity = (
  value: Wp05UiPrestate,
  blockers: string[]
): void => {
  if (value.schemaVersion !== 1) blockers.push("SCHEMA_VERSION_INVALID");
  if (value.customerId !== WP05_CUSTOMER_ID) blockers.push("CUSTOMER_ID_MISMATCH");
  if (!digits(value.campaignId)) blockers.push("CAMPAIGN_ID_INVALID");
  if (value.campaignName !== WP05_CAMPAIGN_NAME) {
    blockers.push("CAMPAIGN_NAME_MISMATCH");
  }
  if (value.campaignStatus !== "ENABLED") {
    blockers.push("CAMPAIGN_NOT_ENABLED");
  }
  if (!nonEmpty(value.biddingStrategyType)) {
    blockers.push("BIDDING_STRATEGY_MISSING");
  }
  if (!nonEmpty(value.optimizationSetFingerprint)) {
    blockers.push("OPTIMIZATION_SET_FINGERPRINT_MISSING");
  }
  if (!nonEmpty(value.nonMessageAssetAssociationFingerprint)) {
    blockers.push("NON_MESSAGE_ASSET_ASSOCIATION_FINGERPRINT_MISSING");
  }
  validateCanonicalHy(value.canonicalHy, blockers);
};

export const evaluateWp05UiPrestate = (
  value: Wp05UiPrestate,
  now = new Date(),
  maxAgeMinutes = 30
): Wp05PrestateVerdict => {
  const blockers: string[] = [];
  validateCommonIdentity(value, blockers);

  let capturedAt = 0;
  try {
    capturedAt = isoTimestamp(value.capturedAt);
  } catch {
    blockers.push("CAPTURE_TIME_INVALID");
  }
  const ageMs = now.getTime() - capturedAt;
  if (capturedAt > 0 && (ageMs < 0 || ageMs > maxAgeMinutes * 60_000)) {
    blockers.push("PRESTATE_NOT_FRESH");
  }

  const verifiedStatuses = new Set([
    "VERIFIED",
    "VERIFICATION_COMPLETE",
    "COMPLETED",
  ]);
  if (!verifiedStatuses.has(value.advertiserVerificationStatus)) {
    blockers.push("ADVERTISER_VERIFICATION_NOT_COMPLETE");
  }
  if (!value.messageAssetBetaEligible) {
    blockers.push("MESSAGE_ASSET_BETA_NOT_ELIGIBLE");
  }
  if (!value.linePlatformFieldPresent || !value.lineIdFieldPresent) {
    blockers.push("LINE_UI_FIELDS_NOT_PRESENT");
  }
  if (value.linePlatformValue.toLowerCase() !== "line") {
    blockers.push("LINE_PLATFORM_VALUE_MISMATCH");
  }
  if (value.lineIdValue !== WP05_LINE_ID) {
    blockers.push("LINE_ID_MISMATCH");
  }

  if (blockers.length > 0) {
    return { status: "WP05_UI_PRESTATE_BLOCKED", blockers };
  }
  return {
    status: "WP05_UI_PRESTATE_READY",
    prestateHash: hashWp05UiPrestate(value),
    frozenHash: hashWp05FrozenUiSnapshot(value),
  };
};

const starterAllowed = (value: string): boolean =>
  MESSAGE_PILOT.starterMessageCandidates.includes(
    value as (typeof MESSAGE_PILOT.starterMessageCandidates)[number]
  );

const frozenDriftBlockers = (
  before: Wp05UiPrestate,
  after: Wp05UiPoststate
): string[] => {
  const blockers: string[] = [];
  if (before.customerId !== after.customerId) blockers.push("CUSTOMER_ID_DRIFT");
  if (before.campaignId !== after.campaignId) blockers.push("CAMPAIGN_ID_DRIFT");
  if (before.campaignName !== after.campaignName) blockers.push("CAMPAIGN_NAME_DRIFT");
  if (before.campaignStatus !== after.campaignStatus) {
    blockers.push("CAMPAIGN_STATUS_DRIFT");
  }
  if (before.biddingStrategyType !== after.biddingStrategyType) {
    blockers.push("BIDDING_STRATEGY_DRIFT");
  }
  if (
    before.optimizationSetFingerprint !== after.optimizationSetFingerprint
  ) {
    blockers.push("OPTIMIZATION_SET_DRIFT");
  }
  if (
    before.nonMessageAssetAssociationFingerprint !==
    after.nonMessageAssetAssociationFingerprint
  ) {
    blockers.push("CALL_OR_LEAD_FORM_ASSOCIATION_DRIFT");
  }
  if (
    canonicalJson(canonicalHySnapshot(before.canonicalHy)) !==
    canonicalJson(canonicalHySnapshot(after.canonicalHy))
  ) {
    blockers.push("CANONICAL_HY_DRIFT");
  }
  return blockers;
};

export const evaluateWp05UiPoststate = (
  before: Wp05UiPrestate,
  after: Wp05UiPoststate,
  now = new Date(),
  maxAgeMinutes = 30
): Wp05PoststateVerdict => {
  const pre = evaluateWp05UiPrestate(before, now, maxAgeMinutes);
  if (pre.status !== "WP05_UI_PRESTATE_READY") {
    return {
      status: "WP05_MESSAGE_ASSET_BLOCKED",
      blockers: ["PRESTATE_NOT_READY", ...pre.blockers],
    };
  }

  const blockers = frozenDriftBlockers(before, after);
  validateCommonIdentity(after, blockers);

  let afterCapturedAt = 0;
  try {
    afterCapturedAt = isoTimestamp(after.capturedAt);
  } catch {
    blockers.push("POSTSTATE_CAPTURE_TIME_INVALID");
  }
  const ageMs = now.getTime() - afterCapturedAt;
  if (
    afterCapturedAt > 0 &&
    (ageMs < 0 || ageMs > maxAgeMinutes * 60_000)
  ) {
    blockers.push("POSTSTATE_NOT_FRESH");
  }
  if (afterCapturedAt > 0 && afterCapturedAt < isoTimestamp(before.capturedAt)) {
    blockers.push("POSTSTATE_PRECEDES_PRESTATE");
  }

  const asset = after.messageAsset;
  if (!nonEmpty(asset.resourceName)) blockers.push("MESSAGE_ASSET_IDENTITY_MISSING");
  if (asset.platform.toLowerCase() !== "line") {
    blockers.push("MESSAGE_ASSET_PLATFORM_MISMATCH");
  }
  if (asset.lineId !== WP05_LINE_ID) blockers.push("MESSAGE_ASSET_LINE_ID_MISMATCH");
  if (!starterAllowed(asset.starterMessage)) {
    blockers.push("STARTER_MESSAGE_NOT_APPROVED_CANDIDATE");
  }
  if (asset.associationScope !== "CAMPAIGN") {
    blockers.push("MESSAGE_ASSET_SCOPE_NOT_CAMPAIGN");
  }
  if (asset.associationCampaignId !== before.campaignId) {
    blockers.push("MESSAGE_ASSET_CAMPAIGN_MISMATCH");
  }
  if (!["ENABLED", "ACTIVE"].includes(asset.associationStatus)) {
    blockers.push("MESSAGE_ASSET_ASSOCIATION_NOT_ENABLED");
  }

  if (blockers.length > 0) {
    return { status: "WP05_MESSAGE_ASSET_BLOCKED", blockers };
  }

  const pending: string[] = [];
  if (!["APPROVED"].includes(asset.approvalStatus)) {
    if (["PENDING", "UNDER_REVIEW", "REVIEW_IN_PROGRESS"].includes(asset.approvalStatus)) {
      pending.push("POLICY_APPROVAL_PENDING");
    } else {
      return {
        status: "WP05_MESSAGE_ASSET_BLOCKED",
        blockers: ["MESSAGE_ASSET_POLICY_NOT_APPROVED"],
      };
    }
  }
  if (!["VERIFIED", "VERIFICATION_COMPLETE", "COMPLETED"].includes(asset.verificationStatus)) {
    if (
      ["PENDING", "UNDER_REVIEW", "REVIEW_IN_PROGRESS"].includes(
        asset.verificationStatus
      )
    ) {
      pending.push("MESSAGE_ASSET_VERIFICATION_PENDING");
    } else {
      return {
        status: "WP05_MESSAGE_ASSET_BLOCKED",
        blockers: ["MESSAGE_ASSET_VERIFICATION_FAILED_OR_UNKNOWN"],
      };
    }
  }

  const common = {
    assetResourceName: asset.resourceName,
    prestateHash: pre.prestateHash,
    poststateHash: hashWp05UiPoststate(after),
  };

  if (pending.length > 0) {
    return {
      status: "WP05_MESSAGE_ASSET_SAVED_PENDING_REVIEW",
      ...common,
      pending,
    };
  }

  return {
    status: "WP05_MESSAGE_ASSET_ACTIVE_PASS",
    ...common,
  };
};

export const assertWp05UiDispatchGate = (
  gate: string | undefined,
  expectedPrestateHash: string | undefined,
  actualPrestateHash: string
): void => {
  if (gate !== WP05_UI_DISPATCH_GATE) {
    throw new Error("WP05_UI_PRODUCTION_GATE_REQUIRED");
  }
  if (!expectedPrestateHash || expectedPrestateHash !== actualPrestateHash) {
    throw new Error("WP05_UI_PRESTATE_HASH_MISMATCH");
  }
};

export const buildWp05RollbackTarget = (after: Wp05UiPoststate) => {
  if (!nonEmpty(after.messageAsset.resourceName)) {
    throw new Error("WP05_ROLLBACK_ASSET_IDENTITY_MISSING");
  }
  return {
    operation: "DISASSOCIATE_EXACT_MESSAGE_ASSET",
    customerId: after.customerId,
    campaignId: after.campaignId,
    assetResourceName: after.messageAsset.resourceName,
    preserveAssetHistory: true,
    preserveReportingHistory: true,
    restoreBiddingStrategyType: after.biddingStrategyType,
    restoreOptimizationSetFingerprint: after.optimizationSetFingerprint,
    canonicalHyChangeAllowed: false,
    budgetChangeAllowed: false,
    keywordChangeAllowed: false,
  } as const;
};
