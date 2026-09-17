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
