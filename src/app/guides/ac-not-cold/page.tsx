import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcNotColdClient from "./AcNotColdClient";

const pageTitle = "冷氣不冷怎麼辦？高雄 / 屏東空調工程師建議先檢查這 3 件事 - 焓耀空調";
const pageDescription = "冷氣吹風不冷怎麼辦？工程師說明冷氣不冷不一定是冷媒不足，可能是濾網髒污或室外機散熱不良。教您自行檢查的 3 大步驟與預約檢修的評估指標。";
const canonicalUrl = "https://www.xusen.pro/guides/ac-not-cold/";

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
      "name": "冷氣不冷排查指南",
      "item": canonicalUrl
    }
  ]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "冷氣不冷怎麼辦？高雄 / 屏東空調工程師建議先檢查這 3 件事",
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
      "name": "冷氣不冷是不是一定要補冷媒？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "不一定。冷氣不冷最常見的原因是濾網髒污、冷凝器卡灰塵導致風阻過大，或是室外機散熱空間被雜物阻擋。如果是漏冷媒，必須先找出漏水點焊接修補，否則只加冷媒依然會反覆漏光，且容易導致壓縮機過載燒毀。"
      }
    },
    {
      "@type": "Question",
      "name": "自行清洗濾網後，冷氣還是不冷該怎麼辦？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "如果濾網乾淨、室外機通風良好卻仍只吹送風，可能是壓縮機啟動電容損壞、主控板受損或冷媒管路微漏。建議先關閉電源，拍照或錄製冷氣運轉聲音，LINE 傳給專業師傅協助初步分析。"
      }
    },
    {
      "@type": "Question",
      "name": "技師到府檢查冷氣不冷一般會做哪些項目？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "我們會進行系統性的查檢，包含出風口溫差量測、壓縮機運轉電流測量、冷媒高低壓壓力檢測、控制訊號線與基板診斷，並觀察鰭片髒污程度，依現場狀況與檢測數據向您說明最合適的處理方式。"
      }
    }
  ]
};

export default function AcNotColdGuidePage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={articleSchema} />
      <JsonLd schema={faqSchema} />
      <AcNotColdClient />
    </>
  );
}
