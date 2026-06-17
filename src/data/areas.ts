export interface AreaConfig {
  id: string;
  name: string;
  headline: string;
  description: string;
  districts: string[];
}

export const areasData: Record<string, AreaConfig> = {
  kaohsiung: {
    id: "kaohsiung",
    name: "高雄地區",
    headline: "高雄市全區冷氣空調工程服務",
    description: "焓耀空調在高雄深耕多年，提供高雄市區（三民、鼓山、左營、楠梓、鳳山、苓雅、新興、前金、前鎮、小港、鹽埕等）專業冷氣到府場勘、快速維修與定期清洗保養，急件指派免排隊。",
    districts: [
      "三民區", "鼓山區", "左營區", "楠梓區", "鳳山區", 
      "苓雅區", "新興區", "前金區", "前鎮區", "小港區", 
      "鹽埕區", "大寮區", "鳥松區", "仁武區", "路竹區", 
      "岡山區", "橋頭區", "梓官區", "彌陀區", "林園區"
    ]
  },
  pingtung: {
    id: "pingtung",
    name: "屏東地區",
    headline: "屏東縣市冷氣空調工程服務",
    description: "屏東在地服務，提供屏東市、潮州鎮、東港鎮、萬丹鄉、長治鄉、麟洛鄉、九如鄉、里港鄉、內埔鄉等地的冷氣安裝、舊換新、空調漏水噪音故障檢修與冷氣清洗，免費到府場勘報價。",
    districts: [
      "屏東市", "潮州鎮", "東港鎮", "萬丹鄉", "長治鄉", 
      "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "內埔鄉", 
      "竹田鄉", "萬巒鄉", "新園鄉", "崁頂鄉", "佳冬鄉"
    ]
  },
  all: {
    id: "all",
    name: "高屏全區",
    headline: "高雄、屏東跨區域空調整合服務",
    description: "我們主要服務高雄與屏東全區，配備專業工程車與合格空調技師，無論是家用變頻冷氣或是工廠、大樓的商用中央空調，皆能提供高效率的跨區域快速維修、安裝與規劃服務。",
    districts: ["高雄全區", "屏東全區"]
  }
};
