import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PingtungAreaClient from "./PingtungAreaClient";

const pageTitle = "屏東冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃 - 焓耀空調";
const pageDescription = "提供屏東在地冷氣空調服務，包括冷氣安裝、舊換新、空調漏水維修、高壓清洗保養與商用多聯 VRV 系統規劃。服務範圍覆蓋屏東市、潮州、萬丹、長治、內埔等地區。";
const canonicalUrl = "https://www.xusen.pro/areas/pingtung/";

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
  "name": "屏東冷氣空調服務",
  "description": pageDescription,
  "url": canonicalUrl
};

const localSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "name": "焓耀空調工程有限公司 - 屏東總部",
  "telephone": "+886-931940133",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "建南路106號",
    "addressLocality": "屏東市",
    "addressRegion": "屏東縣",
    "postalCode": "900",
    "addressCountry": "TW"
  },
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "屏東縣"
  }
};

export default function PingtungAreaPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={localSchema} />
      <PingtungAreaClient />
    </>
  );
}
