"use client";

import React, { useState } from "react";
import { siteConfig } from "@/data/site";
import CTAButton from "@/components/CTAButton";
import FinalCTA from "@/components/FinalCTA";

const faqData = [
  {
    category: "冷氣安裝",
    items: [
      {
        q: "冷氣安裝費用為什麼需要看現場？",
        a: "因為每位客戶的安裝環境皆不相同：銅管配置的實際長度、室外機安裝位置的危險程度（是否需要吊車或高空作業）、排水孔與電源配置等都會直接影響材料與工時。實地看過現場能保證提供精準報價，避免因粗估而導致糾紛。"
      },
      {
        q: "可以先 LINE 傳照片估價嗎？",
        a: "可以！非常歡迎您將現場空間照片、預留冷氣孔位置、格局平面圖、機器規格銘牌照等透過 LINE 傳送給我們。我們的技師可以在線上做初步的機型噸數建議與估價範圍，之後再約時間到府做最後的實地確認。"
      }
    ]
  },
  {
    category: "冷氣維修",
    items: [
      {
        q: "冷氣不冷一定是冷媒不足嗎？",
        a: "不一定。冷氣不冷最常見的原因是防塵網或熱交換鰭片卡滿髒污導致風量受阻。其他原因還包括：啟動電容故障使壓縮機無法運轉、控制基板損壞、或是管路微漏冷媒。我們技師會到現場使用專用儀器進行電流與壓力精密檢測，找出真正故障點後再提供建議。"
      },
      {
        q: "冷氣滴水通常是什麼原因？",
        a: "室內機滴水最常見的原因是排水盤淤積了灰塵、黴菌與果凍狀黏膜，導致排水孔完全堵塞；其次可能是排水管倾斜度不足、保溫棉破損產生冷凝水，或是冷媒不足導致蒸發器結霜。這需要由專業師傅使用高壓沖洗槍與疏通藥劑處理。"
      }
    ]
  },
  {
    category: "冷氣清洗",
    items: [
      {
        q: "冷氣清洗多久做一次？",
        a: "一般家用冷氣建議 1 至 2 年定期清洗一次。若是家中有過敏體質成員、養寵物，或是冷氣安裝在廚房周邊易吸入油煙，則建議每年定期清洗。商用辦公大樓或營業場所（如餐廳、診所）因運轉時間長，建議每半年至一年清洗保養一次，以維持能效。"
      },
      {
        q: "冷氣有霉味需要清洗嗎？",
        a: "是的。當冷氣吹出酸臭霉味時，代表內部鰭片、風輪與排水盤已經滋生了大量黴菌與灰塵。這不僅會阻礙熱交換效率、使風量變小，還會將黴菌孢子吹散至空氣中影響家人健康，必須進行深層高壓清洗以徹底抗菌除臭。"
      }
    ]
  },
  {
    category: "商用空調",
    items: [
      {
        q: "商用空調工程為什麼要先場勘？",
        a: "商用空調工程需先了解現場條件，不建議只用電話直接報價。商用工程牽涉到空間熱負荷噸數計算、冷媒與冰水管路架設路徑、配電盤容量安全係數，以及與天花板消防風管的避讓衝突。實地場勘能幫企業精準規劃管線動線，避免現場施工與原定方案不合而延誤工期。"
      }
    ]
  },
  {
    category: "聯絡與估價",
    items: [
      {
        q: "高雄和屏東都有服務嗎？",
        a: "有的。我們主要服務範圍包括高雄全區（鳳山、左營、三民、鼓山、苓雅等）與屏東全區（屏東市、潮州、萬丹、長治、內埔等）。備有專業工程車與技師團隊，到府估價與施作均依排程與狀況儘速為您安排。"
      },
      {
        q: "表單送出後如何聯繫？",
        a: "收到您的線上預約估價或故障填單後，我們的技師會優先查閱您描述的空調需求或 LINE 傳送的現場照片，並以電話或簡訊與您聯繫，約定方便的到府時間。現場檢查分析故障點後，會先列出明細報價，經您同意後再行施工。"
      }
    ]
  }
];

export default function FaqClient() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* FAQ Hero */}
      <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-slate-900/10 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            解答您的疑問
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight">
            常見問題 FAQ
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            我們整理了客戶在冷氣安裝、檢修、清洗及商用規劃中最常遇到的問題。誠實說明，不保證隨叫隨到，所有服務均依排程與現場狀況儘速為您安排。
          </p>
        </div>
      </section>

      {/* FAQ Filter and Content */}
      <section className="py-16 bg-slate-950 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                activeCategory === "all"
                  ? "bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/10"
                  : "bg-slate-900/60 border-slate-800 text-slate-450 hover:text-white hover:border-slate-700"
              }`}
            >
              全部問題
            </button>
            {faqData.map((cat, i) => (
              <button
                key={i}
                onClick={() => setActiveCategory(cat.category)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  activeCategory === cat.category
                    ? "bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/10"
                    : "bg-slate-900/60 border-slate-800 text-slate-450 hover:text-white hover:border-slate-700"
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {faqData
              .filter((cat) => activeCategory === "all" || cat.category === activeCategory)
              .map((cat, catIdx) => (
                <div key={catIdx} className="space-y-4">
                  {activeCategory === "all" && (
                    <h3 className="text-sm font-bold text-sky-400/90 tracking-wider uppercase pl-2 border-l-2 border-sky-550 mb-3">
                      {cat.category}
                    </h3>
                  )}
                  
                  <div className="space-y-4">
                    {cat.items.map((item, itemIdx) => (
                      <div 
                        key={itemIdx}
                        className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                      >
                        <h4 className="text-base font-bold text-white mb-3 flex items-start gap-2.5">
                          <span className="w-5 h-5 bg-sky-950 border border-sky-550/30 text-sky-400 text-xs font-bold rounded-lg flex items-center justify-center shrink-0 mt-0.5">Q</span>
                          <span>{item.q}</span>
                        </h4>
                        <div className="text-sm text-slate-455 leading-relaxed pl-7 flex items-start gap-2.5">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* CTAs */}
          <div className="mt-16 text-center max-w-lg mx-auto space-y-6">
            <h3 className="text-lg font-bold text-white">仍有其他冷氣空調疑問？</h3>
            <p className="text-xs sm:text-sm text-slate-450 leading-relaxed">
              您可以隨時撥打電話與我們聯繫，或加官方 LINE 直接傳送您的冷氣狀況與現場照片，我們將優先為您進行線上評估與排程諮詢。
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
              <CTAButton
                href={siteConfig.phone1Link}
                trackEventName="phone_click"
                trackParams={{ service_type: "faq_general", cta_position: "faq_page" }}
                className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>撥打電話諮詢</span>
              </CTAButton>
              
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "faq_general", cta_position: "faq_page" }}
                className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>加 LINE 線上詢問</span>
              </CTAButton>
            </div>

            <div>
              <CTAButton
                href="/contact/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-350 transition-colors"
              >
                <span>填表預約到府場勘 &rarr;</span>
              </CTAButton>
            </div>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="faq_general"
        phoneText="撥打專線諮詢"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
