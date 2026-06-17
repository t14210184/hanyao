"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function KaohsiungAcRepairPage() {
  const pageTitle = "高雄冷氣維修檢修｜冷氣不冷、滴水、漏水、異音排查 - 焓耀空調";
  const pageDescription = "高雄地區專業冷氣維修與故障檢修服務。針對分離式冷氣與吊隱式冷氣不冷、滴水漏水、異常震動噪音與漏冷媒進行精密查檢，我們先報價後施作，依現場排程儘速為您安排。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "高雄冷氣維修檢修",
    "description": pageDescription,
    "url": "https://www.hanyao.com.tw/areas/kaohsiung-ac-repair/"
  };

  const symptoms = [
    {
      name: "冷氣吹風不冷",
      description: "主機送風正常但無冷房效果。可能是電容受損、冷媒微漏、或是室外機散熱鰭片嚴重被髒污堵塞。"
    },
    {
      name: "室內機滴水 / 漏水",
      description: "出風口或底座滴水。通常是內部水盤淤積發霉膠質、排水管嚴重堵塞，或蒸發器異常結霜。"
    },
    {
      name: "冷氣運作異音",
      description: "機器運轉時有劇烈震動聲、高頻異音或喀喀聲。多為風扇馬達軸承磨損、扇葉鬆脫或配管磨擦所致。"
    },
    {
      name: "系統洩漏冷媒",
      description: "冷媒銅管接頭結霜、冷度逐月下降。技師會以加壓查漏找出漏點，進行焊補抽真空，並重新定量填充。"
    },
    {
      name: "排水管路堵塞",
      description: "排水管內滋生果凍生物膜，凝結水無法順利排出。技師會使用專用高壓沖洗機與疏通藥劑進行疏通。"
    },
    {
      name: "電源無法啟動",
      description: "遙控器與機身開關皆無反應。可能為電源插頭接線鬆脫、主板保險絲燒毀或微電腦基板故障。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.hanyao.com.tw/areas/kaohsiung-ac-repair/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Repair Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              高雄專業維修
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight">
              高雄冷氣維修檢修｜冷氣不冷、滴水、漏水、異音先判斷
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              提供高雄各行政區分離式與吊隱式空調維修服務。我們先精密檢測分析，現場明細報價，客戶同意後才施工，依現場排程與狀況儘速為您安排。
            </p>
          </div>
        </section>

        {/* Symptoms Diagnostic Grid */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-white">常見冷氣故障症狀排查</h2>
              <p className="text-xs text-slate-450 mt-2">冷氣異常若強行運轉，易導致压缩機負載過大而燒毀，建議儘早安排檢測。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {symptoms.map((sym, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md">
                  <div>
                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-450 rounded-full"></span>
                      {sym.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                      {sym.description}
                    </p>
                  </div>
                  <CTAButton
                    href="/contact/"
                    trackEventName="quote_request"
                    trackParams={{ service_type: "ac-repair", cta_position: `kaohsiung_repair_card_${idx}` }}
                    className="w-full text-center py-2 bg-slate-850 hover:bg-sky-500 text-white font-semibold rounded-lg border border-slate-800 hover:border-sky-500 text-xs transition-colors"
                  >
                    預約高雄檢修
                  </CTAButton>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-16 text-center max-w-lg mx-auto space-y-6">
              <h3 className="text-lg font-bold text-white">冷氣故障？先 LINE 傳狀況免費初步分析</h3>
              <p className="text-xs sm:text-sm text-slate-450 leading-relaxed">
                可先 LINE 傳故障顯示代碼、故障運轉狀況影片或室外機位置照，以利工程師初步診斷與料件排程準備。
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-2">
                <CTAButton
                  href={siteConfig.phone1Link}
                  trackEventName="phone_click"
                  trackParams={{ service_type: "ac-repair", cta_position: "kaohsiung_repair_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                >
                  <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>高雄冷氣維修立即撥打</span>
                </CTAButton>
                
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac-repair", cta_position: "kaohsiung_repair_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>LINE 傳故障狀況</span>
                </CTAButton>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac-repair"
          phoneText="撥打專線諮詢"
          lineText="加 LINE 傳照評估"
          onPhoneClick={() => trackEvent("lp_cta_click", { service_type: "ac-repair", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("lp_cta_click", { service_type: "ac-repair", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
