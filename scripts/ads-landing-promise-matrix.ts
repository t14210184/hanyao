export type AdsLandingPromiseLane = {
  campaign: "冷氣維修" | "冷氣清洗保養" | "冷氣安裝" | "商用工程";
  landingPath: string;
  sourceFile: string;
  userIntent: readonly string[];
  adPromise: readonly string[];
  landingFirstScreenAction: string;
  primaryProof: readonly string[];
  requiredHeroTokens: readonly string[];
  requiredPageTokens: readonly string[];
  requiredRsaTokens: readonly string[];
};

export const ADS_LANDING_PROMISE_MATRIX_VERSION = "hanyao-ads-landing-promise-v1";

/**
 * WP07 contract: one primary promise per Search campaign.
 *
 * This file is a repository-side alignment contract only. It contains no
 * Google Ads transport and performs no provider mutation.
 */
export const ADS_LANDING_PROMISE_MATRIX: readonly AdsLandingPromiseLane[] = [
  {
    campaign: "冷氣維修",
    landingPath: "/services/ac-repair/",
    sourceFile: "src/app/services/ac-repair/AcRepairServiceClient.tsx",
    userIntent: ["現在有故障", "不冷／滴水／漏水／異音／跳電"],
    adPromise: ["傳症狀／照片先判斷", "先判斷再報價"],
    landingFirstScreenAction: "傳照片／症狀快速諮詢",
    primaryProof: ["乙級冷凍空調裝修技術士", "先說明原因與報價"],
    requiredHeroTokens: [
      "冷氣不冷、滴水、漏水、異音或跳電",
      "傳照片／症狀快速諮詢",
      "先說明原因與報價",
    ],
    requiredPageTokens: ["乙級冷凍空調裝修技術士", "確認同意後再施工"],
    requiredRsaTokens: ["傳照片先初步判斷", "先判斷故障再報價"],
  },
  {
    campaign: "冷氣清洗保養",
    landingPath: "/services/ac-cleaning/",
    sourceFile: "src/app/services/ac-cleaning/AcCleaningServiceClient.tsx",
    userIntent: ["價格／霉味／風量", "清洗台數與機型"],
    adPromise: ["先確認機型台數", "依機型與髒污評估"],
    landingFirstScreenAction: "傳機型照片／台數先確認",
    primaryProof: ["清洗前先確認機況", "施工前後基本測試"],
    requiredHeroTokens: [
      "機型銘牌照片",
      "清洗台數",
      "所在地區",
      "傳機型照片／台數先確認",
      "清洗前先確認機況",
    ],
    requiredPageTokens: ["施工前後基本測試", "排水系統檢查"],
    requiredRsaTokens: ["傳機型照片先確認", "清洗台數先確認"],
  },
  {
    campaign: "冷氣安裝",
    landingPath: "/services/ac-installation/",
    sourceFile: "src/app/services/ac-installation/AcInstallationServiceClient.tsx",
    userIntent: ["費用／規劃", "新屋／舊換新／裝潢前"],
    adPromise: ["現場條件先估", "配管排水先確認"],
    landingFirstScreenAction: "LINE 傳照片諮詢",
    primaryProof: ["坪數與冷房能力", "配管排水與維修便利性"],
    requiredHeroTokens: [
      "坪數、冷房能力",
      "配管排水",
      "空間照片",
      "LINE 傳照片諮詢",
    ],
    requiredPageTokens: ["說明安裝方式與報價", "日後維修孔與保養動線"],
    requiredRsaTokens: ["傳現場照片先判斷", "配管排水逐項說明"],
  },
  {
    campaign: "商用工程",
    landingPath: "/services/commercial-ac/",
    sourceFile: "src/app/services/commercial-ac/CommercialAcServiceClient.tsx",
    userIntent: ["B2B 規劃／維護", "辦公室／店面／廠房"],
    adPromise: ["設備／場域評估", "系統選型與配置規劃"],
    landingFirstScreenAction: "LINE 傳平面圖諮詢",
    primaryProof: ["商用系統規劃能力", "VRF／VRV／冰水主機"],
    requiredHeroTokens: [
      "系統選型",
      "配管風管",
      "平面圖",
      "LINE 傳平面圖諮詢",
    ],
    requiredPageTokens: ["VRF／VRV", "冰水主機", "商用需求快速選擇"],
    requiredRsaTokens: ["傳平面圖先初步評估", "系統選型與配管規劃"],
  },
] as const;

export const ADS_LANDING_PROMISE_ROLLOUT = {
  status: "REPOSITORY_CONTRACT",
  googleAdsMutationApplied: false,
  frozenLevers: [
    "budget",
    "bidding strategy",
    "Primary conversion goal",
    "HY - Verified LINE Contact",
    "broad match",
    "AI Max",
  ],
} as const;
