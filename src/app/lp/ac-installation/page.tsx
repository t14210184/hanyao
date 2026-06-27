import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcInstallationLpClient from "./AcInstallationLpClient";

const pageTitle = "高雄 / 屏東冷氣安裝估價｜新屋、舊換新、分離式與吊隱式規劃 - 焓耀空調";
const pageDescription = "提供高雄與屏東專業冷氣安裝及空調舊換新服務。針對分離式冷氣、吊隱式冷氣等提供精準管線配置、散熱排水規劃及透明報價，持證技師施工，品質保證。";
const canonicalUrl = "https://www.xusen.pro/lp/ac-installation/";

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
  "name": "高雄 / 屏東冷氣安裝估價",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function AcInstallationLP() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <AcInstallationLpClient />
    </>
  );
}
