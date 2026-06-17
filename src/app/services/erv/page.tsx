"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function EnergyRecoveryVentilatorServicePage() {
  const pageTitle = "全熱交換器規劃｜室內換氣、空氣流通與空調效率整合評估 - 焓耀空調";
  const pageDescription = "高雄與屏東專業全熱交換器規劃。針對新屋裝潢提供通風換氣管線配置、氣流平衡及冷力節能整合。適合緊閉窗戶防灰塵、防噪音及辦公空間，依現場條件評估施作。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "全熱交換器規劃服務",
    "description": pageDescription,
    "url": "https://www.hanyao.com.tw/services/erv/"
  };

  const benefits = [
    {
      title: "改善室內空氣悶熱不流通",
      description: "在緊閉門窗吹冷氣的環境下，人體呼吸會使二氧化碳濃度逐小時增高，進而產生昏沉與疲憊感。全熱交換器能在不開窗的情況下，持續將戶外空氣經過濾後引入室內，排出二氧化碳。"
    },
    {
      title: "過濾空污防範落塵",
      description: "系統進氣端可選配高效過濾網，有效阻隔室外的懸浮微粒、花粉及沙塵。這對裝潢臨近大馬路、有嚴重落塵困擾或家人易因空氣過敏的家庭，能提供基本的物理空氣過濾協助。"
    },
    {
      title: "木工裝潢前預先管道配置",
      description: "全熱交換器機身與送風管道一般隱藏於天花板上方。必須在木工與吊隱式冷氣進場前，由技師進行放樣、規劃梁柱過孔或使用過樑器，規劃室內外管路徑，防止後續衝突損壞結構。"
    },
    {
      title: "冷能能效與熱交換技術",
      description: "全熱交換器利用熱交換元件，在引進戶外熱空氣、排出室內冷空氣時，先進行溫度與濕度交換。此技術能回收大部分冷能能效，使引入的外氣溫度接近室內，降低冷氣壓縮機運轉耗能。"
    },
    {
      title: "吊頂天花板維護孔空間",
      description: "主機內的濾網、熱交換核心需要定期拆卸清洗或更換。我們規劃時會要求在主機下方預留足夠大且便於更換維護的檢修孔，確保日後保養省時方便，不破壞裝潢。"
    },
    {
      title: "依現場結構條件規劃評估",
      description: "全熱交換器涉及全天候的通風管道佈線。管道長度、直角彎折次數以及出回風口位置會直接影響氣流風壓。我們不誇大健康效果，亦不承諾保證解決所有空氣問題，統一依現場條件勘查評估。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.hanyao.com.tw/services/erv/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Service Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              室內新風系統
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              全熱交換器規劃｜室內換氣、空氣流通與空調效率整合評估
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              適合高級住宅、辦公室或商用空間洽詢。新風管路與冷氣配置必須在天花板施工前精準套圖設計，確保氣流均勻分佈且不減損梁柱安全。
            </p>
          </div>
        </section>

        {/* ERV Details */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                >
                  <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-505 rounded-full"></span>
                    {benefit.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* Assessment Box */}
            <div className="mt-12 bg-slate-900/20 border border-slate-850 p-8 rounded-2xl text-center max-w-2xl mx-auto space-y-6">
              <h3 className="text-base font-bold text-white">規劃全熱交換器？請 LINE 傳送平面圖初步分析</h3>
              <p className="text-xs text-slate-405 leading-relaxed">
                全熱交換器需要在天花板封板前完成主機吊掛與風管佈局。建議您在裝潢初期、木工尚未進場前，將房屋格局平面圖與預計裝潢的天花板高度圖透過 LINE 傳送給我們，由技師為您線上進行初步判斷與評估。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "erv", cta_position: "erv_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>LINE 傳平面圖初步判斷</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  trackEventName="quote_request"
                  trackParams={{ service_type: "erv", cta_position: "erv_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>預約全熱交換器規劃</span>
                </CTAButton>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="erv"
          phoneText="撥打規劃諮詢"
          lineText="加 LINE 傳照評估"
          onPhoneClick={() => trackEvent("lp_cta_click", { service_type: "erv", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("lp_cta_click", { service_type: "erv", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
