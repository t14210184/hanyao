"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function AcRelocationServicePage() {
  const pageTitle = "冷氣移機服務｜搬家、裝潢、重新配置冷氣位置先評估 - 焓耀空調";
  const pageDescription = "高雄與屏東專業冷氣移機服務。提供搬家裝潢拆機、新安裝位置冷房與電力評估、舊冷媒銅管與架子能否沿用檢測，降低移機故障風險。無固定報價，依現場與機況評估施作。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "冷氣移機服務",
    "description": pageDescription,
    "url": "https://www.xusen.pro/services/ac-relocation/"
  };

  const relocationPoints = [
    {
      title: "標準回收與舊機拆卸",
      description: "移機前必須正確執行冷媒封存與回收步驟，將冷媒鎖定在室外機中，防止冷媒外洩污染並損害機器能效。室內機與室外主機確實做好防塵防水包覆，安全物理卸下。"
    },
    {
      title: "新安裝位置環境評估",
      description: "新環境的空間坪數、西曬狀況、高度等都會影響原機器的冷房能效。技師會精算新空間是否會因機器冷凍噸數不夠而產生不冷或長期過載運作，並規劃合理安裝路徑。"
    },
    {
      title: "冷媒銅管與控制線是否沿用",
      description: "銅管沿用有長度限制，且若舊銅管已經嚴重氧化變黑、管壁變薄或直角壓折，強行沿用將增加日後漏冷媒風險。技師現場檢驗銅管厚度與彈性，若有漏氣隱憂會建議重新拉管。"
    },
    {
      title: "新位置的排水與室外機散熱",
      description: "新環境的排水孔高度與走線坡度是關鍵，不夠傾斜容易滴水。室外機也必須配置在通風良好且利於技師日後維修保養的安全地方，避開散熱阻擋、西曬或窄道。"
    },
    {
      title: "移機重新安裝的漏冷媒風險",
      description: "冷氣在物理拆卸、運送及重新擴管安裝的過程中，密封膠圈、法蘭接口等元件均可能因物理拉扯或老舊老化產生微小縫隙。我們在重新裝機時確實執行真空抽壓與查漏，保障運轉壽命。"
    },
    {
      title: "是否建議舊冷氣繼續使用評估",
      description: "若舊冷氣已運轉多年（例如已過保固或能效差）、或有壓縮機老化的情況，移機拆卸、運送再重新配置所產生的二次材料與工資成本，可能會高於購置一級省電新冷氣的效益。技師會提供誠實評估建議。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/services/ac-relocation/" />
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
              移機安全性評估
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              冷氣移機服務｜搬家、裝潢、重新配置冷氣位置先評估
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              不捏造包好不漏，不承諾隨叫隨到。冷氣移機牽涉到舊機拆裝的耗損、新位置散熱及電壓配管等問題。我們不寫固定移機價格，統一依現場與機況進行實地勘查與分析。
            </p>
          </div>
        </section>

        {/* Relocation Points */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relocationPoints.map((pt, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                >
                  <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-505 rounded-full"></span>
                    {pt.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{pt.description}</p>
                </div>
              ))}
            </div>

            {/* Assessment Box */}
            <div className="mt-12 bg-slate-900/20 border border-slate-850 p-8 rounded-2xl text-center max-w-2xl mx-auto space-y-6">
              <h3 className="text-base font-bold text-white">移機是否合算？先 LINE 傳機器型號與現場位置照片</h3>
              <p className="text-xs text-slate-405 leading-relaxed">
                並非所有舊冷氣都適合二次移機重新使用。歡迎您加官方 LINE 傳送您的冷氣銘牌照片（可確認年份、型號與冷媒規格）以及目前的安裝位置和要移入的新位置照片。技師將為您線上進行初步判斷與評估。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac_relocation", cta_position: "relocation_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>LINE 傳現場照片</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  className="w-full sm:flex-1 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>詢問冷氣移機評估</span>
                </CTAButton>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac_relocation"
          phoneText="撥打移機諮詢"
          lineText="加 LINE 傳照評估"
        />
      </main>
    </>
  );
}
