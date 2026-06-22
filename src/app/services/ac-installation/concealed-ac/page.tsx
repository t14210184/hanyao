import React from "react";
import { Metadata } from "next";
import { subpagesData } from "../subpageData";
import AcInstallationSubpageTemplate from "../AcInstallationSubpageTemplate";

const slug = "concealed-ac";
const data = subpagesData[slug];

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  alternates: {
    canonical: data.canonicalUrl,
  },
  openGraph: {
    title: data.ogTitle,
    description: data.ogDescription,
    url: data.canonicalUrl,
    type: "website",
    siteName: "焓耀空調工程",
    locale: "zh_TW",
  },
};

export default function ConcealedAcPage() {
  return <AcInstallationSubpageTemplate data={data} />;
}
