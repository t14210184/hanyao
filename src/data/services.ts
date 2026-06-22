export interface ServiceItem {
  id: string;
  name: string;
  painPoint: string;
  solution: string;
  path: string;
  ctaText: string;
}

export const servicesData: ServiceItem[] = [
  {
    id: "commercial-ac",
    name: "商用空調工程",
    painPoint: "商用空間冷房不均、耗電過高、維護困難？",
    solution: "量身規劃變頻多聯 VRV 系統與冰水機工程，兼顧節能與美觀設計。",
    path: "/services/commercial-ac/",
    ctaText: "了解商用規劃"
  },
  {
    id: "ac-installation",
    name: "空調冷氣安裝",
    painPoint: "擔心管線外露不美觀、散熱不佳或冷房效果打折？",
    solution: "專業到府評估、管線精準隱蔽配置，並進行散熱與排水完美計算。",
    path: "/services/ac-installation/",
    ctaText: "了解安裝細節"
  },
  {
    id: "ac-cleaning",
    name: "冷氣清洗保養",
    painPoint: "冷氣吹出霉味、風量變小、甚至電費異常飆高？",
    solution: "無毒藥劑深層高壓清洗、防霉防菌除臭，恢復出風量並提升省電效能。",
    path: "/services/ac-cleaning/",
    ctaText: "了解清洗保養"
  },
  {
    id: "ac-repair",
    name: "冷氣維修檢修",
    painPoint: "突然滴水漏水、不冷只吹送風，或發出異常噪音？",
    solution: "專業儀器精準檢修，透明報價、先說明再修，採用原廠規格零件。",
    path: "/services/ac-repair/",
    ctaText: "立即預約檢修"
  },
  {
    id: "ac-relocation",
    name: "冷氣移機服務",
    painPoint: "裝潢或搬家需要配合拆機、異地安裝，擔心冷媒流失？",
    solution: "嚴格標準作業流程，冷媒回收封存、完整清潔防護與高規格二次安裝。",
    path: "/services/ac-relocation/",
    ctaText: "了解移機服務"
  },
  {
    id: "erv",
    name: "全熱交換器規劃",
    painPoint: "緊鄰馬路不敢開窗、室內空氣沉悶、二氧化碳過高？",
    solution: "引進室外新風，經 PM2.5 雙向過濾與溫濕度能量交換，打造健康呼吸宅。",
    path: "/services/erv/",
    ctaText: "了解全熱交換"
  }
];
