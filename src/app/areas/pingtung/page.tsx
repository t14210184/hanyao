import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PingtungAreaClient from "./PingtungAreaClient";

const pageTitle = "屏東冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃 - 焓耀空調";
const pageDescription = "提供屏東在地冷氣空調服務，包括冷氣安裝、舊換新、空調漏水維修、高壓清洗保養與商用多聯 VRV 系統規劃。服務範圍覆蓋屏東市、潮州、萬丹、長治、內埔等地區。";
const canonicalUrl = "https://www.xusen.pro/areas/pingtung/";

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
    type: "website",
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "屏東冷氣空調服務",
  "description": pageDescription,
  "url": canonicalUrl
};

const localSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "name": "焓耀空調工程有限公司 - 屏東總部",
  "telephone": "+886-931940133",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "建南路106號",
    "addressLocality": "屏東市",
    "addressRegion": "屏東縣",
    "postalCode": "900",
    "addressCountry": "TW"
  },
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "屏東縣"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "屏東太陽大且高溫，冷氣室外機需要安裝遮雨棚嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "如果室外機安裝在陽光強烈直射的屋頂或外牆，加裝冷氣遮陽棚是遮擋直射光照的方式之一，能對室外機提供物理遮蔽。但遮陽棚安裝必須穩固，且不能阻擋室外機前方風扇的出風散熱空間，避免反而造成熱風迴流跳機。"
      }
    },
    {
      "@type": "Question",
      "name": "沿海地區的冷氣室外機，生鏽了該怎麼處理？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "在海風鹽分較重的區域，室外機鰭片可能受到環境鹽分影響。如果只是輕微狀況，定期安排沖洗是防範積鹽的日常維護措施之一；若是鏽蝕嚴重導致散熱鰭片粉碎損壞或冷媒外漏，則應由技師到府查檢評估，判定是否需進行零件更換或採取其他適當的保護措施。"
      }
    },
    {
      "@type": "Question",
      "name": "屏東地區預約冷氣安裝或清洗，排程與預約流程為何？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "我們提供屏東地區到府服務，均採派工到府行動服務（無對外開放實體門市）。預約到府場勘或施作，將由客服與您聯繫並依實際派工狀況規劃排定，受理需求後再依序進行排程溝通。"
      }
    }
  ]
};

export default function PingtungAreaPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={localSchema} />
      <JsonLd schema={faqSchema} />
      <PingtungAreaClient />
    </>
  );
}
