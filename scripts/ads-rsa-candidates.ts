export type RsaVariant = {
  id: "A" | "B";
  valueProposition: string;
  headlines: readonly string[];
  descriptions: readonly string[];
};

export type RsaCampaignCandidate = {
  campaign: "冷氣維修" | "冷氣清洗保養" | "冷氣安裝" | "商用工程";
  landingPath: string;
  landingPromise: readonly string[];
  variants: readonly [RsaVariant, RsaVariant];
};

export const RSA_CANDIDATE_VERSION = "hanyao-rsa-v1";

/**
 * WP03 candidate-only copy package.
 *
 * Safety contract:
 * - no Google Ads mutation is performed by this module;
 * - candidates must be assigned only after a fresh enabled-ad-group inventory;
 * - no budget, bidding, keyword, negative-keyword, conversion-goal or tracking mutation;
 * - headlines intentionally avoid the platform name LINE so they remain compatible
 *   with the separately governed Message Asset pilot.
 */
export const RSA_CANDIDATES: readonly RsaCampaignCandidate[] = [
  {
    campaign: "冷氣維修",
    landingPath: "/services/ac-repair/",
    landingPromise: [
      "冷氣不冷、滴水、漏水、異音或跳電",
      "先提供品牌型號、故障照片或症狀與所在地區",
      "確認原因與報價後再施工",
    ],
    variants: [
      {
        id: "A",
        valueProposition: "症狀／立即需求型",
        headlines: [
          "高雄冷氣維修檢查",
          "屏東冷氣維修服務",
          "冷氣不冷先判斷原因",
          "冷氣滴水漏水處理",
          "冷氣異音故障檢修",
          "冷氣跳電先停止使用",
          "傳照片先初步判斷",
          "故障症狀先說明",
        ],
        descriptions: [
          "冷氣不冷、滴水、漏水、異音或跳電，可先傳照片與症狀，確認狀況後安排檢修。",
          "高雄屏東到府檢修，先說明可能原因與處理方式，確認報價後再施工。",
        ],
      },
      {
        id: "B",
        valueProposition: "信任／透明流程型",
        headlines: [
          "高雄屏東在地空調服務",
          "先判斷故障再報價",
          "先檢查再說明報價",
          "冷媒不足先查漏點",
          "透明說明同意後施工",
          "故障原因先查清楚",
          "到場檢查再決定施工",
          "維修前先確認處理方式",
        ],
        descriptions: [
          "先檢查故障原因，再說明處理方式與報價；確認內容後才施工，避免只補冷媒卻沒有處理漏點。",
          "高雄屏東冷氣檢修，可先提供品牌型號、故障照片與所在地區，協助判斷下一步。",
        ],
      },
    ],
  },
  {
    campaign: "冷氣清洗保養",
    landingPath: "/services/ac-cleaning/",
    landingPromise: [
      "霉味、風量變小、滴水或冷房變差",
      "依機型與髒污狀況評估清潔方式",
      "可先提供機型照片、所在地區與台數",
    ],
    variants: [
      {
        id: "A",
        valueProposition: "症狀／立即需求型",
        headlines: [
          "高雄屏東冷氣清洗",
          "冷氣有霉味先清潔",
          "風量變小檢查髒污",
          "冷氣滴水檢查排水",
          "分離式冷氣清洗",
          "吊隱式冷氣清洗",
          "傳機型照片先確認",
          "清洗台數先確認",
        ],
        descriptions: [
          "冷氣有霉味、風量變小、滴水或不夠冷，可先提供機型、台數與照片，確認清洗方式與排程。",
          "高雄屏東冷氣清洗保養，依機型與髒污狀況評估，施工前先確認範圍與現場條件。",
        ],
      },
      {
        id: "B",
        valueProposition: "信任／透明流程型",
        headlines: [
          "現場防護後再清洗",
          "清洗前先開機檢查",
          "清洗後再運轉測試",
          "排水系統一併檢查",
          "依機型評估清洗方式",
          "高雄屏東到府保養",
          "施工範圍先確認",
          "機型與髒污先評估",
        ],
        descriptions: [
          "施工前先檢查機況並做好現場防護，依機型與髒污狀況安排清洗，完成後再測試運轉與排水。",
          "分離式、窗型、吊隱式與商用空調皆依現場條件評估，先說明清洗方式與施工範圍。",
        ],
      },
    ],
  },
  {
    campaign: "冷氣安裝",
    landingPath: "/services/ac-installation/",
    landingPromise: [
      "新屋、舊換新與裝潢前安裝規劃",
      "坪數、冷房能力、配管排水與室內外機位置",
      "先提供空間照片與需求，依現場條件評估",
    ],
    variants: [
      {
        id: "A",
        valueProposition: "需求／現場條件型",
        headlines: [
          "高雄屏東冷氣安裝",
          "新屋冷氣安裝規劃",
          "舊換新先看現場",
          "裝潢前先規劃配管",
          "坪數噸數先評估",
          "排水與配管先確認",
          "室外機位置先評估",
          "傳現場照片先判斷",
        ],
        descriptions: [
          "新屋、舊換新或裝潢前安裝，可先提供空間照片與坪數，初步評估機型、配管、排水與室外機位置。",
          "高雄屏東冷氣安裝，依空間與現場條件評估施工方式；需要時再安排現場確認與報價。",
        ],
      },
      {
        id: "B",
        valueProposition: "信任／規劃流程型",
        headlines: [
          "現場條件確認後報價",
          "冷房需求先評估",
          "配管排水逐項說明",
          "確認施工方式再安裝",
          "保留日後維修空間",
          "施工條件先說清楚",
          "安裝前先確認冷房能力",
          "室內外機位置先規劃",
        ],
        descriptions: [
          "不只看機型，也評估坪數、冷房能力、配管排水、室內外機位置與後續維修便利性。",
          "先說明安裝方式與材料條件，依現場狀況確認報價，確認後再安排施作日期。",
        ],
      },
    ],
  },
  {
    campaign: "商用工程",
    landingPath: "/services/commercial-ac/",
    landingPromise: [
      "辦公室、店面、餐飲、廠房與大型空間",
      "系統選型、配管風管、設備配置與後續維護",
      "先提供平面圖、現場照片與使用需求",
    ],
    variants: [
      {
        id: "A",
        valueProposition: "場域／系統需求型",
        headlines: [
          "高雄屏東商用空調",
          "辦公室空調工程",
          "店面餐廳空調規劃",
          "廠房空調系統評估",
          "VRF多聯式空調規劃",
          "冰水主機空調工程",
          "傳平面圖先初步評估",
          "大型空間冷房規劃",
        ],
        descriptions: [
          "辦公室、店面、餐廳或廠房需求，可先提供平面圖、現場照片與使用條件，初步評估空調系統方向。",
          "高雄屏東商用空調工程，依冷房需求、系統選型、配管風管與設備配置規劃後續方案。",
        ],
      },
      {
        id: "B",
        valueProposition: "信任／規劃流程型",
        headlines: [
          "現場條件先場勘規劃",
          "系統選型與配管規劃",
          "設備配置與維護一起評估",
          "商用空調需求先確認",
          "平面圖照片先提供",
          "先評估再規劃方案",
          "後續維護一併考量",
          "企業空調先確認需求",
        ],
        descriptions: [
          "從冷房需求、設備配置、配管風管到後續維護一併評估，複雜案場再安排現場確認。",
          "可先提供平面圖、設備照片與使用需求，依現場條件評估適合的商用空調方案。",
        ],
      },
    ],
  },
] as const;

export const RSA_ROLLOUT_CONTRACT = {
  status: "CANDIDATE_ONLY",
  googleAdsMutationApplied: false,
  requiredLivePrestate: [
    "enabled ad groups",
    "enabled RSA inventory",
    "Ad Strength and feedback",
    "final URLs",
  ],
  publishGate: "HG-ADS-RSA",
  prohibitedChanges: [
    "budget",
    "bidding strategy",
    "Primary conversion goal",
    "canonical conversion action",
    "broad match expansion",
    "AI Max",
  ],
} as const;
