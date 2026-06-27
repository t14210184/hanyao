import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import ContactClient from "./ContactClient";

const pageTitle = "聯絡焓耀空調｜免費到府估價與空調維修預約";
const pageDescription = "焓耀空調工程提供高雄、屏東地區冷氣安裝估價、舊換新規劃、故障檢修與冷氣高壓清洗保養。歡迎填表、打電話或 LINE 傳現場照片，我們將依現場狀況與排程進行評估安排。";
const canonicalUrl = "https://www.xusen.pro/contact/";

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
  "@type": "ContactPage",
  "name": "聯絡焓耀空調",
  "description": pageDescription,
  "url": canonicalUrl
};

export default function ContactPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <ContactClient />
    </>
  );
}
