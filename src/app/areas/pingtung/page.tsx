"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function PingtungAreaPage() {
  const pageTitle = "屏東冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃 - 焓耀空調";
  const pageDescription = "提供屏東在地冷氣空調服務，包括冷氣安裝、舊換新、空調漏水維修、高壓清洗保養與商用多聯 VRV 系統規劃。服務範圍覆蓋屏東市、潮州、萬丹、長治、內埔等地區。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "屏東冷氣空調服務",
    "description": pageDescription,
    "url": "https://www.xusen.pro/areas/pingtung/"
  };

  const localSchema = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "name": "焓耀空調工程有限公司 - 屏東總部",
    "telephone": "+886-931940133",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "建南路106號",
      "addressLocality": "屏東市",
      "addressRegion": "屏東縣",
      "postalCode": "900",
      "addressCountry": "TW"
    },
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "屏東縣"
    }
  };

  const services = [
    {
      title: "屏東冷氣安裝",
      description: "屏東新屋裝修、舊換新分離式冷氣與吊隱式冷氣配置。提供風阻與散熱評估，安全配電與美觀施工。"
    },
    {
      title: "屏東冷氣維修",
      description: "在地技師到府查檢冷氣滴水、不冷只吹送風、主機噪音等故障。明細說明並報價後再動手維修。"
    },
    {
      title: "屏東冷氣清洗",
      description: "以專業防塵保護與高壓水槍，深層清洗鼓風輪與水盤積塵黴菌，改善霉味並提升冷房能效。"
    },
    {
      title: "屏東商用空調",
      description: "工廠、廠辦大樓與連鎖餐飲店面中大型空調規劃。規劃變頻多聯式 VRV 系統，兼顧節能與氣流循環。"
    },
    {
      title: "屏東在地服務",
      description: "屏東在地工程團隊，公司登記地址位於屏東市建南路。實地場勘規劃，估價透明，維護便利有保障。"
    }
  ];

  const districts = [
    "屏東市", "潮州", "萬丹", "長治", "內埔", "竹田", "麟洛"
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/areas/pingtung/" />
        <JsonLd schema={pageSchema} />
        <JsonLd schema={localSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Pingtung Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/10 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              屏東在地服務
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight">
              屏東冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              焓耀空調位於屏東市，為高屏在地合規登記的冷凍空調公司。提供家用及商用空調到府巡檢與場勘，依排程儘速為您安排。
            </p>
          </div>
        </section>

        {/* Local Services Section */}
        <section className="py-16 bg-slate-950 border-b border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-white">專業冷氣空調工程服務</h2>
              <p className="text-xs sm:text-sm text-slate-455 mt-2">提供屏東在地化專業規劃，現場精密檢測分析，透明報價。</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((srv, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md">
                  <div>
                    <h3 className="text-base font-bold text-white mb-3 border-b border-slate-855 pb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                      {srv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                      {srv.description}
                    </p>
                  </div>
                  <CTAButton
                    href="/contact/"
                    trackEventName="quote_request"
                    trackParams={{ service_type: "general", cta_position: `pingtung_service_card_${idx}` }}
                    className="w-full text-center py-2 bg-slate-850 hover:bg-sky-500 text-white font-semibold rounded-lg border border-slate-800 hover:border-sky-500 text-xs transition-colors"
                  >
                    預約屏東服務評估
                  </CTAButton>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Districts List */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-bold text-white mb-4">屏東服務行政區域</h2>
            <p className="text-xs text-slate-400 mb-8 max-w-lg mx-auto">
              提供以下屏東地區到府場勘、冷氣安裝清洗與故障排除：
            </p>
            
            <div className="flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto">
              {districts.map((dst, idx) => (
                <span 
                  key={idx}
                  className="text-xs py-1.5 px-3.5 bg-slate-900/60 border border-slate-850 text-slate-300 rounded-lg"
                >
                  {dst}
                </span>
              ))}
            </div>
            
            <div className="mt-6">
              <span className="text-xs text-orange-400 font-semibold bg-slate-900 border border-orange-500/20 py-2 px-4 rounded-xl">
                ※ 其他屏東地區可來電或 LINE 洽詢
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-16 max-w-lg mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.phone1Link}
                  trackEventName="phone_click"
                  trackParams={{ service_type: "general", cta_position: "pingtung_area_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                >
                  <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>屏東服務立即撥打</span>
                </CTAButton>
                
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "general", cta_position: "pingtung_area_page" }}
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
          onPhoneClick={() => trackEvent("lp_cta_click", { service_type: "general", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("lp_cta_click", { service_type: "general", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
