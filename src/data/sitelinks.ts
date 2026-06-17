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
    sitelinkText: "冷氣舊換新",
    description1: "專業拆除與安裝一條龍",
    description2: "冷媒安全回收，無縫配合裝潢",
    href: "/services/ac-replacement/",
    priority: 1
  },
  {
    campaign: "installation",
    sitelinkText: "安裝費用因素",
    description1: "冷氣安裝報價透明說明",
    description2: "管線與散熱如何決定安裝成本",
    href: "/guides/ac-installation-cost-factors/",
    priority: 2
  },
  {
    campaign: "installation",
    sitelinkText: "高雄服務區",
    description1: "高雄市各區到府估價規劃",
    description2: "在地合格技師，配合工程排程",
    href: "/areas/kaohsiung/",
    priority: 3
  },
  {
    campaign: "installation",
    sitelinkText: "屏東服務區",
    description1: "屏東市及鄰近鄉鎮冷氣安裝",
    description2: "實地場勘規劃，價格透明合規",
    href: "/areas/pingtung/",
    priority: 4
  },
  {
    campaign: "installation",
    sitelinkText: "資格憑證",
    description1: "合規冷凍空調登記與會員",
    description2: "乙級技術士執照師傅團隊",
    href: "/about/",
    priority: 5
  },
  {
    campaign: "installation",
    sitelinkText: "聯絡估價",
    description1: "線上填表或電話直接諮詢",
    description2: "師傅快速回覆，預約到府估價",
    href: "/contact/",
    priority: 6
  },

  // 2. 冷氣維修廣告活動
  {
    campaign: "repair",
    sitelinkText: "高雄冷氣維修",
    description1: "高雄地區冷氣故障到府檢修",
    description2: "精準查檢說明，同意後再施作",
    href: "/areas/kaohsiung-ac-repair/",
    priority: 1
  },
  {
    campaign: "repair",
    sitelinkText: "屏東服務區",
    description1: "屏東縣市壁掛與吊隱式檢修",
    description2: "冷媒漏水故障排除，原廠零件",
    href: "/areas/pingtung/",
    priority: 2
  },
  {
    campaign: "repair",
    sitelinkText: "冷氣不冷怎麼辦",
    description1: "冷氣吹風不冷自我檢查步驟",
    description2: "工程師建議四大故障排查方向",
    href: "/guides/ac-not-cold/",
    priority: 3
  },
  {
    campaign: "repair",
    sitelinkText: "冷氣滴水原因",
    description1: "室內機滴水漏水解決對策",
    description2: "排水堵塞與冷媒不足結冰排除",
    href: "/guides/ac-leaking-water/",
    priority: 4
  },
  {
    campaign: "repair",
    sitelinkText: "常見問題",
    description1: "檢修費用與維修保固規則",
    description2: "了解場勘排程與原廠零件更換",
    href: "/faq/",
    priority: 5
  },
  {
    campaign: "repair",
    sitelinkText: "聯絡檢修",
    description1: "線上描述故障症狀快速預約",
    description2: "提供 LINE 傳照初步判斷服務",
    href: "/contact/",
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
