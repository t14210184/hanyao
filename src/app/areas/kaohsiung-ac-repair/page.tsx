import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import KaohsiungAcRepairClient from "./KaohsiungAcRepairClient";

const pageTitle = "高雄冷氣維修檢修｜冷氣不冷、滴水、漏水、異音排查 - 焓耀空調";
const pageDescription = "高雄地區專業冷氣維修與故障檢修服務。針對分離式冷氣與吊隱式冷氣不冷、滴水漏水、異常震動噪音與漏冷媒進行精密查檢，我們先報價後施作，將依實際派工狀況規劃排定。";
const canonicalUrl = "https://www.xusen.pro/areas/kaohsiung-ac-repair/";

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
  "name": "高雄冷氣維修檢修",
  "description": pageDescription,
  "url": canonicalUrl
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "高雄冷氣不冷一定是冷媒不足嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "不一定。冷氣不冷可能與濾網、蒸發器、室外機周邊散熱條件、管線、冷媒系統、感溫或電控狀況有關，仍需依現場檢查結果判斷。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣漏水可以先自己處理嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "可以先確認濾網是否髒污、室內機周邊是否有明顯滴水位置，並拍照提供初步判斷。若涉及拆機、排水管內部、電路、冷媒系統或高處室外機，建議由技師現場檢查。"
      }
    },
    {
      "@type": "Question",
      "name": "高雄冷氣維修排程如何確認？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "高雄地區維修會依案件類型、服務位置、現場條件與當期派工狀況進行排程溝通，實際安排仍以雙方確認為準。"
      }
    }
  ]
};

export default function KaohsiungAcRepairPage() {
  return (
    <>
      <JsonLd schema={webpageSchema} />
      <JsonLd schema={faqSchema} />
      <KaohsiungAcRepairClient />
    </>
  );
}
