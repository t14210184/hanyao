import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import AcInstallationServiceClient from "./AcInstallationServiceClient";

const pageTitle = "空調冷氣安裝｜高雄、屏東分離式、變頻、吊隱式冷氣規劃 - 焓耀空調";
const pageDescription =
  "高雄與屏東專業空調冷氣安裝服務。涵蓋住宅、小型店面與辦公室冷氣規劃，提供分離式、吊隱式與變頻冷氣安裝、新屋裝修配管、冷氣汰舊換新。評估坪數噸數、室內外機位置、配管排水與維修便利性，依現場條件到府估價。";
const canonicalUrl = "https://www.xusen.pro/services/ac-installation/";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "空調冷氣安裝｜高雄、屏東分離式、變頻、吊隱式冷氣規劃",
    description: pageDescription,
    url: canonicalUrl,
    siteName: siteConfig.brandName,
    locale: "zh_TW",
    type: "website",
  },
};

const faqs = [
  {
    id: "faq-main-1",
    question: "冷氣安裝前要先買好機器嗎？",
    answer:
      "不一定要先買好。可以先透過 LINE 描述空間需求，由技師協助評估適合的機型與噸數，再決定購買品牌與規格，避免買了不合適的機器後才發現安裝條件不符。",
  },
  {
    id: "faq-main-2",
    question: "分離式和吊隱式冷氣怎麼選？",
    answer:
      "分離式冷氣安裝彈性高、維修方便，適合一般住宅與小型辦公室。吊隱式冷氣將主機隱藏於天花板內，外觀簡潔，但需在裝潢前同步規劃，後期維修也需預留維修孔。可先描述空間條件，由技師協助說明兩者的差異與適用情境。",
  },
  {
    id: "faq-main-3",
    question: "吊隱式冷氣一定要在裝潢前規劃嗎？",
    answer:
      "是的。吊隱式主機需在天花板骨架施作前完成吊裝與配管，裝潢完成後若要新增吊隱式冷氣，維修孔與回風路徑的規劃難度會大幅提高，建議在裝潢前與設計師同步討論。",
  },
  {
    id: "faq-main-4",
    question: "冷氣噸數要怎麼估算？",
    answer:
      "基本估算以每坪約 400~500 Kcal/hr 為基準，但若有頂樓、西曬、挑高或大型電器等熱源，需適度提高估算係數。建議提供坪數、窗向與空間用途，由技師協助進行初步試算。",
  },
  {
    id: "faq-main-5",
    question: "汰舊換新時舊機拆除可以一起處理嗎？",
    answer:
      "可以。換新時可依現場狀況協助說明舊機拆除流程，並評估舊管路是否能留用。原有銅管若管徑、厚度符合新冷媒規格，可在清洗後留用；若不符則建議同步更換。",
  },
  {
    id: "faq-main-6",
    question: "排水管要怎麼安排，才不會日後漏水？",
    answer:
      "排水管需維持至少 1/100 的下斜坡度，接口須確實密封，並於封板前進行灌水測試。若裝潢已完成，需確認現有排水路徑是否符合規格，必要時安排現場確認評估。",
  },
  {
    id: "faq-main-7",
    question: "高雄、屏東哪些地區可以詢問？",
    answer:
      "主要服務區域涵蓋高雄市各區（含三民、左營、楠梓、鳳山、仁武等）與屏東縣各鄉鎮（含屏東市、潮州、東港、萬丹等）。可先 LINE 描述地址與需求，由我們確認可服務範圍。",
  },
  {
    id: "faq-main-8",
    question: "LINE 詢問安裝要提供哪些資料？",
    answer:
      "建議提供：（1）欲安裝空間照片、（2）坪數或平面圖、（3）室外機預計擺放位置照片、（4）是否有裝潢進度或時間限制。資料越完整，技師越能快速給出初步評估方向。",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "首頁", item: `${siteConfig.domain}/` },
    { "@type": "ListItem", position: 2, name: "服務項目", item: `${siteConfig.domain}/services/` },
    { "@type": "ListItem", position: 3, name: "空調冷氣安裝", item: canonicalUrl },
  ],
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "空調冷氣安裝服務",
  description: pageDescription,
  url: canonicalUrl,
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "空調冷氣安裝",
  provider: {
    "@type": "HVACBusiness",
    name: `${siteConfig.brandName}有限公司`,
  },
  areaServed: [
    { "@type": "AdministrativeArea", name: "高雄市" },
    { "@type": "AdministrativeArea", name: "屏東縣" },
  ],
  description: pageDescription,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function AcInstallationServicePage() {
  return (
    <>
      {/* JSON-LD Schemas — 由 Server Component 輸出 */}
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={pageSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      {/* 互動式 Client Component */}
      <AcInstallationServiceClient />
    </>
  );
}
