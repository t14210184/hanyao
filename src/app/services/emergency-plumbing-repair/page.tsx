import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import EmergencyPlumbingRepairClient from "./EmergencyPlumbingRepairClient";

const pageTitle = "高雄屏東24小時緊急水電維修｜跳電查修、水管破裂、堵塞疏通｜焓耀空調工程";
const pageDescription = "焓耀空調工程提供高雄、屏東緊急水電搶修服務。專業檢測跳電異常、漏電跳脫、水管爆裂漏水、馬桶水管堵塞疏通。基本出工費透明，確認施工全額折抵。歡迎 24H LINE 或電話叫修。";
const canonicalUrl = "https://www.xusen.pro/services/emergency-plumbing-repair/";

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
    id: "faq-ep-1",
    question: "半夜叫修水電，師傅真的會來嗎？夜間有加成費用嗎？",
    answer: "我們提供 24 小時服務，高雄屏東市區緊急叫修，師傅 30 分鐘內確認出勤。夜間（22:00–06:00）加收緊急服務費 NT$500–1,000，到場後現場告知，雙方同意後才施作，絕不事後追加。"
  },
  {
    id: "faq-ep-2",
    question: "師傅到場檢測後，如果我不想修，基本出工費還是要付嗎？",
    answer: "是的，基本出工費（NT$300–500）為到場檢測費用，若您決定不施作，需支付此費用。若當場確認施作，這筆費用將全額折抵維修工資，不會重複計費。"
  },
  {
    id: "faq-ep-3",
    question: "水管爆裂師傅來之前，我自己能做什麼應急措施？",
    answer: "請立即找到家中的自來水總閥（通常在廚房流理台下方或公共管道間）並將其關閉，可防止繼續漏水損壞地板牆面。關閉後請立即 LINE 或電話聯繫我們，告知地址與狀況。"
  },
  {
    id: "faq-ep-4",
    question: "加壓馬達一直轉不停是壞了嗎？",
    answer: "不一定是馬達本身損壞。可先試著將馬達端水閥關閉，若馬達立刻停止，代表室內管路存在漏水；若仍持續運轉，代表馬達壓力開開或控制盤故障。建議聯繫我們到場精確診斷。"
  },
  {
    id: "faq-ep-5",
    question: "跳電查修後找不到原因，也要收費嗎？",
    answer: "若師傅在合理檢測範圍內確實無法判定跳電原因，我們將如實告知並說明後續方向，費用部分依現場溝通後決定。我們的原則是：透明告知、同意後才收費。"
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
      "name": "緊急水電維修",
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
    "緊急水電維修",
    "跳電查修",
    "水管破裂搶修",
    "馬桶堵塞疏通"
  ]
};

// Service Schema
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "EmergencyPlumbingRepair",
  "name": "緊急水電維修與故障排除",
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
  "description": "提供高雄、屏東 24 小時緊急水電搶修，包含跳電查修、水管破裂封管、馬桶堵塞疏通、加壓馬達故障排除。"
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

export default function EmergencyPlumbingRepairPage() {
  return (
    <>
      {/* JSON-LD Schemas — 由 Server Component 輸出 */}
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={businessSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      {/* 互動式 Client Component */}
      <EmergencyPlumbingRepairClient />
    </>
  );
}
