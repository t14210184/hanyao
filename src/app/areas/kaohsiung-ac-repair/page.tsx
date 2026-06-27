import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import KaohsiungAcRepairClient from "./KaohsiungAcRepairClient";

const pageTitle = "高雄冷氣維修檢修｜冷氣不冷、滴水、漏水、異音排查 - 焓耀空調";
const pageDescription = "高雄地區專業冷氣維修與故障檢修服務。針對分離式冷氣與吊隱式冷氣不冷、滴水漏水、異常震動噪音與漏冷媒進行精密查檢，我們先報價後施作，依現場排程儘速為您安排。";
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

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "高雄冷氣維修檢修",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function KaohsiungAcRepairPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <KaohsiungAcRepairClient />
    </>
  );
}
