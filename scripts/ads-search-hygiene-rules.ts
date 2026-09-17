export type SearchHygieneAction =
  | "NEGATIVE_EXACT"
  | "REVIEW_NAVIGATION"
  | "KEEP_REVIEW"
  | "KEEP";

export interface SearchHygieneDecision {
  normalizedTerm: string;
  action: SearchHygieneAction;
  tier: "A" | "B" | "C" | "NONE";
  reason: string;
  matchedBrand: string | null;
  matchedToken: string | null;
  recommendedMatchType: "EXACT" | null;
}

export type CampaignIntent =
  | "REPAIR"
  | "CLEANING"
  | "INSTALLATION"
  | "COMMERCIAL"
  | "UNKNOWN";

export const OBSERVED_BRAND_TOKENS = [
  "大金",
  "日立",
  "東元",
  "萬士益",
  "禾聯",
  "聲寶",
  "panasonic",
  "國際牌",
] as const;

const BRAND_NAVIGATION_TOKENS = [
  "客服電話",
  "維修電話",
  "服務中心",
  "維修中心",
  "服務據點",
  "服務站",
  "官方",
  "官網",
  "客服",
  "原廠",
] as const;

const CLEAR_NON_SERVICE_TOKENS = [
  "diy",
  "教學",
  "課程",
  "徵才",
  "薪水",
  "職缺",
  "說明書",
  "型錄",
  "零件",
  "材料",
  "自己修",
  "自己洗",
] as const;

const COMMERCIAL_RESEARCH_TOKENS = ["價格", "費用", "多少錢", "推薦", "評價"] as const;

const REPAIR_INTENT_TOKENS = [
  "維修",
  "修理",
  "故障",
  "不冷",
  "漏水",
  "滴水",
  "跳電",
  "異音",
  "不啟動",
  "漏冷媒",
] as const;

const CLEANING_INTENT_TOKENS = [
  "冷氣清洗",
  "清洗冷氣",
  "洗冷氣",
  "冷氣保養",
  "清潔冷氣",
] as const;

const INSTALLATION_INTENT_TOKENS = [
  "冷氣安裝",
  "安裝冷氣",
  "新裝冷氣",
  "裝冷氣",
  "冷氣新裝",
] as const;

const RESIDENTIAL_INTENT_TOKENS = [
  "家用冷氣",
  "住家冷氣",
  "住宅冷氣",
  "房間冷氣",
  "套房冷氣",
] as const;

const firstIncluded = (value: string, tokens: readonly string[]): string | null =>
  tokens.find((token) => value.includes(token)) ?? null;

export const normalizeSearchTerm = (term: string): string =>
  term.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

export const classifySearchTerm = (term: string): SearchHygieneDecision => {
  const normalizedTerm = normalizeSearchTerm(term);
  const matchedBrand = firstIncluded(normalizedTerm, OBSERVED_BRAND_TOKENS);
  const navigationToken = firstIncluded(normalizedTerm, BRAND_NAVIGATION_TOKENS);
  const nonServiceToken = firstIncluded(normalizedTerm, CLEAR_NON_SERVICE_TOKENS);
  const researchToken = firstIncluded(normalizedTerm, COMMERCIAL_RESEARCH_TOKENS);

  if (!normalizedTerm) {
    return {
      normalizedTerm,
      action: "KEEP_REVIEW",
      tier: "NONE",
      reason: "EMPTY_OR_INVALID_TERM",
      matchedBrand: null,
      matchedToken: null,
      recommendedMatchType: null,
    };
  }

  if (matchedBrand && navigationToken) {
    return {
      normalizedTerm,
      action: "NEGATIVE_EXACT",
      tier: "A",
      reason: "BRAND_BOUND_NAVIGATIONAL_INTENT",
      matchedBrand,
      matchedToken: navigationToken,
      recommendedMatchType: "EXACT",
    };
  }

  if (nonServiceToken) {
    return {
      normalizedTerm,
      action: "NEGATIVE_EXACT",
      tier: "B",
      reason: "CLEAR_NON_SERVICE_INTENT",
      matchedBrand,
      matchedToken: nonServiceToken,
      recommendedMatchType: "EXACT",
    };
  }

  if (navigationToken) {
    return {
      normalizedTerm,
      action: "REVIEW_NAVIGATION",
      tier: "A",
      reason: "NAVIGATIONAL_SIGNAL_WITHOUT_BRAND_BOUNDARY",
      matchedBrand: null,
      matchedToken: navigationToken,
      recommendedMatchType: null,
    };
  }

  if (researchToken) {
    return {
      normalizedTerm,
      action: "KEEP_REVIEW",
      tier: "C",
      reason: "COMMERCIAL_RESEARCH_INTENT_MAY_CONVERT",
      matchedBrand,
      matchedToken: researchToken,
      recommendedMatchType: null,
    };
  }

  return {
    normalizedTerm,
    action: "KEEP",
    tier: "NONE",
    reason: "NO_HIGH_CONFIDENCE_EXCLUSION_SIGNAL",
    matchedBrand,
    matchedToken: null,
    recommendedMatchType: null,
  };
};

