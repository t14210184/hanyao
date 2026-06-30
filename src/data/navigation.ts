export interface NavLink {
  name: string;
  path: string;
}

export const mainNavLinks: NavLink[] = [
  { name: "首頁", path: "/" },
  { name: "服務項目", path: "/services/" },
  { name: "工程實績", path: "/cases/" },
  { name: "常見問題", path: "/faq/" },
  { name: "關於我們", path: "/about/" }
];

export const footerLinks = {
  services: [
    { name: "商用空調工程", path: "/services/commercial-ac/" },
    { name: "空調冷氣安裝", path: "/services/ac-installation/" },
    { name: "冷氣清洗保養", path: "/services/ac-cleaning/" },
    { name: "冷氣維修檢修", path: "/services/ac-repair/" },
    { name: "緊急水電維修", path: "/services/emergency-plumbing-repair/" },
    { name: "老屋電線重拉", path: "/services/rewiring/" },
    { name: "水管更換漏水修繕", path: "/services/plumbing-leak-repair/" }
  ],
  support: [
    { name: "常見問題 FAQ", path: "/faq/" },
    { name: "關於我們", path: "/about/" },
    { name: "聯絡估價", path: "/contact/" },
    { name: "隱私政策", path: "/privacy/" }
  ],
  guides: [
    { name: "冷氣不冷原因判斷", path: "/guides/ac-not-cold/" },
    { name: "冷氣漏水處理方式", path: "/guides/ac-leaking-water/" },
    { name: "冷氣安裝費用因素", path: "/guides/ac-installation-cost-factors/" },
    { name: "冷氣異味與清洗時機", path: "/guides/ac-smell-cleaning/" }
  ]
};
