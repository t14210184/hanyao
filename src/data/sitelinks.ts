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
    sitelinkText: "清洗保養服務",
    description1: "分離式與吊隱式深層高壓清洗",
    description2: "無毒藥劑，室內裝潢防塵保護",
    href: "/lp/ac-cleaning/",
    priority: 1
  },
  {
    campaign: "cleaning",
    sitelinkText: "高雄服務區",
    description1: "高雄市區冷氣高壓清洗抗菌",
    description2: "徹底清除黴菌，恢復冷房能效",
    href: "/areas/kaohsiung/",
    priority: 2
  },
  {
    campaign: "cleaning",
    sitelinkText: "屏東服務區",
    description1: "屏東縣市到府清洗冷氣保養",
    description2: "確認台數與機型，報價透明",
    href: "/areas/pingtung/",
    priority: 3
  },
  {
    campaign: "cleaning",
    sitelinkText: "霉味風量變小",
    description1: "冷氣發霉霉味與風量變小解答",
    description2: "高壓清洗鼓風輪與水盤改善空氣",
    href: "/guides/ac-smell-cleaning/",
    priority: 4
  },
  {
    campaign: "cleaning",
    sitelinkText: "常見問題",
    description1: "清洗時間與施作防護說明",
    description2: "了解現場清洗是否會拆回公司",
    href: "/faq/",
    priority: 5
  },
  {
    campaign: "cleaning",
    sitelinkText: "預約清洗",
    description1: "填寫台數與機型快速預約",
    description2: "配合您的作息排定清洗保養時間",
    href: "/contact/",
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
