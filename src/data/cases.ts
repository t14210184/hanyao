export interface CaseItem {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  specs: string[];
}

export const casesData: CaseItem[] = [
  {
    id: "case-commercial-vrv",
    title: "多聯變頻 VRV 空調規劃工程",
    category: "醫療與商業空間",
    location: "高雄市 前金區",
    description: "為地區骨科醫院與商業展場進行多聯變頻系統整合，優化病患就診動線與展示區的恆溫控制，解決舊大樓空間挑高與排水限制。",
    specs: ["日立變頻多聯 VRV 系統", "防菌抗敏風管工程", "智慧分區溫度控制網關"]
  },
  {
    id: "case-factory-chiller",
    title: "精密工廠與防爆化學廠空調優化",
    category: "工業與廠房工程",
    location: "屏東縣 屏東工業區",
    description: "針對精密工業大廠與化學工廠進行環境通風與降溫設計，嚴格調校溫度與濕度，確保精密儀器在恆溫恆濕環境下穩定運作。",
    specs: ["180 噸節能冰水主機優化", "防爆氣冷式空調配置", "排氣與補風系統平衡工程"]
  },
  {
    id: "case-retail-erv",
    title: "餐飲空間冷房與全熱空氣換氣系統",
    category: "連鎖餐飲與運動中心",
    location: "高雄市 左營區",
    description: "為知名連鎖早午餐店（六吋盤）與室內運動中心規劃高換氣效率空調，有效解決廚房熱源逸散與運動區空氣悶熱問題。",
    specs: ["大風量節能全熱交換器", "廚房排煙與補風連鎖控制", "高靜壓變頻分離式空調"]
  },
  {
    id: "case-bank-chiller",
    title: "金融機構中央空調緊急維修與汰換",
    category: "金融與辦公大樓",
    location: "高雄市 三民區",
    description: "第一銀行分行中央空調系統老化故障緊急檢修，在不影響營業的前提下快速排障，並提出後續機組節能汰換計畫。",
    specs: ["冰水泵浦與主機緊急排障", "水管管路水垢清洗", "運轉參數監控與能效評估"]
  }
];
