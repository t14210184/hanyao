import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcInstallationCostFactorsClient from "./AcInstallationCostFactorsClient";

const pageTitle = "冷氣安裝費用怎麼估？影響報價的 6 個現場條件 - 焓耀空調";
const pageDescription = "冷氣安裝估價為什麼不建議電話直接報價？空調工程師為您分析影響安裝費用的 6 個現場條件，包括坪數、銅管長度、散熱位置、用電安全。歡迎 LINE 傳平面圖進行評估。";
const canonicalUrl = "https://www.xusen.pro/guides/ac-installation-cost-factors/";

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
      "name": "冷氣安裝費用影響條件指南",
      "item": canonicalUrl
    }
  ]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "冷氣安裝費用怎麼估？影響報價的 6 個現場條件",
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
      "name": "冷氣安裝為什麼不提供電話直接估價？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "因為每戶住家的梁柱結構、配電盤位置、室外機吊掛的危險程度（是否需要吊車或高空雙鉤作業）以及銅管所需的長度皆不相同。為了保證施工用電安規與日後不漏水，我們堅持依現場條件與實際需求進行量測評估，絕不以電話直接開死價，防止施作時產生後續糾紛。"
      }
    },
    {
      "@type": "Question",
      "name": "裝潢前，為什麼要先找空調技師場勘？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "因為冷媒配管與冷凝水排水坡度必須隱藏在木工吊頂天花板內。在木工進場前預先到場放樣配置管線、預留維修孔位置，能與裝潢設計師流暢套圖，避免完工後冷氣滴水或氣流死角而無法修改天花板。"
      }
    },
    {
      "@type": "Question",
      "name": "可以先在 LINE 上進行初步的估價諮詢嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "可以。您可以先提供室內格局平面圖、安裝房間的實際照片、以及預計擺放室外機的陽台或外牆照片。我們的技師可以在官方 LINE 上為您進行線上初步判斷與機型配置建議，隨後再安排排程到府進行最終實地確認。"
      }
    }
  ]
};

export default function AcInstallationCostFactorsGuidePage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={articleSchema} />
      <JsonLd schema={faqSchema} />
      <AcInstallationCostFactorsClient />
    </>
  );
}
