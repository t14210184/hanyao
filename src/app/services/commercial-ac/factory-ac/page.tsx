import React from "react";
import { Metadata } from "next";
import { commercialSubpagesData } from "../subpageData";
import CommercialAcSubpageTemplate from "../CommercialAcSubpageTemplate";

const slug = "factory-ac";
const data = commercialSubpagesData[slug];

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  alternates: {
    canonical: data.canonical,
  },
  openGraph: {
    title: data.ogTitle,
    description: data.ogDescription,
    url: data.canonical,
    type: "website",
  },
};

export default function FactoryAcPage() {
  return <CommercialAcSubpageTemplate data={data} />;
}
