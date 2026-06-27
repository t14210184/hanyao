import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import ErvClient from "./ErvClient";

const pageTitle = "全熱交換器規劃｜室內換氣、空氣流通與空調效率整合評估 - 焓耀空調";
const pageDescription = "高雄與屏東專業全熱交換器規劃。針對新屋裝潢提供通風換氣管線配置、氣流平衡及冷力節能整合。適合緊閉窗戶防灰塵、防噪音及辦公空間，依現場條件評估施作。";
const canonicalUrl = "https://www.xusen.pro/services/erv/";

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
  "name": "全熱交換器規劃服務",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function EnergyRecoveryVentilatorServicePage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <ErvClient />
    </>
  );
}
