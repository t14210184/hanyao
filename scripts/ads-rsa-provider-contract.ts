import { createHash } from "node:crypto";
import { RSA_CANDIDATES, type RsaCampaignCandidate } from "./ads-rsa-candidates.ts";

export const WP03_RSA_CONTRACT_VERSION = "hanyao-wp03-rsa-provider-v1";
export const WP03_CUSTOMER_ID = "4801404246";
export const WP03_CREATE_GATE = "HANYAO_WP03_PAUSED_CREATE_APPROVED_20260918";
export const WP03_ENABLE_GATE = "HANYAO_WP03_ENABLE_APPROVED_20260918";
export const WP03_ORIGIN = "https://www.xusen.pro";

export type Wp03Campaign = {
  id: string;
  name: string;
  status: string;
};

export type Wp03AdGroup = {
  campaignId: string;
  campaignName: string;
  id: string;
  name: string;
  status: string;
};

export type Wp03RsaAd = {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  resourceName: string;
  adId: string;
  status: string;
  adStrength: string;
  actionItems: string[];
  approvalStatus: string;
  reviewStatus: string;
  primaryStatus: string;
  finalUrls: string[];
  headlines: string[];
  descriptions: string[];
};

export type Wp03TargetManifestRow = {
  campaignName: RsaCampaignCandidate["campaign"];
  adGroupId: string;
};

export type Wp03Target = {
  campaignId: string;
  campaignName: RsaCampaignCandidate["campaign"];
  adGroupId: string;
  adGroupName: string;
};

export type Wp03CreatePlanRow = Wp03Target & {
  variantId: "A" | "B";
  finalUrl: string;
  headlines: string[];
  descriptions: string[];
};

export type Wp03EnablePlanRow = Wp03CreatePlanRow & {
  resourceName: string;
  adId: string;
  currentStatus: string;
  adStrength: string;
  approvalStatus: string;
};

const digits = (value: string): boolean => /^\d+$/.test(value);

const campaignCandidate = (
  name: string
): RsaCampaignCandidate | null =>
  RSA_CANDIDATES.find((item) => item.campaign === name) ?? null;

export const expectedFinalUrl = (candidate: RsaCampaignCandidate): string =>
  new URL(candidate.landingPath, WP03_ORIGIN).toString();

const normalizeUrl = (value: string): string => {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
};

const normalizeStrings = (values: readonly string[]): string[] =>
  values.map((value) => value.normalize("NFKC").trim());

const exactCopyKey = ({
  adGroupId,
  finalUrl,
  headlines,
  descriptions,
}: {
  adGroupId: string;
  finalUrl: string;
  headlines: readonly string[];
  descriptions: readonly string[];
}): string =>
  JSON.stringify({
    adGroupId,
    finalUrl: normalizeUrl(finalUrl),
    headlines: normalizeStrings(headlines),
    descriptions: normalizeStrings(descriptions),
  });

export const parseWp03TargetManifest = (
  serialized: string | undefined
): Wp03TargetManifestRow[] | null => {
  if (!serialized?.trim()) return null;
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("WP03_TARGET_MANIFEST_JSON_INVALID");
  }
  if (!Array.isArray(value)) throw new Error("WP03_TARGET_MANIFEST_NOT_ARRAY");
  const rows: Wp03TargetManifestRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("WP03_TARGET_MANIFEST_ROW_INVALID");
    }
    const record = item as Record<string, unknown>;
    const campaignName =
      typeof record.campaignName === "string" ? record.campaignName : "";
    const adGroupId =
      typeof record.adGroupId === "string" ? record.adGroupId : "";
    if (!campaignCandidate(campaignName) || !digits(adGroupId)) {
      throw new Error("WP03_TARGET_MANIFEST_ROW_INVALID");
    }
    rows.push({
      campaignName: campaignName as Wp03TargetManifestRow["campaignName"],
      adGroupId,
    });
  }
  const keys = rows.map((row) => row.campaignName + "\u0000" + row.adGroupId);
  if (new Set(keys).size !== keys.length) {
    throw new Error("WP03_TARGET_MANIFEST_DUPLICATE");
  }
  return rows;
};

