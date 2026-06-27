import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AboutClient from "./AboutClient";

const pageTitle = "關於焓耀空調｜公司資格憑證與冷凍空調技術士團隊";
const pageDescription = "焓耀空調工程有限公司為政府登記合規之冷凍空調工程業（丙等，統一編號：90234660）。我們是台灣區冷凍空調工程工業同業公會會員，旗下技師持有國家乙級冷凍空調裝修技術士證照。";
const canonicalUrl = "https://www.xusen.pro/about/";

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
  "name": "關於焓耀空調 - 資格憑證與證照",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function AboutPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <AboutClient />
    </>
  );
}
