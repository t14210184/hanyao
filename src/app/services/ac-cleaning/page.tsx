import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import AcCleaningServiceClient from "./AcCleaningServiceClient";

const pageTitle = "高雄屏東冷氣清洗保養｜分離式、窗型、吊隱式到府服務｜焓耀空調工程";
const pageDescription = "焓耀空調工程提供高雄、屏東冷氣清洗保養服務，協助處理冷氣霉味、風量變小、滴水、不冷、排水不順等問題。可透過 LINE 傳照片詢問分離式、窗型、吊隱式與商用空調保養需求。";
const canonicalUrl = "https://www.xusen.pro/services/ac-cleaning/";

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
    id: "faq-cleaning-1",
    question: "冷氣多久需要清洗一次？",
    answer: "一般家用冷氣建議每 1 ~ 2 年清洗保養一次。若家中有過敏體質、寵物、或冷氣安裝在餐廳、客廳等高頻率使用區域，則建議每年定期安排清洗，以維護空氣品質並避免排水管堵塞。"
  },
  {
    id: "faq-cleaning-2",
    question: "有霉味一定要拆洗嗎？",
    answer: "是的。霉味代表內部貫流風鼓與排水盤已滋生黴菌與累積發霉塵垢，單洗濾網或噴灑市售清潔噴霧無法清除風輪深處的霉斑，必須透過專業到府高壓沖洗才能根除異味。"
  },
  {
    id: "faq-cleaning-3",
    question: "冷氣不冷是缺冷媒還是太髒？",
    answer: "大多數不冷的情況是因為濾網、蒸發器冷凝翅片或風鼓卡滿污垢，阻礙風流與熱交換，清洗後即可恢復冷房能效。冷媒在密閉系統中除非有破損漏點否則不會減少，不冷時應先排查髒污，不應隨意強行灌冷媒。"
  },
  {
    id: "faq-cleaning-4",
    question: "清洗會不會弄髒家裡？",
    answer: "不會。我們在清洗前會使用專業的防水塑膠防護布與遮蔽膠帶，將冷氣下方的家具、電器、牆面及地板作全面包覆，並掛上專用漏斗形承接水罩，髒水會直接排入集水桶，絕不弄髒裝潢。"
  },
  {
    id: "faq-cleaning-5",
    question: "分離式冷氣清洗大約要多久？",
    answer: "家用單台壁掛分離式冷氣的清洗時間大約在 1.5 到 2 小時之間，這包含前置機況檢測、周邊防護作業、高壓沖洗、配件刷洗裝回以及完工後的排水與運轉測試。"
  },
  {
    id: "faq-cleaning-6",
    question: "吊隱式冷氣可以清洗嗎？",
    answer: "可以的。吊隱式空調會透過天花板上的維修孔進行施工。技師會對電控板與周邊裝潢做嚴密的防水遮蔽，再將高壓沖洗槽與集水罩掛載於蒸發器與接水盤下方進行清洗。"
  },
  {
    id: "faq-cleaning-7",
    question: "室外機需要洗嗎？",
    answer: "室外機負責散熱。若翅片塞滿沙塵落葉會影響散熱，使壓縮機過載耗電。技師到府時會先評估室外機的安裝位置，在確認安全且符合高壓沖洗條件下，才會建議您加購清洗室外機。"
  },
  {
    id: "faq-cleaning-8",
    question: "店面或辦公室可以定期保養嗎？",
    answer: "可以。營業場所因為長時間運轉且空氣流通量大，極易累積灰塵油煙。我們提供商用空調定期清洗保養服務，亦可配合店家非營業時間（夜間或週末假日）進行排程施工。"
  },
  {
    id: "faq-cleaning-9",
    question: "清洗前需要準備什麼？",
    answer: "請協助將冷氣下方約一坪範圍內的物品、家具或易碎品移開，以便技師放置鋁梯與高壓清洗機。若有無法移動的重型家具，技師會在現場使用雙重防水防塵布包覆保護。"
  },
  {
    id: "faq-cleaning-10",
    question: "如何預約高雄屏東冷氣清洗？",
    answer: "建議您直接加官方 LINE，將室內機的型號銘牌照片（通常在室內機下方）以及現場安裝環境拍照片傳給我們，並告知您所在的區域與台數，客服專員會為您進行初步評估與預約排程。"
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
      "name": "冷氣清洗保養",
      "item": canonicalUrl
    }
  ]
};

// HVACBusiness / LocalBusiness Schema
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
    "冷氣清洗",
    "冷氣保養",
    "空調清潔",
    "分離式冷氣清洗"
  ]
};

// Service Schema
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "冷氣清洗保養",
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
  "description": "提供家用分離式、窗型、吊隱式冷氣及商用空調的高壓深層防護清洗與排水管線保養服務。"
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

export default function AcCleaningServicePage() {
  return (
    <>
      {/* JSON-LD Schemas — 由 Server Component 輸出 */}
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={businessSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      {/* 互動式 Client Component */}
      <AcCleaningServiceClient />
    </>
  );
}
