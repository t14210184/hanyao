import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import RewiringServiceClient from "./RewiringServiceClient";

const pageTitle = "高雄屏東老屋電線重拉推薦｜30年舊屋全室電路更新、配電箱換新｜焓耀空調工程";
const pageDescription = "高雄屏東中古屋配線更新專家。焓耀空調工程提供老舊用電線路抽換、配電箱整理更新、冷氣與廚房高功率獨立迴路配置。採用國家標準合格線材，施工完整保固，免搬家分區施作。LINE 線上免費詢價。";
const canonicalUrl = "https://www.xusen.pro/services/rewiring/";

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

const faqs = [
  {
    id: "faq-rw-1",
    question: "老屋電線重拉施工期間，全家需要搬出去住嗎？",
    answer: "通常不需要。我們採用分區斷電施工法，以 30 坪三房兩廳為例，工期約 3~5 天，每天施工結束後會恢復部分生活用電（廚房、廁所、主臥），無需外宿。"
  },
  {
    id: "faq-rw-2",
    question: "全室電線重拉大概要多少錢？有辦法先給一個初步預算嗎？",
    answer: "以 30 坪三房兩廳為例，全室抽換工程連工帶料約 NT$120,000~200,000。建議 LINE 傳現場照片先初步評估，到場後出具精確書面報價。"
  },
  {
    id: "faq-rw-3",
    question: "冷氣一定要拉專用迴路嗎？直接接在現有插座可以嗎？",
    answer: "強烈建議使用獨立迴路。冷氣啟動瞬間電流大，共用迴路易造成跳電，長期大電流通過細線可能導致電線絕緣老化發熱，形成火災隱患。"
  },
  {
    id: "faq-rw-4",
    question: "我家是 40 年老屋，用的是鋁線，一定要換掉嗎？",
    answer: "是的，強烈建議更換。鋁線接點容易氧化鬆動，電阻升高發熱，是老屋電器火災的高風險因子。目前法規已不允許新建住宅使用鋁線。"
  },
  {
    id: "faq-rw-5",
    question: "電線重拉施工後，保固多久？如果之後有問題怎麼辦？",
    answer: "我們提供 1 年施工保固。保固期內因施工不當造成的問題免費回場處理。保固期後若有新問題，我們提供到府優先服務，費用依現場情況收取。"
  }
];

// WebPage Schema
const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": pageTitle,
  "description": pageDescription,
  "url": canonicalUrl
};

// Breadcrumbs Schema
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首頁",
      "item": `${siteConfig.domain}/`
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "服務項目",
      "item": `${siteConfig.domain}/services/`
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "老屋電線抽換",
      "item": canonicalUrl
    }
  ]
};

// HVACBusiness Schema
const businessSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "name": siteConfig.brandName,
  "url": siteConfig.domain,
  "telephone": `+886-${siteConfig.phone1.replace(/-/g, "")}`,
  "email": siteConfig.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": siteConfig.companyAddress,
    "addressLocality": "屏東市",
    "addressCountry": "TW"
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
  "serviceType": [
    "老屋電線重拉",
    "電線抽換",
    "配電箱更新",
    "獨立迴路配置"
  ]
};

// Service Schema
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "ElectricalRewiring",
  "name": "老屋電線抽換與全屋配線更新",
  "provider": {
    "@type": "HVACBusiness",
    "name": siteConfig.brandName
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
  "description": "提供高雄、屏東老屋全室電線抽換、配電箱更新、冷氣與廚房大功率獨立迴路配置，採 CNS 國家標準線材，分區施作無需搬家。"
};

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

export default function RewiringServicePage() {
  return (
    <>
      {/* JSON-LD Schemas — 由 Server Component 輸出 */}
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={businessSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      {/* 互動式 Client Component */}
      <RewiringServiceClient />
    </>
  );
}
