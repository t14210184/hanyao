export interface SitelinkItem {
  campaign: "installation" | "repair" | "cleaning" | "commercial";
  sitelinkText: string;
  description1: string;
  description2: string;
  href: string;
  priority: number;
}

export const sitelinksData: SitelinkItem[] = [
  // 1. 冷氣安裝廣告活動
  {
    campaign: "installation",
    sitelinkText: "分離式冷氣安裝",
    description1: "室內外機位置與管線規劃",
    description2: "高雄屏東空調冷氣安裝",
    href: "/services/ac-installation/split-ac/",
    priority: 1
  },
  {
    campaign: "installation",
    sitelinkText: "吊隱式冷氣安裝",
    description1: "天花板、維修孔先確認",
    description2: "配合裝潢規劃出回風",
    href: "/services/ac-installation/concealed-ac/",
    priority: 2
  },
  {
    campaign: "installation",
    sitelinkText: "冷氣汰舊換新",
    description1: "舊機拆除與新機配置評估",
    description2: "依現場條件說明施工方式",
    href: "/services/ac-installation/replacement/",
    priority: 3
  },
  {
    campaign: "installation",
    sitelinkText: "配管排水規劃",
    description1: "冷媒管、排水管路徑確認",
    description2: "降低日後漏水與維修困擾",
    href: "/services/ac-installation/piping-drainage/",
    priority: 4
  },
  {
    campaign: "installation",
    sitelinkText: "坪數噸數規劃",
    description1: "依空間坪數與熱源評估",
    description2: "避免冷房不足或過度配置",
    href: "/services/ac-installation/capacity-planning/",
    priority: 5
  },
  {
    campaign: "installation",
    sitelinkText: "安裝費用流程",
    description1: "報價依機型與施工條件",
    description2: "先確認需求再說明費用",
    href: "/services/ac-installation/cost/",
    priority: 6
  },

  // 2. 冷氣維修廣告活動
  {
    campaign: "repair",
    sitelinkText: "冷氣不冷檢修",
    description1: "吹不冷、只有風先判斷原因",
    description2: "LINE 描述狀況安排檢查",
    href: "/services/ac-repair/not-cold/",
    priority: 1
  },
  {
    campaign: "repair",
    sitelinkText: "冷氣漏水滴水",
    description1: "室內機滴水、牆面滲水處理",
    description2: "排水堵塞與坡度問題檢查",
    href: "/services/ac-repair/leaking-water/",
    priority: 2
  },
  {
    campaign: "repair",
    sitelinkText: "冷氣異音處理",
    description1: "怪聲、震動、外機噪音檢查",
    description2: "先判斷來源再說明維修方式",
    href: "/services/ac-repair/noise/",
    priority: 3
  },
  {
    campaign: "repair",
    sitelinkText: "冷氣跳電不啟動",
    description1: "打不開、燈號閃、運轉中斷",
    description2: "安全檢查後評估處理方向",
    href: "/services/ac-repair/no-power/",
    priority: 4
  },
  {
    campaign: "repair",
    sitelinkText: "冷媒不足檢查",
    description1: "不冷不一定只是缺冷媒",
    description2: "先查漏點再評估是否補充",
    href: "/services/ac-repair/refrigerant-leak/",
    priority: 5
  },
  {
    campaign: "repair",
    sitelinkText: "維修費用流程",
    description1: "檢測、報價、維修流程說明",
    description2: "依機型與故障狀況評估",
    href: "/services/ac-repair/cost/",
    priority: 6
  },

  // 3. 冷氣清洗保養廣告活動
  {
    campaign: "cleaning",
    sitelinkText: "清洗價格",
    description1: "了解影響清洗費用因素",
    description2: "依機型台數位置評估報價",
    href: "/services/ac-cleaning/pricing/",
    priority: 1
  },
  {
    campaign: "cleaning",
    sitelinkText: "清洗流程",
    description1: "了解到府清洗施工步驟",
    description2: "預約前先看注意事項",
    href: "/services/ac-cleaning/process/",
    priority: 2
  },
  {
    campaign: "cleaning",
    sitelinkText: "分離式清洗",
    description1: "改善霉味風量與滴水問題",
    description2: "高雄屏東到府清洗評估",
    href: "/services/ac-cleaning/split-type/",
    priority: 3
  },
  {
    campaign: "cleaning",
    sitelinkText: "霉味除臭",
    description1: "冷氣一開有霉味酸味",
    description2: "檢查風鼓冷排排水盤",
    href: "/services/ac-cleaning/odor-mold/",
    priority: 4
  },
  {
    campaign: "cleaning",
    sitelinkText: "滴水不冷",
    description1: "滴水風量小先檢查原因",
    description2: "不亂補冷媒先判斷問題",
    href: "/services/ac-cleaning/dripping-not-cooling/",
    priority: 5
  },
  {
    campaign: "cleaning",
    sitelinkText: "高屏到府",
    description1: "高雄屏東冷氣保養服務",
    description2: "LINE確認地區與可約時段",
    href: "/services/ac-cleaning/kaohsiung-pingtung/",
    priority: 6
  },

  // 4. 商用工程廣告活動
  {
    campaign: "commercial",
    sitelinkText: "辦公室空調規劃",
    description1: "商辦分區與冷房需求評估",
    description2: "依現場條件規劃系統",
    href: "https://www.xusen.pro/services/commercial-ac/office-ac/",
    priority: 1
  },
  {
    campaign: "commercial",
    sitelinkText: "餐飲店面空調",
    description1: "熱源、人流與排風一起評估",
    description2: "店面賣場空調規劃",
    href: "https://www.xusen.pro/services/commercial-ac/restaurant-retail/",
    priority: 2
  },
  {
    campaign: "commercial",
    sitelinkText: "廠房空調改善",
    description1: "高熱源、大空間冷房評估",
    description2: "協助規劃廠辦降溫方式",
    href: "https://www.xusen.pro/services/commercial-ac/factory-ac/",
    priority: 3
  },
  {
    campaign: "commercial",
    sitelinkText: "VRF多聯式空調",
    description1: "多區域溫控與管線規劃",
    description2: "商辦旅宿空調系統評估",
    href: "https://www.xusen.pro/services/commercial-ac/vrf-vrv/",
    priority: 4
  },
  {
    campaign: "commercial",
    sitelinkText: "冰水主機系統",
    description1: "中央空調與冰水系統規劃",
    description2: "依案場規模評估設備",
    href: "https://www.xusen.pro/services/commercial-ac/chiller-system/",
    priority: 5
  },
  {
    campaign: "commercial",
    sitelinkText: "空調維護合約",
    description1: "定期巡檢與保養規劃",
    description2: "降低突發故障與停機風險",
    href: "https://www.xusen.pro/services/commercial-ac/maintenance-contract/",
    priority: 6
  }
];
