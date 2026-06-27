import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import AcRepairServiceClient from "./AcRepairServiceClient";

const pageTitle = "高雄、屏東冷氣維修｜冷氣不冷、漏水、異音、跳電先檢查再說明 - 焓耀空調";
const pageDescription = "高雄與屏東變頻冷氣故障維修與檢測服務。專業處理冷氣不冷、出風口滴水漏水、異常噪音異音、不啟動跳電、冷媒短缺等常見故障。堅持到府現場查明原因並說明報價，經同意才施作。";
const canonicalUrl = "https://www.xusen.pro/services/ac-repair/";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    siteName: siteConfig.brandName,
    locale: "zh_TW",
    type: "website",
  },
};

// WebPage Schema
const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": pageTitle,
  "description": pageDescription,
  "url": canonicalUrl
};

// Service Schema
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "冷氣維修",
  "provider": {
    "@type": "HVACBusiness",
    "name": `${siteConfig.brandName}有限公司`
  },
  "areaServed": [
    {
      "@type": "AdministrativeArea",
      "name": "高雄市"
    },
    {
      "@type": "AdministrativeArea",
      "name": "屏東縣"
    }
  ],
  "description": "針對冷氣不冷、漏水滴水、運轉異音、不啟動跳電、漏冷媒等問題提供現場查檢與維修排除服務。"
};

const faqs = [
  {
    id: "main-faq-1",
    question: "冷氣不冷一定是冷媒不足嗎？",
    answer: "不一定。最常見的原因是濾網或冷凝器嚴重髒污堵塞風道，或是室外機散熱不良。冷媒在密閉系統內若無洩漏是不需要添加的。若是漏冷媒，必須先找出洩漏點修補，單純灌冷媒只會反覆漏光。"
  },
  {
    id: "main-faq-2",
    question: "冷氣漏水可以自己清排水管嗎？",
    answer: "如果只是排水管出口有泥沙阻塞，可自行清理；但如果是室內機內部水盤積垢、黴菌堵塞，或管線坡度問題，自行清理容易損壞管線或導致積水往裝潢滲漏，建議委由專業師傅處理。"
  },
  {
    id: "main-faq-3",
    question: "冷氣一直跳電可以繼續開嗎？",
    answer: "不行。跳電代表電路過載、短路或壓縮機故障，是系統的安全保護機制。反覆強行啟動會導致電控板燒毀、電線損壞甚至引發大火。請先保持電源關閉並預約檢測。"
  },
  {
    id: "main-faq-4",
    question: "冷氣有異音是不是壓縮機壞了？",
    answer: "不一定。室內機異音多為風鼓髒污不平衡、風扇馬達軸承老化磨損；室外機異音可能是避震腳墊老化硬化共振。壓縮機故障通常會伴隨冷氣完全不冷，並發出劇烈卡死的嗡嗡聲。"
  },
  {
    id: "main-faq-5",
    question: "灌冷媒可以撐多久？",
    answer: "若沒有修補漏點，灌冷媒可能幾天至幾週內就會漏光。必須先由技師進行壓力測試，找出確切洩漏處焊接修補或重做接頭喇叭口，抽真空後重新定量充填，才能維持長期運運裝。"
  },
  {
    id: "main-faq-6",
    question: "維修前需要先清洗冷氣嗎？",
    answer: "如果冷氣不冷是由於鰭片與風鼓積塵過多，通常清洗保養即可解決；但如果是啟動電容或控制基板損壞，則需先進行零件維修更換。技師現場檢測時會為您說明主要原因。"
  },
  {
    id: "main-faq-7",
    question: "高雄、屏東哪些地區可服務？",
    answer: "我們主要服務高雄市（如三民、左營、楠梓、鼓山、苓雅、前鎮、小港、鳳山、仁武、大寮、岡山、橋頭等）與屏東縣市（如屏東市、潮州、東港、萬丹、長治、麟洛、內埔、九如、里港、恆春、車城等）鄰近區域。技師會依現有排程與動線規劃提供到府檢修。"
  },
  {
    id: "main-faq-8",
    question: "LINE 詢問要提供哪些資料？",
    answer: "建議提供冷氣品牌型號（室內機下方的貼紙照片）、故障現象的照片或短影片（如漏水位置、異常噪音聲），並告知您的所在區域與方便聯絡時間，以利技師線上初步分析可能原因。"
  }
];

// FAQ Schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

export default function AcRepairServicePage() {
  return (
    <>
      {/* JSON-LD Schemas — 由 Server Component 輸出 */}
      <JsonLd schema={pageSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />
      
      {/* 互動式 Client Component */}
      <AcRepairServiceClient />
    </>
  );
}
