import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import KaohsiungAreaClient from "./KaohsiungAreaClient";

const pageTitle = "高雄冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃 - 焓耀空調";
const pageDescription = "提供高雄地區冷氣空調安裝、故障維修、高壓清洗保養、商用中央空調與冰水主機規劃。服務範圍覆蓋鳳山、左營、三民、鼓山、楠梓、前鎮等區，免費到府場勘估價。";
const canonicalUrl = "https://www.xusen.pro/areas/kaohsiung/";

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
  "name": "高雄冷氣空調服務",
  "description": pageDescription,
  "url": canonicalUrl
};

const localSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "name": "焓耀空調工程有限公司 - 高雄服務處",
  "telephone": "+886-931940133",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "高雄市",
    "addressCountry": "TW"
  },
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "高雄市"
  }
};

export default function KaohsiungAreaPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={localSchema} />
      <KaohsiungAreaClient />
    </>
  );
}
