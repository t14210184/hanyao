"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function AcInstallationServicePage() {
  const pageTitle = "冷氣安裝服務｜高雄 / 屏東分離式、變頻、吊隱式冷氣規劃 - 焓耀空調";
  const pageDescription = "高雄與屏東專業冷氣安裝服務。提供新屋冷氣規劃、裝潢前冷氣配管配置、家用變頻分離式與吊隱式冷氣安裝。注重室外機散熱風阻、排水坡度、電力容量配線，依排程到府場勘估價。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "冷氣安裝服務",
    "description": pageDescription,
    "url": "https://www.xusen.pro/services/ac-installation/"
  };

  const steps = [
    {
      title: "新屋與裝潢前冷氣規劃",
      description: "在木工天花板進場前，提早與設計師對接管路走向。精準規劃冷媒銅管排管、控制訊號線與排水配管路徑，預防裝潢完成後無法修改的缺陷。"
    },
    {
      title: "分離式冷氣安裝",
      description: "家用最常見之機種。我們嚴格執行標準真空乾燥、冷媒迴路氣密檢漏與出風口水平量測，配合抗震避震墊，確保主機運作平穩、無震動噪音。"
    },
    {
      title: "吊隱式冷氣規劃",
      description: "出風口與回風口隱藏於天花板內，維持室內美觀。技師會精算風機靜壓、風管長度與出風均勻度，並設計足夠的維修保養孔空間。"
    },
    {
      title: "管線配置與用電條件",
      description: "冷媒配管避免過多直角彎折，防止冷媒流動阻力過大。電源配線嚴格要求安全配電容量，主開關與接地保護確實，防止漏電或過載危險。"
    },
    {
      title: "室外機位置與散熱",
      description: "室外機安裝位置必須確保散熱通風良好。避開窄道、西曬烈日或氣流短路區域，預留足夠的技師維修保養空間，確保冷氣運轉效率高且壽命長。"
    },
    {
      title: "排水坡度與防漏水",
      description: "冷凝水排出全靠自然重力斜度。我們安裝時確實使用水平儀測量排水管坡度，接口均做嚴密密封，並進行灌水測試，預防日後滴水與壁癌問題。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/services/ac-installation/" />
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
              專業空調建置
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight">
              冷氣安裝服務｜高雄 / 屏東分離式、變頻、吊隱式冷氣規劃
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              冷氣三分看機器、七分看施工。焓耀空調秉持標準工法，針對新屋裝潢與舊機換新，實地到府量測散熱、排水與用電容量，規劃最適當的冷房方案。
            </p>
          </div>
        </section>

        {/* Installation Points */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                >
                  <div className="w-10 h-10 bg-sky-950/80 border border-sky-500/20 text-sky-400 rounded-lg flex items-center justify-center font-bold text-sm mb-4">
                    0{idx + 1}
                  </div>
                  <h2 className="text-base font-bold text-white mb-2">{step.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-405 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            {/* Photo guide */}
            <div className="mt-12 bg-slate-900/20 border border-slate-850 p-8 rounded-2xl text-center max-w-2xl mx-auto">
              <h3 className="text-base font-bold text-white mb-2">無法確認安裝環境？可先 LINE 傳現場照片初步判斷</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                您可以將裝潢平面圖、預計安裝冷氣的空間照片、或舊室外機擺放位置拍照，透過 LINE 傳送給我們。技師會協助做初步的噸數與管線配置分析，並約定時間到府做實地確認。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac_installation", cta_position: "installation_photo_box" }}
                  className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>LINE 傳照片初步判斷</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  trackEventName="quote_request"
                  trackParams={{ service_type: "ac_installation", cta_position: "installation_photo_box" }}
                  className="w-full sm:flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>預約冷氣安裝估價</span>
                </CTAButton>
              </div>
            </div>

            {/* Internal Navigation Links */}
            <div className="mt-12 pt-8 border-t border-slate-900 text-center space-y-4">
              <span className="text-xs text-slate-500 block">更多冷氣空調相關服務：</span>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                <a href="/lp/ac-installation/" className="text-sky-400 hover:underline">冷氣安裝高轉換專區 &rarr;</a>
                <a href="/services/ac-replacement/" className="text-sky-400 hover:underline">冷氣舊換新規劃指引 &rarr;</a>
                <a href="/contact/" className="text-sky-400 hover:underline">到府估價快速預約 &rarr;</a>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac_installation"
          phoneText="撥打安裝諮詢"
          lineText="加 LINE 傳照評估"
          onPhoneClick={() => trackEvent("installation_quote_click", { service_type: "ac_installation", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("installation_quote_click", { service_type: "ac_installation", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
