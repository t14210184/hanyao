import { createHash } from "node:crypto";
import type { SearchHygieneDecision } from "./ads-search-hygiene-rules.ts";

export const WP02_MUTATION_CONTRACT_VERSION = "hanyao-wp02-negative-exact-v1";
export const WP02_CUSTOMER_ID = "4801404246";
export const WP02_APPLY_GATE = "HANYAO_WP02_APPROVED_20260918";

export type Wp02ObservedCandidate = {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  searchTerm: string;
  searchTermStatus: string;
  clicks: number;
  costMicros: number;
  decision: SearchHygieneDecision;
};

export type Wp02ExistingNegative = {
  campaignId: string;
  adGroupId: string;
  resourceName: string;
  status: string;
  negative: boolean;
  text: string;
  matchType: string;
};

export type Wp02PlannedNegative = {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  text: string;
  reason: string;
  tier: string;
  clicks: number;
  costMicros: number;
};

const digits = (value: string): boolean => /^\d+$/.test(value);
const normalize = (value: string): string =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const keywordWordCount = (value: string): number =>
  normalize(value).split(" ").filter(Boolean).length;

const keyFor = (adGroupId: string, text: string): string =>
  adGroupId + "\u0000" + normalize(text);

export const assertSafeWp02Candidate = (
  row: Wp02ObservedCandidate
): Wp02PlannedNegative => {
  if (!digits(row.campaignId) || !digits(row.adGroupId)) {
    throw new Error("WP02_PROVIDER_ID_INVALID");
  }
  const text = normalize(row.searchTerm);
  if (!text || text.length > 80 || keywordWordCount(text) > 10) {
    throw new Error("WP02_KEYWORD_TEXT_OUT_OF_BOUNDS");
  }
  if (!Number.isFinite(row.clicks) || row.clicks <= 0) {
    throw new Error("WP02_SEARCH_TERM_HAS_NO_CLICK_EVIDENCE");
  }
  if (!Number.isFinite(row.costMicros) || row.costMicros < 0) {
    throw new Error("WP02_SEARCH_TERM_COST_INVALID");
  }
  if (
    row.decision.action !== "NEGATIVE_EXACT" ||
    row.decision.recommendedMatchType !== "EXACT" ||
    !["A", "B"].includes(row.decision.tier)
  ) {
    throw new Error("WP02_CLASSIFICATION_NOT_MUTATION_ELIGIBLE");
  }
  if (normalize(row.decision.normalizedTerm) !== text) {
    throw new Error("WP02_CLASSIFICATION_TERM_MISMATCH");
  }
  if (row.searchTermStatus.includes("EXCLUDED")) {
    throw new Error("WP02_SEARCH_TERM_ALREADY_EXCLUDED");
  }

  return {
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    adGroupId: row.adGroupId,
    adGroupName: row.adGroupName,
    text,
    reason: row.decision.reason,
    tier: row.decision.tier,
    clicks: row.clicks,
    costMicros: row.costMicros,
  };
};

export const buildWp02Plan = (
  observed: readonly Wp02ObservedCandidate[],
  existing: readonly Wp02ExistingNegative[]
): Wp02PlannedNegative[] => {
  const existingKeys = new Set(
    existing
      .filter(
        (item) =>
          item.negative === true &&
          item.status !== "REMOVED" &&
          item.matchType === "EXACT" &&
          digits(item.adGroupId)
      )
      .map((item) => keyFor(item.adGroupId, item.text))
  );

  const planned = new Map<string, Wp02PlannedNegative>();
  for (const row of observed) {
    let item: Wp02PlannedNegative;
    try {
      item = assertSafeWp02Candidate(row);
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "WP02_CLASSIFICATION_NOT_MUTATION_ELIGIBLE",
          "WP02_SEARCH_TERM_ALREADY_EXCLUDED",
          "WP02_SEARCH_TERM_HAS_NO_CLICK_EVIDENCE",
        ].includes(error.message)
      ) {
        continue;
      }
      throw error;
    }
    const key = keyFor(item.adGroupId, item.text);
    if (existingKeys.has(key)) continue;

    const current = planned.get(key);
    if (!current) {
      planned.set(key, item);
      continue;
    }
    // The same search term can appear in multiple daily/segment rows. Collapse
    // within the same ad group while preserving total evidence.
    current.clicks += item.clicks;
    current.costMicros += item.costMicros;
  }

  return [...planned.values()].sort((a, b) => {
    if (a.campaignId !== b.campaignId) return a.campaignId.localeCompare(b.campaignId);
    if (a.adGroupId !== b.adGroupId) return a.adGroupId.localeCompare(b.adGroupId);
    return a.text.localeCompare(b.text);
  });
};

export const buildWp02MutateOperations = (
  plan: readonly Wp02PlannedNegative[]
): Array<Record<string, unknown>> =>
  plan.map((item) => ({
    create: {
      adGroup: `customers/${WP02_CUSTOMER_ID}/adGroups/${item.adGroupId}`,
      status: "ENABLED",
      negative: true,
      keyword: {
        text: item.text,
        matchType: "EXACT",
      },
    },
  }));

const canonicalPlan = (plan: readonly Wp02PlannedNegative[]) =>
  plan.map((item) => ({
    campaignId: item.campaignId,
    adGroupId: item.adGroupId,
    text: item.text,
    reason: item.reason,
    tier: item.tier,
  }));

export const hashWp02Plan = (plan: readonly Wp02PlannedNegative[]): string =>
  createHash("sha256")
    .update(JSON.stringify(canonicalPlan(plan)))
    .digest("hex");

export const summarizeWp02Plan = (plan: readonly Wp02PlannedNegative[]) => ({
  candidateRows: plan.length,
  candidateClicks: plan.reduce((sum, item) => sum + item.clicks, 0),
  candidateCostMicros: plan.reduce((sum, item) => sum + item.costMicros, 0),
  campaignCount: new Set(plan.map((item) => item.campaignId)).size,
  adGroupCount: new Set(plan.map((item) => item.adGroupId)).size,
  planHash: hashWp02Plan(plan),
});

export const buildWp02MutateBody = (
  plan: readonly Wp02PlannedNegative[],
  validateOnly: boolean
) => ({
  operations: buildWp02MutateOperations(plan),
  partialFailure: false,
  validateOnly,
  responseContentType: "RESOURCE_NAME_ONLY",
});

export const readbackCoverage = (
  plan: readonly Wp02PlannedNegative[],
  existingAfter: readonly Wp02ExistingNegative[]
) => {
  const readbackKeys = new Set(
    existingAfter
      .filter(
        (item) =>
          item.negative === true &&
          item.status !== "REMOVED" &&
          item.matchType === "EXACT"
      )
      .map((item) => keyFor(item.adGroupId, item.text))
  );
  const confirmed = plan.filter((item) =>
    readbackKeys.has(keyFor(item.adGroupId, item.text))
  );
  return {
    expected: plan.length,
    confirmed: confirmed.length,
    complete: confirmed.length === plan.length,
    noneApplied: confirmed.length === 0,
  };
};

export const assertWp02ApplyGate = (
  gate: string | undefined,
  expectedPlanHash: string | undefined,
  actualPlanHash: string
): void => {
  if (gate !== WP02_APPLY_GATE) throw new Error("WP02_PRODUCTION_GATE_REQUIRED");
  if (!expectedPlanHash || expectedPlanHash !== actualPlanHash) {
    throw new Error("WP02_PLAN_HASH_MISMATCH");
  }
};
