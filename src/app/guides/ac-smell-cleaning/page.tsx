import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AcSmellCleaningClient from "./AcSmellCleaningClient";

const pageTitle = "冷氣有霉味、風量變小怎麼辦？高雄屏東冷氣清洗保養｜焓耀空調工程";
const pageDescription = "冷氣有霉味、風量變小或出風不均，可能與濾網、蒸發器、風鼓髒污或排水環境有關。焓耀空調工程提供高雄、屏東冷氣清洗保養，可先 LINE 傳照片與台數初步判斷。";
const canonicalUrl = "https://www.xusen.pro/guides/ac-smell-cleaning/";

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
    type: "article",
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": pageTitle,
  "description": pageDescription,
  "url": canonicalUrl
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首頁",
      "item": "https://www.xusen.pro/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "服務指南",
      "item": "https://www.xusen.pro/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "冷氣霉味風量變小清洗指引",
      "item": canonicalUrl
    }
  ]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "冷氣有霉味、風量變小怎麼辦？清洗保養前先確認這幾件事",
  "description": pageDescription,
  "url": canonicalUrl,
  "author": {
    "@type": "Organization",
    "name": "焓耀空調工程有限公司"
  },
  "publisher": {
    "@type": "Organization",
    "name": "焓耀空調工程有限公司"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "冷氣有霉味一定需要清洗嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "不一定。若只是防塵濾網上有灰塵，自行清洗濾網即可改善；但若異味來自蒸發器內部鰭片、深處的水盤或風鼓（鼓風輪）上的黴菌與果凍狀生物膜，則需要專業人員使用高壓清洗機搭配環保中性藥劑進行深層清洗才能改善。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣風量變小一定是髒污嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "不一定。最常見的原因是風鼓與濾網卡滿灰塵與棉絮，阻擋了出風氣流，清洗後通常可恢復風速。但也有可能是室內風扇馬達軸承磨損導致轉速變慢、啟動電容老化衰退、或是控制基板訊號故障，需要到府進行現場診斷。"
      }
    },
    {
      "@type": "Question",
      "name": "可以只清室內機嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "可以。室內機是主要的冷風出口與熱交換器，冷氣發霉、有霉味、粉塵飛散或滴水問題大都與室內機有關。若預算有限，可優先清洗室內機；但若室外機鰭片堆積大量塵土落葉影響散熱，仍建議一併施作。"
      }
    },
    {
      "@type": "Question",
      "name": "室外機也需要清洗嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "需要。室外機長期置於室外，冷凝鰭片容易累積塵垢、寵物毛髮或落葉。當散熱鰭片被嚴重堵塞時，主機散熱不良會使壓縮機高溫過載而跳機，同時提高耗電量。清洗室外機有助於恢復散熱效率，維護冷氣原有節電能效，並有助於降低主機超載運轉風險。"
      }
    },
    {
      "@type": "Question",
      "name": "清洗和維修怎麼判斷？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "若冷氣運轉功能正常且有冷風，但伴隨霉味、出風量變小或出風口滴水，通常只需進行「清洗保養」。若冷氣完全無法啟動、電源燈閃爍報錯誤代碼、只吹送風（壓縮機沒動，完全無冷度）、或機器運作時發出金屬撞擊等劇烈噪音，則屬於「維修檢修」範圍。"
      }
    },
    {
      "@type": "Question",
      "name": "可以先 LINE 傳照片確認嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "可以。建議將室內機的正面外觀、掀開面板後的濾網狀況、出風口內部鰭片或風鼓的特寫照片，以及室外機的安裝環境拍照上傳至我們的官方 LINE，技師可協助進行初步的機型確認與施作評估。"
      }
    }
  ]
};

export default function AcSmellCleaningGuidePage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={articleSchema} />
      <JsonLd schema={faqSchema} />
      <AcSmellCleaningClient />
    </>
  );
}
