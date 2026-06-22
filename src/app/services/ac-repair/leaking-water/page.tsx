import React from "react";
import { Metadata } from "next";
import { subpagesData } from "../subpageData";
import AcRepairSubpageTemplate from "../AcRepairSubpageTemplate";

const slug = "leaking-water";
const data = subpagesData[slug];

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  alternates: {
    canonical: data.canonicalUrl,
  },
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.canonicalUrl,
    type: "website",
    siteName: "焓耀空調工程",
    locale: "zh_TW",
  },
};

export default function LeakingWaterPage() {
  return <AcRepairSubpageTemplate data={data} />;
}
