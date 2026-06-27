import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcRelocationClient from "./AcRelocationClient";

const pageTitle = "冷氣移機服務｜搬家、裝潢、重新配置冷氣位置先評估 - 焓耀空調";
const pageDescription = "高雄與屏東專業冷氣移機服務。提供搬家裝潢拆機、新安裝位置冷房與電力評估、舊冷媒銅管與架子能否沿用檢測，降低移機故障風險。無固定報價，依現場與機況評估施作。";
const canonicalUrl = "https://www.xusen.pro/services/ac-relocation/";

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
  "name": "冷氣移機服務",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function AcRelocationServicePage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <AcRelocationClient />
    </>
  );
}
