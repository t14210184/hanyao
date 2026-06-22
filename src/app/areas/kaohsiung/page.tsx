"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function KaohsiungAreaPage() {
  const pageTitle = "高雄冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃 - 焓耀空調";
  const pageDescription = "提供高雄地區冷氣空調安裝、故障維修、高壓清洗保養、商用中央空調與冰水主機規劃。服務範圍覆蓋鳳山、左營、三民、鼓山、楠梓、前鎮等區，免費到府場勘估價。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "高雄冷氣空調服務",
    "description": pageDescription,
    "url": "https://www.xusen.pro/areas/kaohsiung/"
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

  const services = [
    {
      title: "高雄冷氣安裝",
      description: "家用變頻分離式與天花板吊隱式冷氣專業安裝。注重管線隱蔽配置與排水斜度計算，確保機器高能效運轉與美觀。"
    },
    {
      title: "高雄冷氣維修",
      description: "提供冷氣不冷、漏水滴水、異常震動噪音、控制板燒毀與冷媒外洩查漏精準檢測。現場明細報價同意後再修。"
    },
    {
      title: "高雄冷氣清洗",
      description: "分離式與吊隱式冷氣無毒藥劑深層高壓清洗。徹底消除出風發霉異味、改善風量變小問題，健康省電。"
    },
    {
      title: "高雄商用空調",
      description: "辦公大樓、店面餐廳與工廠多聯式變頻 VRV 系統規劃。針對熱負荷噸位及風管配管路徑進行專業設計。"
    },
    {
      title: "高雄中央空調 / 冰水主機洽詢",
      description: "氣冷式及水冷式冰水主機系統定期巡檢、通管保養、年度維護合約。專屬持證技師團隊，注重運轉電流與壓力查檢。"
    }
  ];

  const districts = [
    "鳳山區", "左營區", "三民區", "鼓山區", "楠梓區", 
    "前鎮區", "小港區", "苓雅區", "新興區", "前金區",
    "鹽埕區", "大寮區", "鳥松區", "仁武區", "路竹區", 
    "岡山區", "橋頭區", "梓官區", "林園區", "其他高雄地區亦歡迎洽詢"
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/areas/kaohsiung/" />
        <JsonLd schema={pageSchema} />
        <JsonLd schema={localSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Kaohsiung Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              高雄在地服務
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight">
              高雄冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              焓耀空調提供高雄全區冷氣安裝、保養與維修服務。我們配備專業技師車隊，服務均依現場排程與狀況儘速為您安排。
            </p>
          </div>
        </section>

        {/* Local Services Section */}
        <section className="py-16 bg-slate-950 border-b border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-white">專業冷氣空調工程服務</h2>
              <p className="text-xs sm:text-sm text-slate-450 mt-2">依現場坪數、熱源與管線長度進行實地查勘評估，報價透明安心。</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((srv, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md">
                  <div>
                    <h3 className="text-base font-bold text-white mb-3 border-b border-slate-850 pb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                      {srv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                      {srv.description}
                    </p>
                  </div>
                  <CTAButton
                    href="/contact/"
                    className="w-full text-center py-2 bg-slate-850 hover:bg-sky-500 text-white font-semibold rounded-lg border border-slate-800 hover:border-sky-500 text-xs transition-colors"
                  >
                    預約高雄服務評估
                  </CTAButton>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Districts List */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-bold text-white mb-4">高雄服務行政區域</h2>
            <p className="text-xs text-slate-400 mb-8 max-w-lg mx-auto">
              技師團隊備有專業工程巡迴車，提供高雄市區及周邊鄉鎮依排程安排到府查檢：
            </p>
            
            <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
              {districts.map((dst, idx) => (
                <span 
                  key={idx}
                  className={`text-xs py-1.5 px-3 rounded-lg border ${
                    dst.includes("洽詢") 
                      ? "bg-slate-900 border-orange-500/30 text-orange-400 font-semibold" 
                      : "bg-slate-900/60 border-slate-850 text-slate-300"
                  }`}
                >
                  {dst}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-16 max-w-lg mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.phone1Link}
                  trackEventName="phone_click"
                  trackParams={{ service_type: "general", cta_position: "kaohsiung_area_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                >
                  <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>高雄服務立即撥打</span>
                </CTAButton>
                
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "general", cta_position: "kaohsiung_area_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>LINE 傳照片初步判斷</span>
                </CTAButton>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="general"
          phoneText="撥打專線諮詢"
          lineText="加 LINE 傳照評估"
        />
      </main>
    </>
  );
}
