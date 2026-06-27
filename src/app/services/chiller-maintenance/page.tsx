import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import ChillerMaintenanceClient from "./ChillerMaintenanceClient";

const pageTitle = "冰水主機 / 中央空調維修保養｜商用空調維護合約 - 焓耀空調";
const pageDescription = "高雄與屏東商用空調系統維修保養服務。提供氣冷與水冷式冰水主機通管清洗、年度維護合約巡檢、冷凍油更換與商用冷氣保養。持照空調技師團隊，到府評估報價。";
const canonicalUrl = "https://www.xusen.pro/services/chiller-maintenance/";

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
  "name": "冰水主機與中央空調維修保養",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function ChillerMaintenancePage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <ChillerMaintenanceClient />
    </>
  );
}