export const resolveWp03Targets = (
  campaigns: readonly Wp03Campaign[],
  adGroups: readonly Wp03AdGroup[],
  manifest: readonly Wp03TargetManifestRow[] | null
): Wp03Target[] => {
  const expectedCampaignNames = RSA_CANDIDATES.map((item) => item.campaign);
  const campaignByName = new Map<string, Wp03Campaign[]>();
  for (const name of expectedCampaignNames) campaignByName.set(name, []);
  for (const campaign of campaigns) {
    if (!campaignCandidate(campaign.name)) continue;
    if (!digits(campaign.id) || campaign.status !== "ENABLED") continue;
    campaignByName.get(campaign.name)!.push(campaign);
  }
  for (const name of expectedCampaignNames) {
    const matches = campaignByName.get(name) ?? [];
    if (matches.length !== 1) {
      throw new Error("WP03_CAMPAIGN_IDENTITY_COUNT_" + name + "_" + matches.length);
    }
  }

  const enabledAdGroups = adGroups.filter(
    (item) =>
      digits(item.id) &&
      item.status === "ENABLED" &&
      campaignCandidate(item.campaignName) !== null
  );

  if (manifest) {
    const targets: Wp03Target[] = manifest.map((row) => {
      const matches = enabledAdGroups.filter(
        (item) =>
          item.campaignName === row.campaignName && item.id === row.adGroupId
      );
      if (matches.length !== 1) {
        throw new Error(
          "WP03_TARGET_AD_GROUP_COUNT_" +
            row.campaignName +
            "_" +
            row.adGroupId +
            "_" +
            matches.length
        );
      }
      const item = matches[0];
      const campaign = campaignByName.get(row.campaignName)![0];
      if (item.campaignId !== campaign.id) {
        throw new Error("WP03_TARGET_CAMPAIGN_ID_MISMATCH");
      }
      return {
        campaignId: campaign.id,
        campaignName: row.campaignName,
        adGroupId: item.id,
        adGroupName: item.name,
      };
    });
    if (targets.length === 0) throw new Error("WP03_TARGET_MANIFEST_EMPTY");
    return targets;
  }

  const targets: Wp03Target[] = [];
  for (const name of expectedCampaignNames) {
    const campaign = campaignByName.get(name)![0];
    const groups = enabledAdGroups.filter(
      (item) => item.campaignId === campaign.id && item.campaignName === name
    );
    if (groups.length !== 1) {
      throw new Error(
        "WP03_AUTOMATIC_TARGET_REQUIRES_ONE_ENABLED_AD_GROUP_" +
          name +
          "_" +
          groups.length
      );
    }
    targets.push({
      campaignId: campaign.id,
      campaignName: name,
      adGroupId: groups[0].id,
      adGroupName: groups[0].name,
    });
  }
  return targets;
};

const candidateVariant = (
  campaignName: RsaCampaignCandidate["campaign"],
  variantId: "A" | "B"
) => {
  const candidate = RSA_CANDIDATES.find(
    (item) => item.campaign === campaignName
  );
  if (!candidate) throw new Error("WP03_CANDIDATE_NOT_FOUND");
  const variant = candidate.variants.find((item) => item.id === variantId);
  if (!variant) throw new Error("WP03_VARIANT_NOT_FOUND");
  return { candidate, variant };
};

const validateCurrentLandingUrls = (
  target: Wp03Target,
  inventory: readonly Wp03RsaAd[],
  expected: string
): void => {
  const active = inventory.filter(
    (ad) =>
      ad.adGroupId === target.adGroupId &&
      ad.status === "ENABLED" &&
      ad.finalUrls.length > 0
  );
  const distinct = new Set(
    active.flatMap((ad) => ad.finalUrls.map((url) => normalizeUrl(url)))
  );
  if (distinct.size === 0) return;
  if (distinct.size !== 1 || !distinct.has(normalizeUrl(expected))) {
    throw new Error(
      "WP03_EXISTING_RSA_FINAL_URL_DRIFT_" +
        target.campaignName +
        "_" +
        target.adGroupId
    );
  }
};

