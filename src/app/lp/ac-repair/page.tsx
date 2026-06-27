import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcRepairLpClient from "./AcRepairLpClient";

const pageTitle = "高雄 / 屏東冷氣維修檢修｜冷氣不冷、滴水漏水、異音故障快速預約 - 焓耀空調";
const pageDescription = "高雄與屏東地區冷氣維修檢修服務。提供分離式冷氣、吊隱式冷氣不冷、漏水滴水、異常噪音及漏冷媒精準檢測。專業師傅先報價後維修，故障處理透明安心。";
const canonicalUrl = "https://www.xusen.pro/lp/ac-repair/";

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
  "name": "高雄 / 屏東冷氣維修檢修",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function AcRepairLP() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <AcRepairLpClient />
    </>
  );
}
