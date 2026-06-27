import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import CasesClient from "./CasesClient";

const pageTitle = "工程實績與案例方向｜舊網站公開資料整理 - 焓耀空調";
const pageDescription = "焓耀空調工程提供高雄與屏東商用及家用空調實績案例方向，包含第一銀行、精密工業、化學工廠空調規劃、農科大廠、六吋盤早午餐與冰水主機拆組。實地到府場勘提供解決方案。";
const canonicalUrl = "https://www.xusen.pro/cases/";

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
  "name": "工程實績與案例方向",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function CasesPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <CasesClient />
    </>
  );
}
