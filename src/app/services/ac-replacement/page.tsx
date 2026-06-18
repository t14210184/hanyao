"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function AcReplacementPage() {
  const pageTitle = "冷氣舊換新安裝｜評估坪數、管線、排水與室外機散熱 - 焓耀空調";
  const pageDescription = "提供高雄與屏東家用冷氣舊換新專業安裝與評估服務。拆除舊機、評估既有冷媒銅管是否沿用、排水斜度與室外機通風散熱空間精算，持證技師團隊，透明報價。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "冷氣舊換新安裝與評估",
    "description": pageDescription,
    "url": "https://www.xusen.pro/services/ac-replacement/"
  };

  const steps = [
    {
      title: "1. 舊機拆除與安全冷媒回收",
      description: "在拆除舊冷氣前，我們會先進行安全冷媒回收，防止冷媒外洩污染大氣；並對室內裝潢與家具進行防塵防割傷保護，確保拆卸過程安全無損。"
    },
    {
      title: "2. 既有冷媒銅管評估是否沿用",
      description: "舊換新不一定要拆除裝潢重新牽管。若舊銅管規格相符、無折損且氣密性良好，可評估經管路清洗、去除酸性冷凍油後沿用，為您節省可觀的二次裝潢木作工程費用。"
    },
    {
      title: "3. 排水與室外機通風散熱空間",
      description: "新一代環保冷媒主機對散熱與通風要求更高。我們會嚴格評估室外機安裝空間是否通暢，防範因散熱不良導致能效衰退；同時複查排水管斜度，杜絕室內機滴水漏水隱患。"
    },
    {
      title: "4. 新機容量坪數熱負荷評估",
      description: "並非直接照舊機噸數採購。我們會重新精算現場坪數、西曬折射熱、挑高高度與頂樓熱源，為您推薦最省電、冷房效果最均勻的變頻冷氣噸數規模。"
    },
    {
      title: "5. 施工品質細節與售後維護",
      description: "標準施工程序包括抽真空乾燥處理、冷媒加壓洩漏測試、電源線路安全負載配置，完工後提供完整的維護說明與售後專屬保固單據。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/services/ac-replacement/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Replacement Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              家用空調升級
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight">
              冷氣舊換新安裝｜先評估坪數、管線、排水與室外機位置
            </h1>
            <p className="text-sm text-slate-405 mt-4 leading-relaxed max-w-2xl mx-auto">
              舊冷氣耗電、常漏水或故障頻繁？舊換新涉及管路清洗與散熱空間評估。我們提供一條龍安全拆裝服務，到府現場場勘後提供明細報價。
            </p>
          </div>
        </section>

        {/* Process Details */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-white">冷氣舊換新評估五大核心項目</h2>
                <p className="text-xs text-slate-400 mt-2">魔鬼藏在細節裡，合規的標準施工程式決定了新冷氣的壽命與省電表現。</p>
              </div>

              <div className="space-y-8">
                {steps.map((step, idx) => (
                  <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 sm:p-8 rounded-2xl flex gap-6 hover:border-slate-800 transition-colors">
                    <div className="w-10 h-10 bg-sky-950 border border-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm">
                      0{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* LINE callout */}
              <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-3xl text-center space-y-4">
                <h3 className="text-lg font-bold text-white">可先 LINE 傳舊機照片做初步判斷</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                  您可以將舊冷氣安裝位置的照片、室外機放置空間照、天花板維修孔照片，以及舊機身上的「規格銘牌照片」透過 LINE 傳送給我們。技師將線上為您做初步機型適配與報價範圍概算。
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-2">
                  <CTAButton
                    href={siteConfig.phone1Link}
                    trackEventName="phone_click"
                    trackParams={{ service_type: "ac-installation", cta_position: "replacement_page" }}
                    className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                  >
                    <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>撥打電話討論</span>
                  </CTAButton>
                  
                  <CTAButton
                    href={siteConfig.lineUrl}
                    external
                    trackEventName="line_click"
                    trackParams={{ service_type: "ac-installation", cta_position: "replacement_page" }}
                    className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>LINE 傳舊機照片</span>
                  </CTAButton>
                </div>

                <div className="pt-2">
                  <CTAButton
                    href="/contact/"
                    trackEventName="quote_request"
                    trackParams={{ service_type: "ac-installation", cta_position: "replacement_page_booking" }}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-350 transition-colors"
                  >
                    <span>預約到府舊換新場勘 &rarr;</span>
                  </CTAButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac-installation"
          phoneText="撥打專線諮詢"
          lineText="加 LINE 傳照評估"
          onPhoneClick={() => trackEvent("lp_cta_click", { service_type: "ac-installation", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("lp_cta_click", { service_type: "ac-installation", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
