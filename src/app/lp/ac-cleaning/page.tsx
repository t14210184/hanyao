import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcCleaningLpClient from "./AcCleaningLpClient";

const pageTitle = "高雄 / 屏東冷氣清洗保養｜霉味、風量變小、髒污堆積快速預約 - 焓耀空調";
const pageDescription = "高雄與屏東專業冷氣清洗保養服務。提供分離式冷氣、吊隱式冷氣深層清洗。高壓沖洗、防霉殺菌、風量與效能檢測，改善霉味及風量變小，省電健康。";
const canonicalUrl = "https://www.xusen.pro/lp/ac-cleaning/";

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
  "name": "高雄 / 屏東冷氣清洗保養",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function AcCleaningLP() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <AcCleaningLpClient />
    </>
  );
}
