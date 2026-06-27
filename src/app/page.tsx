import React from "react";
import { Metadata } from "next";
import HomeClient from "./HomeClient";

const pageTitle = "焓耀空調工程｜高雄、屏東冷氣空調工程專精";
const pageDescription = "焓耀空調提供高雄與屏東專業冷氣空調工程服務。項目涵蓋空調冷氣安裝、商用多聯變頻空調規劃、冷氣定期清洗保養、滴水噪音冷媒故障檢修、全熱交換器及冷氣舊換新。合格技師持照施作，透明報價保固無憂。";
const canonicalUrl = "https://www.xusen.pro/";

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

export default function Home() {
  return <HomeClient />;
}
