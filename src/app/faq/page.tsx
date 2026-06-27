import React from "react";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import FaqClient from "./FaqClient";

const pageTitle = "常見問題解答 FAQ｜冷氣安裝維修清洗與商用空調規劃 - 焓耀空調";
const pageDescription = "為您整理家用及商用空調的常見疑問，包括到府估價流程、冷氣漏水滴水原因、冷房效果差排查、定期清洗清洗頻率與高雄屏東服務區域說明。我們先精密檢測再報價。";
const canonicalUrl = "https://www.xusen.pro/faq/";

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
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "冷氣安裝費用為什麼需要看現場？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "因為每位客戶的安裝環境皆不相同：銅管配置的實際長度、室外機安裝位置的危險程度（是否需要吊車或高空作業）、排水孔與電源配置等都會直接影響材料與工時。實地看過現場能保證提供精準報價，避免因粗估而導致糾紛。"
      }
    },
    {
      "@type": "Question",
      "name": "可以先 LINE 傳照片估價嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "可以！非常歡迎您將現場空間照片、預留冷氣孔位置、格局平面圖、機器規格銘牌照等透過 LINE 傳送給我們。我們的技師可以在線上做初步的機型噸數建議與估價範圍，之後再約時間到府做最後的實地確認。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣不冷一定是冷媒不足嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "不一定。冷氣不冷最常見的原因是防塵網或熱交換鰭片卡滿髒污導致風量受阻。其他原因還包括：啟動電容故障使壓縮機無法運轉、控制基板損壞、或是管路微漏冷媒。我們技師會到現場使用專用儀器進行電流與壓力精密檢測，找出真正故障點後再提供建議。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣滴水通常是什麼原因？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "室內機滴水最常見的原因是排水盤淤積了灰塵、黴菌與果凍狀黏膜，導致排水孔完全堵塞；其次可能是排水管倾斜度不足、保溫棉破損產生冷凝水，或是冷媒不足導致蒸發器結霜。這需要由專業師傅使用高壓沖洗槍與疏通藥劑處理。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣清洗多久做一次？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "一般家用冷氣建議 1 至 2 年定期清洗一次。若是家中有過敏體質成員、養寵物，或是冷氣安裝在廚房周邊易吸入油煙，則建議每年定期清洗。商用辦公大樓或營業場所（如餐廳、診所）因運轉時間長，建議每半年至一年清洗保養一次，以維持能效。"
      }
    },
    {
      "@type": "Question",
      "name": "冷氣有霉味需要清洗嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "是的。當冷氣吹出酸臭霉味時，代表內部鰭片、風輪與排水盤已經滋生了大量黴菌與灰塵。這不僅會阻礙熱交換效率、使風量變小，還會將黴菌孢子吹散至空氣中影響家人健康，必須進行深層高壓清洗以徹底抗菌除臭。"
      }
    },
    {
      "@type": "Question",
      "name": "商用空調工程為什麼要先場勘？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "商用空調工程需先了解現場條件，不建議只用電話直接報價。商用工程牽涉到空間熱負荷噸數計算、冷媒與冰水管路架設路徑、配電盤容量安全係數，以及與天花板消防風管的避讓衝突。實地場勘能幫企業精準規劃管線動線，避免現場施工與原定方案不合而延誤工期。"
      }
    },
    {
      "@type": "Question",
      "name": "高雄和屏東都有服務嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "有的。我們主要服務範圍包括高雄全區（鳳山、左營、三民、鼓山、苓雅等）與屏東全區（屏東市、潮州、萬丹、長治、內埔等）。備有專業工程車與技師團隊，到府估價與施作均依排程與狀況儘速為您安排。"
      }
    },
    {
      "@type": "Question",
      "name": "表單送出後如何聯繫？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "收到您的線上預約估價或故障填單後，我們的技師會優先查閱您描述的空調需求或 LINE 傳送的現場照片，並以電話或簡訊與您聯繫，約定方便的到府時間。現場檢查分析故障點後，會先列出明細報價，經您同意後再行施工。"
      }
    }
  ]
};

export default function FAQPage() {
  return (
    <>
      <JsonLd schema={pageSchema} />
      <FaqClient />
    </>
  );
}
