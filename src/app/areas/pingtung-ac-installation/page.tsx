import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PingtungAcInstallationClient from "./PingtungAcInstallationClient";

const pageTitle = "屏東冷氣安裝估價｜新屋、舊換新、分離式與吊隱式規劃 - 焓耀空調";
const pageDescription = "屏東在地冷氣安裝估價服務。提供新屋裝潢冷氣配管、變頻冷氣舊換新、分離式與天花板吊隱式冷氣現場規畫。服務區域包含屏東市、潮州、萬丹、長治、內埔、竹田、麟洛。";
const canonicalUrl = "https://www.xusen.pro/areas/pingtung-ac-installation/";

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
  "name": "屏東冷氣安裝估價",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function PingtungAcInstallationPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <PingtungAcInstallationClient />
    </>
  );
}
