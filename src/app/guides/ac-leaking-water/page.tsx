import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcLeakingWaterClient from "./AcLeakingWaterClient";

const pageTitle = "冷氣滴水、漏水怎麼辦？排水、髒污與安裝坡度都可能是原因 - 焓耀空調";
const pageDescription = "冷氣滴水漏水怎麼辦？空調技師分析滴水原因包含排水堵塞、水盤發霉、室內機髒污或安裝水平斜度不良。教您自行排查步驟與如何判斷清洗或維修。";
const canonicalUrl = "https://www.xusen.pro/guides/ac-leaking-water/";

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
    type: "article",
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": pageTitle,
  "description": pageDescription,
  "url": canonicalUrl
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首頁",
      "item": "https://www.xusen.pro/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "服務指南",
      "item": "https://www.xusen.pro/guides/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "冷氣滴水漏水排查指南",
      "item": canonicalUrl
    }
  ]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "冷氣滴水、漏水怎麼辦？排水、髒污與安裝坡度都可能是原因",
  "description": pageDescription,
  "url": canonicalUrl,
  "author": {
    "@type": "Organization",
    "name": "焓耀空調工程"
  },
  "publisher": {
    "@type": "Organization",
    "name": "焓耀空調工程"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "冷氣滴水是不是只要清洗保養就會好？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "不一定。滴水原因與排水管路、髒污程度、安裝坡度及環境條件皆有關係。如果是排水盤淤積發霉黏膜造成堵塞，進行深層清洗即可排除；但若是排水軟管破裂、銅管保溫套老化產生冷凝水，或是原安裝水平跑位，則必須安排維修更換配件，需依現場狀況進行診斷與判斷。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣突然開始滴水，應該先做什麼？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "請先關閉冷氣電源，避免凝結水持續溢出損壞天花板裝潢或壁紙。接著可先用抹布擦乾，檢查室外排水管口是否順暢排出，並可將滴水處或周圍管線配置拍照，LINE 傳送給技師協助判斷。"
      }
    },
    {
      "@type": "Question",
      "name": "使用裝潢排水盒（小水幫浦）容易壞掉滴水嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "是的。當室內機沒有天然重力排水坡度時，會安裝機械式排水器。排水器內部有感應浮球與小馬達，使用時間久了容易積垢卡死，導致積水無法排出而溢水滴漏。這通常需要更換新的排水器零件。"
      }
    }
  ]
};

export default function AcLeakingWaterGuidePage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={articleSchema} />
      <JsonLd schema={faqSchema} />
      <AcLeakingWaterClient />
    </>
  );
}
