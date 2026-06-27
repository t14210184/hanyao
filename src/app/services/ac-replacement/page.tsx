import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcReplacementClient from "./AcReplacementClient";

const pageTitle = "冷氣舊換新安裝｜評估坪數、管線、排水與室外機散熱 - 焓耀空調";
const pageDescription = "提供高雄與屏東家用冷氣舊換新專業安裝與評估服務。拆除舊機、評估既有冷媒銅管是否沿用、排水斜度與室外機通風散熱空間精算，持證技師團隊，透明報價。";
const canonicalUrl = "https://www.xusen.pro/services/ac-replacement/";

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
  "name": "冷氣舊換新安裝與評估",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function AcReplacementPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <AcReplacementClient />
    </>
  );
}
