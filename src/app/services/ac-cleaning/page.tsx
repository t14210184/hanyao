"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function AcCleaningServicePage() {
  const pageTitle = "冷氣清洗保養｜霉味、風量變小、髒污堆積先確認機型 - 焓耀空調";
  const pageDescription = "高雄與屏東專業冷氣清洗保養。針對分離式與吊隱式冷氣吹出酸臭霉味、風量變小、內部黑斑發霉提供深層防護清洗。使用防霉無毒藥劑，依排程預約到府施作。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "冷氣清洗保養服務",
    "description": pageDescription,
    "url": "https://www.xusen.pro/services/ac-cleaning/"
  };

  const benefits = [
    {
      title: "徹底消除酸臭霉味",
      description: "冷氣運轉產生霉味是因為風輪與排水盤滋生了大量黴菌與灰塵。我們使用專用無毒除菌藥劑與高壓水槍進行深層刷洗與沖洗，消除過敏源，恢復出風清新。"
    },
    {
      title: "改善風量變小與不冷",
      description: "當風扇鼓風輪卡滿厚厚的灰塵油煙，出風量會明顯衰退，導致冷氣效能降低、感覺不冷。清洗風輪與鋁鰭片能暢通風道，大幅提高熱交換效率與冷房速度。"
    },
    {
      title: "室內機防護深層清洗",
      description: "施作前，我們對室內機周邊牆面、地板及家具進行嚴密防水包覆。拆卸外殼、水盤（視機型而定）及濾網，以專用高壓水槍沖洗鋁鰭片及風扇輪，確保髒水不外漏。"
    },
    {
      title: "室外機清洗評估",
      description: "室外機暴露於室外，冷卻鰭片易卡滿柳絮、泥沙與落葉，影響壓縮機散熱，導致冷氣耗電甚至高溫跳機。技師會評估室外機安裝位置的安全度與散熱片髒污度，安排適當沖洗。"
    },
    {
      title: "清洗與故障維修之差異",
      description: "清洗保養是清除機器內部的髒污，改善风量與衛生。若冷氣本身已經出現不開機、漏水、漏冷媒或壓縮機不運轉等機械故障，則需要進行維修更換零件，而非單純清洗。"
    },
    {
      title: "先確認冷氣機型與台數",
      description: "分離式與吊隱式冷氣的清洗工法與時間不同。為了提供精準的估價與安排適當的施工排程，請您預約時先提供冷氣的種類（壁掛分離式或吊隱式）與需要清洗的總台數。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/services/ac-cleaning/" />
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
              無毒抗菌 • 提升效能
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight">
              冷氣清洗保養｜霉味、風量變小、髒污堆積先確認機型
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              不保證隨叫隨到。我們使用無毒安全藥劑深層高壓清洗，先確認冷氣機型與清洗台數，依排程為您細心施作。
            </p>
          </div>
        </section>

        {/* Cleaning Details */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                >
                  <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                    {benefit.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* Photo guide */}
            <div className="mt-12 bg-slate-900/20 border border-slate-850 p-8 rounded-2xl text-center max-w-2xl mx-auto space-y-6">
              <h3 className="text-base font-bold text-white">確認清洗費用？請 LINE 傳送室內機與台數照片</h3>
              <p className="text-xs text-slate-405 leading-relaxed">
                壁掛式或天花板吊隱式冷氣的施作工序不同。建議您加官方 LINE 傳送室內機外觀照片，並說明需要清洗的台數與大約位置（例如：客廳一台、臥室兩台），我們將回覆您初步的清洗保養分析。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac_cleaning", cta_position: "cleaning_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>LINE 傳台數與照片</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  className="w-full sm:flex-1 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>預約冷氣清洗</span>
                </CTAButton>
              </div>
            </div>

            {/* Internal Navigation Links */}
            <div className="mt-12 pt-8 border-t border-slate-900 text-center space-y-4">
              <span className="text-xs text-slate-500 block">清洗相關連結：</span>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                <a href="/lp/ac-cleaning/" className="text-sky-400 hover:underline">冷氣清洗高轉換專區 &rarr;</a>
                <a href="/faq/" className="text-sky-400 hover:underline">常見問題 FAQ 解答 &rarr;</a>
                <a href="/contact/" className="text-sky-400 hover:underline">預約現場檢測清洗 &rarr;</a>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac_cleaning"
          phoneText="撥打清洗諮詢"
          lineText="加 LINE 傳照評估"
        />
      </main>
    </>
  );
}