const exactInventoryMatches = (
  row: Wp03CreatePlanRow,
  inventory: readonly Wp03RsaAd[]
): Wp03RsaAd[] => {
  const wanted = exactCopyKey(row);
  return inventory.filter((ad) => {
    if (ad.adGroupId !== row.adGroupId || ad.finalUrls.length !== 1) return false;
    return (
      exactCopyKey({
        adGroupId: ad.adGroupId,
        finalUrl: ad.finalUrls[0],
        headlines: ad.headlines,
        descriptions: ad.descriptions,
      }) === wanted
    );
  });
};

export const buildWp03CreatePlan = (
  targets: readonly Wp03Target[],
  inventory: readonly Wp03RsaAd[]
): Wp03CreatePlanRow[] => {
  const plan: Wp03CreatePlanRow[] = [];
  for (const target of targets) {
    const candidate = campaignCandidate(target.campaignName);
    if (!candidate) throw new Error("WP03_TARGET_CAMPAIGN_NOT_SUPPORTED");
    const finalUrl = expectedFinalUrl(candidate);
    validateCurrentLandingUrls(target, inventory, finalUrl);

    for (const variant of candidate.variants) {
      const row: Wp03CreatePlanRow = {
        ...target,
        variantId: variant.id,
        finalUrl,
        headlines: [...variant.headlines],
        descriptions: [...variant.descriptions],
      };
      const matches = exactInventoryMatches(row, inventory);
      if (matches.length > 1) {
        throw new Error(
          "WP03_DUPLICATE_EXACT_RSA_" +
            target.adGroupId +
            "_" +
            variant.id
        );
      }
      if (matches.length === 0) plan.push(row);
    }
  }
  return plan;
};

export const buildWp03CreateMutateBody = (
  plan: readonly Wp03CreatePlanRow[],
  validateOnly: boolean
) => ({
  operations: plan.map((row) => ({
    create: {
      adGroup: `customers/${WP03_CUSTOMER_ID}/adGroups/${row.adGroupId}`,
      status: "PAUSED",
      ad: {
        finalUrls: [row.finalUrl],
        responsiveSearchAd: {
          headlines: row.headlines.map((text) => ({ text })),
          descriptions: row.descriptions.map((text) => ({ text })),
        },
      },
    },
  })),
  partialFailure: false,
  validateOnly,
  responseContentType: "RESOURCE_NAME_ONLY",
});

const canonicalCreatePlan = (plan: readonly Wp03CreatePlanRow[]) =>
  plan.map((row) => ({
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    adGroupId: row.adGroupId,
    variantId: row.variantId,
    finalUrl: normalizeUrl(row.finalUrl),
    headlines: normalizeStrings(row.headlines),
    descriptions: normalizeStrings(row.descriptions),
  }));

export const hashWp03CreatePlan = (
  plan: readonly Wp03CreatePlanRow[]
): string =>
  createHash("sha256")
    .update(JSON.stringify(canonicalCreatePlan(plan)))
    .digest("hex");

export const createReadbackCoverage = (
  plan: readonly Wp03CreatePlanRow[],
  inventory: readonly Wp03RsaAd[]
) => {
  let confirmed = 0;
  for (const row of plan) {
    const matches = exactInventoryMatches(row, inventory);
    if (matches.length > 1) {
      throw new Error(
        "WP03_CREATE_READBACK_DUPLICATE_" +
          row.adGroupId +
          "_" +
          row.variantId
      );
    }
    if (matches.length === 1 && ["PAUSED", "ENABLED"].includes(matches[0].status)) {
      confirmed += 1;
    }
  }
  return {
    expected: plan.length,
    confirmed,
    complete: confirmed === plan.length,
    noneApplied: confirmed === 0,
  };
};

