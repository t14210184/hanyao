import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import CommercialAcLpClient from "./CommercialAcLpClient";

const pageTitle = "焓耀空調工程｜高雄 / 屏東商用空調工程、中央空調與冰水主機維修保養";
const pageDescription = "焓耀空調工程提供高雄 / 屏東商用空調工程、中央空調、冰水主機、VRV 多聯式空調、商用空調保養與年度維護合約。可 LINE 傳平面圖與設備照片，初步判斷後安排場勘。";
const canonicalUrl = "https://www.xusen.pro/lp/commercial-ac/";

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
  "name": "高雄 / 屏東商用空調工程",
  "description": pageDescription,
  "url": canonicalUrl
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "商用空調工程",
  "provider": {
    "@type": "HVACBusiness",
    "name": "焓耀空調工程有限公司"
  },
  "areaServed": [
    {
      "@type": "AdministrativeArea",
      "name": "高雄市"
    },
    {
      "@type": "AdministrativeArea",
      "name": "屏東縣"
    }
  ],
  "description": "中央空調、冰水主機、VRV 多聯式系統規劃設計與年度巡檢維護合約服務。"
};

export default function CommercialAcLP() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={serviceSchema} />
      <CommercialAcLpClient />
    </>
  );
}
