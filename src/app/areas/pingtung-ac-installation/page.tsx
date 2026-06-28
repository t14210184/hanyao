import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PingtungAcInstallationClient from "./PingtungAcInstallationClient";

const pageTitle = "屏東冷氣安裝估價｜新屋、舊換新、分離式與吊隱式規劃 - 焓耀空調";
const pageDescription = "屏東在地冷氣安裝估價服務。提供新屋裝潢冷氣配管、變頻冷氣舊換新、分離式與天花板吊隱式冷氣現場規畫。服務區域包含屏東市、潮州、萬丹、長治、內埔、竹田、麟洛。";
const canonicalUrl = "https://www.xusen.pro/areas/pingtung-ac-installation/";

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

const webpageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "屏東冷氣安裝估價",
  "description": pageDescription,
  "url": canonicalUrl
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "屏東冷氣安裝如何選擇合適的噸數？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "冷氣噸數選擇通常與房間坪數、西曬狀況、挑高程度、頂樓或鐵皮屋頂等環境條件有關，仍需依現場格局、安裝位置與使用需求評估。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣室外機安裝在頂樓或陽光直射處需要注意什麼？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "高溫或日曬環境可能影響室外機周邊散熱條件。安裝位置需依現場通風、日曬、牆面固定與施工安全評估；若需要遮蔽，也應避免影響室外機出風與維修空間。"
      }
    },
    {
      "@type": "Question",
      "name": "屏東冷氣安裝如何安排預約？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "屏東地區冷氣安裝會依案件類型、服務位置、現場條件與當期派工狀況進行排程溝通，實際安排仍以雙方確認為準。"
      }
    }
  ]
};

export default function PingtungAcInstallationPage() {
  return (
    <>
      <JsonLd schema={webpageSchema} />
      <JsonLd schema={faqSchema} />
      <PingtungAcInstallationClient />
    </>
  );
}
