import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import KaohsiungAreaClient from "./KaohsiungAreaClient";

const pageTitle = "高雄冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃 - 焓耀空調";
const pageDescription = "提供高雄地區冷氣空調安裝、故障維修、高壓清洗保養、商用中央空調與冰水主機規劃。服務範圍覆蓋鳳山、左營、三民、鼓山、楠梓、前鎮等區，免費到府場勘估價。";
const canonicalUrl = "https://www.xusen.pro/areas/kaohsiung/";

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
  "name": "高雄冷氣空調服務",
  "description": pageDescription,
  "url": canonicalUrl
};

const localSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "name": "焓耀空調工程有限公司 - 高雄服務處",
  "telephone": "+886-931940133",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "高雄市",
    "addressCountry": "TW"
  },
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "高雄市"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "高雄靠近臨海地區，冷氣室外機該如何保養防腐蝕？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "高雄臨海區域空氣鹽分高、環境潮濕，容易導致散熱鰭片生鏽。建議定期安排專業技師到府進行室外機沖洗，清除鰭片表面的鹽分與沙塵積垢，並在安裝時選用防蝕效果佳的白鐵安裝支架，有助於減緩鏽蝕劣化風險。"
      }
    },
    {
      "@type": "Question",
      "name": "為什麼高雄商用中央空調或冰水主機需要定期通管？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "當空調冷卻水系統中的鈣、鎂等礦物質離子濃度累積較高時，冷卻水在塔體運行蒸發過程中容易沉積成水垢，可能影響熱交換效率。因此，商用與中央空調保養時，定期進行通管與專用藥劑循環清洗保養，有助於降低因水垢累積導致熱交換效能衰退的風險。"
      }
    },
    {
      "@type": "Question",
      "name": "大樓外牆冷氣安裝時，會額外收取吊車或危險施工費嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "這需要視現場環境而定。如果室外機吊掛在完全無站立點的外牆、需要技師跨出陽台懸空施作，或現場樓層過高無法配合室內施工，我們會依規定評估是否需要吊車或特殊高空安全防護作業，並在現場估價時清楚列明，雙方同意後才會施作，避免產生後續加價爭議。"
      }
    }
  ]
};

export default function KaohsiungAreaPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={localSchema} />
      <JsonLd schema={faqSchema} />
      <KaohsiungAreaClient />
    </>
  );
}