export const buildWp03EnablePlan = (
  targets: readonly Wp03Target[],
  inventory: readonly Wp03RsaAd[]
): Wp03EnablePlanRow[] => {
  const plan: Wp03EnablePlanRow[] = [];
  for (const target of targets) {
    for (const variantId of ["A", "B"] as const) {
      const { candidate, variant } = candidateVariant(target.campaignName, variantId);
      const row: Wp03CreatePlanRow = {
        ...target,
        variantId,
        finalUrl: expectedFinalUrl(candidate),
        headlines: [...variant.headlines],
        descriptions: [...variant.descriptions],
      };
      const matches = exactInventoryMatches(row, inventory);
      if (matches.length !== 1) {
        throw new Error(
          "WP03_ENABLE_EXACT_RSA_COUNT_" +
            target.adGroupId +
            "_" +
            variantId +
            "_" +
            matches.length
        );
      }
      const ad = matches[0];
      if (!digits(ad.adId) || !ad.resourceName) {
        throw new Error("WP03_ENABLE_RSA_IDENTITY_INCOMPLETE");
      }
      if (!["GOOD", "EXCELLENT"].includes(ad.adStrength)) {
        throw new Error(
          "WP03_ENABLE_AD_STRENGTH_BLOCKED_" +
            target.adGroupId +
            "_" +
            variantId +
            "_" +
            ad.adStrength
        );
      }
      if (ad.approvalStatus !== "APPROVED") {
        throw new Error(
          "WP03_ENABLE_POLICY_BLOCKED_" +
            target.adGroupId +
            "_" +
            variantId +
            "_" +
            ad.approvalStatus
        );
      }
      if (!["PAUSED", "ENABLED"].includes(ad.status)) {
        throw new Error("WP03_ENABLE_STATUS_INVALID_" + ad.status);
      }
      if (ad.status === "PAUSED") {
        plan.push({
          ...row,
          resourceName: ad.resourceName,
          adId: ad.adId,
          currentStatus: ad.status,
          adStrength: ad.adStrength,
          approvalStatus: ad.approvalStatus,
        });
      }
    }
  }
  return plan;
};

export const buildWp03EnableMutateBody = (
  plan: readonly Wp03EnablePlanRow[],
  validateOnly: boolean
) => ({
  operations: plan.map((row) => ({
    update: {
      resourceName: row.resourceName,
      status: "ENABLED",
    },
    updateMask: "status",
  })),
  partialFailure: false,
  validateOnly,
  responseContentType: "RESOURCE_NAME_ONLY",
});

const canonicalEnablePlan = (plan: readonly Wp03EnablePlanRow[]) =>
  plan.map((row) => ({
    campaignId: row.campaignId,
    adGroupId: row.adGroupId,
    variantId: row.variantId,
    resourceName: row.resourceName,
    adStrength: row.adStrength,
    approvalStatus: row.approvalStatus,
  }));

export const hashWp03EnablePlan = (
  plan: readonly Wp03EnablePlanRow[]
): string =>
  createHash("sha256")
    .update(JSON.stringify(canonicalEnablePlan(plan)))
    .digest("hex");

export const enableReadbackCoverage = (
  plan: readonly Wp03EnablePlanRow[],
  inventory: readonly Wp03RsaAd[]
) => {
  const byResource = new Map(inventory.map((ad) => [ad.resourceName, ad]));
  let confirmed = 0;
  for (const row of plan) {
    const ad = byResource.get(row.resourceName);
    if (
      ad &&
      ad.status === "ENABLED" &&
      ["GOOD", "EXCELLENT"].includes(ad.adStrength) &&
      ad.approvalStatus === "APPROVED"
    ) {
      confirmed += 1;
    }
  }
  return {
    expected: plan.length,
    confirmed,
    complete: confirmed === plan.length,
    noneApplied: confirmed === 0,
  };
};

export const assertWp03Gate = (
  actualGate: string | undefined,
  expectedGate: string,
  expectedPlanHash: string | undefined,
  actualPlanHash: string
): void => {
  if (actualGate !== expectedGate) throw new Error("WP03_PRODUCTION_GATE_REQUIRED");
  if (!expectedPlanHash || expectedPlanHash !== actualPlanHash) {
    throw new Error("WP03_PLAN_HASH_MISMATCH");
  }
};
