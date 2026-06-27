import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import CommercialAcServiceClient from "./CommercialAcServiceClient";

const pageTitle = "商用空調工程｜高雄屏東辦公室、店面、廠房、VRF與冰水主機規劃 - 焓耀空調";
const pageDescription = "高雄、屏東商用空調工程。協助評估商辦、餐飲、店面、廠房與大型空間的冷房需求、系統選型、配管風管、室外機配置與後續維護方式。可先提供平面圖、現場照片與使用需求，依現場條件評估適合的商用空調方案。";
const canonicalUrl = "https://www.xusen.pro/services/commercial-ac/";

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
    siteName: siteConfig.brandName,
    locale: "zh_TW",
    type: "website",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "首頁", item: `${siteConfig.domain}/` },
    { "@type": "ListItem", position: 2, name: "服務項目", item: `${siteConfig.domain}/services/` },
    { "@type": "ListItem", position: 3, name: "商用空調工程", item: canonicalUrl },
  ],
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: pageTitle,
  description: pageDescription,
  url: canonicalUrl,
  breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "商用空調工程",
  name: "商用空調工程｜辦公室、店面、廠房、VRF與冰水主機規劃",
  description: pageDescription,
  url: canonicalUrl,
  provider: {
    "@type": "HVACBusiness",
    name: siteConfig.brandName,
    url: siteConfig.domain,
    telephone: siteConfig.phone1,
    address: {
      "@type": "PostalAddress",
      addressLocality: "屏東市",
      addressRegion: "屏東縣",
      addressCountry: "TW",
      streetAddress: siteConfig.companyAddress,
    },
    areaServed: [
      { "@type": "City", name: "高雄市" },
      { "@type": "AdministrativeArea", name: "屏東縣" },
    ],
  },
  areaServed: [
    { "@type": "City", name: "高雄市" },
    { "@type": "AdministrativeArea", name: "屏東縣" },
  ],
};

const faqItems = [
  {
    id: "faq-1",
    question: "商用空調和一般冷氣安裝差在哪？",
    answer: "商用空調通常涉及更大坪數 of 冷房噸數、複雜的室內機分配（如一對多或 VRF 系統）、高用電容量核算、風管規劃與室外機散熱評估。相較於一般家用一對一冷氣，商用工程在施工規範、冷媒管路長度與起重吊掛等安裝條件上，有更多安全防護與系統選型考量。"
  },
  {
    id: "faq-2",
    question: "辦公室適合 VRF 還是分離式？",
    answer: "若辦公室有多個隔間且使用時間不同，VRF/VRV 多聯式系統可獨立分區溫控，有助於減少無人空間的耗電，並簡化配管路徑。若為單一開放式大空間，高靜壓吊隱式分離式冷氣則為性價比較高的選擇。建議提供平面圖，依現場供電容量與格局進行系統評估。"
  },
  {
    id: "faq-3",
    question: "餐飲店面冷氣要注意哪些熱源？",
    answer: "餐飲店面最大的熱源通常來自廚房設備、人員頻繁出入帶來的冷量流失以及玻璃大面造成的日照熱負荷。規劃時需考量前場與後場的氣流方向，避免廚房熱氣逆流。此外，嵌入式主機的排水坡度與封板前的排水灌水測試也極為重要，可協助降低運轉後的滴水風險。"
  },
  {
    id: "faq-4",
    question: "廠房空調一定要用冰水主機嗎？",
    answer: "不一定。若廠區空間挑高大、設備發熱量極高，冰水主機系統（氣冷式或水冷式）是處理大噸數的常見選擇；但若廠房有特定作業區需要降溫，亦可評估大風量氣冷直膨式系統或風管分區送風。建議提供廠區平面配置與設備發熱量，依實際條件說明適合方案。"
  },
  {
    id: "faq-5",
    question: "冰水主機和 VRF 怎麼選？",
    answer: "冰水主機以冰水輸送冷量，冷媒集中於主機端，適合整棟大型建築或需集中管理、冷凍噸數極大的廠區. VRF 系統則以冷媒直接輸送，安裝空間彈性大，適合中型商業大樓或多分區獨立控制需求。兩者需依建築規模、用電配置與吊掛條件進行評估。"
  },
  {
    id: "faq-6",
    question: "可以只做維護保養合約嗎？",
    answer: "可以. 針對既有辦公室或工廠的空調設備，我們提供定期巡檢與保養合約，依約定頻率進行電流、冷媒量測與基本清潔，協助提早發現零件磨損或冷媒慢漏，協助降低設備非計畫性停機的風險。合約內容依設備規模與數量另行評估說明。"
  },
  {
    id: "faq-7",
    question: "高雄屏東哪些地區可詢問？",
    answer: "我們主要服務與可詢問區域包括：高雄市（如三民、左營、楠梓、鼓山、苓雅、前鎮、小港、鳳山、仁武、大寮、岡山、橋頭、路竹、燕巢等各區）及屏東縣（如屏東市、潮州、東港、萬丹、長治、麟洛、內埔、九如、里港、恆春、車城等各鄉鎮），皆可加 LINE 傳照片或平面圖進行初步諮詢。"
  },
  {
    id: "faq-8",
    question: "LINE 詢問要提供哪些資料？",
    answer: "可先 LINE 提供格局平面圖、現場空間照片、使用的冷氣主機銘牌（規格標籤）照片、配電箱現況照片以及特殊需求說明（如特定製程溫濕度控制）。資料越完整，越能協助技師進行初步判斷與系統選型說明，必要時我們也會安排現場確認。"
  }
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function CommercialAcServicePage() {
  return (
    <>
      {/* JSON-LD Schemas — 由 Server Component 輸出 */}
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={pageSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      {/* 互動式 Client Component */}
      <CommercialAcServiceClient />
    </>
  );
}
