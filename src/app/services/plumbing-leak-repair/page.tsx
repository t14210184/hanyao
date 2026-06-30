import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import PlumbingLeakRepairClient from "./PlumbingLeakRepairClient";

const pageTitle = "高雄屏東專業水管更換與漏水修繕｜牆面天花板抓漏、冷熱水管汰換｜焓耀空調工程";
const pageDescription = "焓耀空調工程提供高雄、屏東專業漏水修繕與水管更換服務。針對牆面滲水、天花板滴水、水費暴增提供精密抓漏與水管汰換。承諾找不到漏水點不收費，修繕後提供防水保固。歡迎 LINE 傳照片即時評估。";
const canonicalUrl = "https://www.xusen.pro/services/plumbing-leak-repair/";

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
    id: "faq-pl-1",
    question: "漏水師傅來了如果找不到漏水點，還是要收費嗎？",
    answer: "不收費。我們使用聽音棒與熱顯像儀等專業抓漏設備，若在合理檢測範圍內確實無法判定漏水位置，當次出工費用全額免收。"
  },
  {
    id: "faq-pl-2",
    question: "水費突然暴增但家裡看不出哪裡在漏，該怎麼確認？",
    answer: "睡前確認所有用水設備關閉，記下水表讀數，隔天早上再次讀取。若讀數有增加，代表確有暗管漏水。此時請聯繫我們攜帶儀器到場精密檢測，通常 1~2 小時內可鎖定漏水區域。"
  },
  {
    id: "faq-pl-3",
    question: "漏水修好之後有保固嗎？如果又漏怎麼辦？",
    answer: "有，我們提供施工保固 1 年。保固期內若確認為本公司施工區域問題，免費回場處理。"
  },
  {
    id: "faq-pl-4",
    question: "修漏水一定要打牆嗎？會破壞裝潢嗎？",
    answer: "不一定。精密抓漏儀器可縮小開挖範圍，有時局部開孔 10~20 公分即可完成修繕。若必須較大範圍施作，事前告知並書面報價，由您確認後才動工。"
  },
  {
    id: "faq-pl-5",
    question: "樓下鄰居說天花板在滴水，但我家地板看起來是好的，這是我的問題嗎？",
    answer: "不一定，但您的樓板有可能是水的通道。樓層間漏水有時來自上層浴室防水層失效，建議我們到場用熱顯像儀判斷水的來源方向，再決定是否需要樓板防水工程。"
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
      "name": "水管更換與漏水修繕",
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
    "漏水修繕",
    "水管更換",
    "精密抓漏",
    "管路汰換"
  ]
};

// Service Schema
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "PlumbingLeakRepair",
  "name": "水管更換與漏水修繕",
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
  "description": "提供高雄、屏東專業漏水抓漏與水管汰換服務，使用熱顯像儀精密定位，找不到漏水點不收費，施工後提供防水保固。"
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

export default function PlumbingLeakRepairPage() {
  return (
    <>
      {/* JSON-LD Schemas — 由 Server Component 輸出 */}
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={businessSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      {/* 互動式 Client Component */}
      <PlumbingLeakRepairClient />
    </>
  );
}