export const inferCampaignIntent = (campaignName: string): CampaignIntent => {
  const normalized = normalizeSearchTerm(campaignName);
  if (normalized.includes("冷氣維修")) return "REPAIR";
  if (normalized.includes("冷氣清洗") || normalized.includes("清洗保養")) return "CLEANING";
  if (normalized.includes("冷氣安裝")) return "INSTALLATION";
  if (normalized.includes("商用")) return "COMMERCIAL";
  return "UNKNOWN";
};

const exactCrossCampaignDecision = (
  base: SearchHygieneDecision,
  reason: string,
  token: string
): SearchHygieneDecision => ({
  ...base,
  action: "NEGATIVE_EXACT",
  tier: "B",
  reason,
  matchedToken: token,
  recommendedMatchType: "EXACT",
});

const crossCampaignReviewDecision = (
  base: SearchHygieneDecision,
  reason: string,
  token: string | null
): SearchHygieneDecision => ({
  ...base,
  action: "KEEP_REVIEW",
  tier: base.tier === "A" ? "A" : "C",
  reason,
  matchedToken: token,
  recommendedMatchType: null,
});

export const classifySearchTermForCampaign = (
  campaignName: string,
  term: string
): SearchHygieneDecision => {
  const base = classifySearchTerm(term);

  // Global high-confidence exclusions remain valid regardless of campaign routing.
  if (base.action === "NEGATIVE_EXACT") return base;

  const campaignIntent = inferCampaignIntent(campaignName);
  if (campaignIntent === "UNKNOWN") return base;

  const value = base.normalizedTerm;
  const repairToken = firstIncluded(value, REPAIR_INTENT_TOKENS);
  const cleaningToken = firstIncluded(value, CLEANING_INTENT_TOKENS);
  const installationToken = firstIncluded(value, INSTALLATION_INTENT_TOKENS);
  const residentialToken = firstIncluded(value, RESIDENTIAL_INTENT_TOKENS);
  const serviceIntentCount = [repairToken, cleaningToken, installationToken].filter(Boolean).length;

  // Mixed service intent can be genuine replacement/diagnostic demand. Review it instead
  // of auto-excluding, even if one token would otherwise look cross-campaign.
  if (serviceIntentCount > 1) {
    return crossCampaignReviewDecision(
      base,
      "MULTI_SERVICE_INTENT_REVIEW",
      repairToken ?? cleaningToken ?? installationToken
    );
  }

  if (campaignIntent === "REPAIR") {
    if (cleaningToken) {
      return exactCrossCampaignDecision(base, "CROSS_CAMPAIGN_CLEANING_INTENT", cleaningToken);
    }
    if (installationToken) {
      return exactCrossCampaignDecision(base, "CROSS_CAMPAIGN_INSTALLATION_INTENT", installationToken);
    }
    return base;
  }

  if (campaignIntent === "CLEANING") {
    if (repairToken) {
      return exactCrossCampaignDecision(base, "CROSS_CAMPAIGN_REPAIR_INTENT", repairToken);
    }
    if (installationToken) {
      return exactCrossCampaignDecision(base, "CROSS_CAMPAIGN_INSTALLATION_INTENT", installationToken);
    }
    return base;
  }

  if (campaignIntent === "INSTALLATION") {
    if (repairToken) {
      return exactCrossCampaignDecision(base, "CROSS_CAMPAIGN_REPAIR_INTENT", repairToken);
    }
    if (cleaningToken) {
      return exactCrossCampaignDecision(base, "CROSS_CAMPAIGN_CLEANING_INTENT", cleaningToken);
    }
    return base;
  }

  if (campaignIntent === "COMMERCIAL" && residentialToken) {
    return exactCrossCampaignDecision(base, "CROSS_CAMPAIGN_RESIDENTIAL_INTENT", residentialToken);
  }

  return base;
};
