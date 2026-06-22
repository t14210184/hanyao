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
    sitelinkText: "商用空調工程",
    description1: "中央空調、VRV 與冰水主機規劃",
    description2: "辦公大樓、工廠與餐飲空間規劃",
    href: "/lp/commercial-ac/",
    priority: 1
  },
  {
    campaign: "commercial",
    sitelinkText: "冰水主機維護",
    description1: "氣冷與水冷式冰水機保養檢修",
    description2: "年度合約維護，預防性零件汰換",
    href: "/services/chiller-maintenance/",
    priority: 2
  },
  {
    campaign: "commercial",
    sitelinkText: "工程實績",
    description1: "醫院、金融分行與廠辦實績方向",
    description2: "持證技師團隊，重視工期與品質",
    href: "/cases/",
    priority: 3
  },
  {
    campaign: "commercial",
    sitelinkText: "資格憑證",
    description1: "具備冷凍空調登記與公會證書",
    description2: "乙級技術士團隊，安全合規",
    href: "/about/",
    priority: 4
  },
  {
    campaign: "commercial",
    sitelinkText: "高雄服務區",
    description1: "高雄市商用大樓與廠辦場勘",
    description2: "專業空調技師現場評估報價",
    href: "/areas/kaohsiung/",
    priority: 5
  },
  {
    campaign: "commercial",
    sitelinkText: "聯絡場勘",
    description1: "預約專業工程師到府場勘",
    description2: "可 LINE 傳平面圖進行初步判斷",
    href: "/contact/",
    priority: 6
  }
];
