"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function AcRepairServicePage() {
  const pageTitle = "冷氣維修檢修｜冷氣不冷、滴水、漏水、異音先檢查再說明 - 焓耀空調";
  const pageDescription = "高雄與屏東專業冷氣維修與故障檢修。針對變頻冷氣不冷、出風口滴水漏水、異常震動噪音、控制基板與電容受損進行精密檢測。現場查明原因報價同意才修，依排程到府服務。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "冷氣維修檢修服務",
    "description": pageDescription,
    "url": "https://www.hanyao.com.tw/services/ac-repair/"
  };

  const issues = [
    {
      title: "冷氣運轉但不冷",
      description: "冷氣開機有風但沒有冷房效果。這需要檢測是室外機壓縮機啟動電容損壞、控制電路板故障，或是冷媒系統發生壓力異常。技師會使用專用壓力表與電流表判定確切原因。"
    },
    {
      title: "出風口滴水與室內機漏水",
      description: "室內機殼滴水、水滴沿著牆壁滑落。最常見的原因是排水盤淤積了果凍狀黴菌堵塞排水孔，或是排水軟管坡度變形。部分原因可能是蒸發器結霜，需現場排查處理。"
    },
    {
      title: "主機異音與異常震動",
      description: "室內機或室外機發出劇烈喀喀聲、高頻金屬摩擦聲。通常是風扇葉片鬆動、馬達軸承磨損卡死，或是機殼安裝不牢產生共振。現場檢查後會說明零件更換方案。"
    },
    {
      title: "冷媒系統異常判斷",
      description: "冷氣效能逐月下降，銅管接頭出現結霜現象。我們會對冷媒迴路進行壓力檢測與訊號檢測，找出異常部位，向客戶詳細說明系統狀態後提供對應處置建議。"
    },
    {
      title: "電容、控制板、壓縮機檢測",
      description: "冷氣通電無反應、或運轉幾分鐘後自動跳機。主機的電子控制板、過載保護器或壓縮機線圈可能已損壞。技師會以三用電表測量阻值與電壓，釐清損壞組件。"
    },
    {
      title: "依現場狀況說明處理方式",
      description: "冷氣構造複雜，同一個故障現象可能由完全不同的零件損壞所致。我們堅持到現場實地拆機檢查，理清損壞明細並報價，經客戶同意後才進行修復，絕不含糊開價。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.hanyao.com.tw/services/ac-repair/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Service Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-slate-900/15 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              透明診斷 • 誠實報價
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              冷氣維修檢修｜冷氣不冷、滴水、漏水、異音先檢查再說明
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              不捏造誇大成效，不保證隨叫隨到。我們依現場狀況評估與現有排程調度安排檢修，查明故障源頭後提供明細報價，保障您的預算與設備安全。
            </p>
          </div>
        </section>

        {/* Repair Details */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {issues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                >
                  <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                    {issue.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{issue.description}</p>
                </div>
              ))}
            </div>

            {/* Diagnostics Notice */}
            <div className="mt-12 bg-slate-900/20 border border-slate-850 p-8 rounded-2xl text-center max-w-2xl mx-auto space-y-6">
              <h3 className="text-base font-bold text-white">冷氣故障？先 LINE 傳現場照片或影片，協助技師初步診斷</h3>
              <p className="text-xs text-slate-405 leading-relaxed">
                您可以先將室內機滴水狀況、冷氣顯示的故障代碼、或機器運作時的異音錄製影片，透過 LINE 傳送給我們。技師會先進行線上初步分析判定，並為您預約安排到府實地查檢。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac_repair", cta_position: "repair_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>LINE 傳故障照片</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  trackEventName="quote_request"
                  trackParams={{ service_type: "ac_repair", cta_position: "repair_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>預約冷氣檢修</span>
                </CTAButton>
              </div>
            </div>

            {/* Internal Navigation Links */}
            <div className="mt-12 pt-8 border-t border-slate-900 text-center space-y-4">
              <span className="text-xs text-slate-500 block">維修相關連結：</span>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                <a href="/lp/ac-repair/" className="text-sky-400 hover:underline">冷氣維修高轉換專區 &rarr;</a>
                <a href="/areas/kaohsiung-ac-repair/" className="text-sky-400 hover:underline">高雄冷氣維修服務區 &rarr;</a>
                <a href="/contact/" className="text-sky-400 hover:underline">線上快速預約表單 &rarr;</a>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac_repair"
          phoneText="撥打維修諮詢"
          lineText="加 LINE 傳照評估"
          onPhoneClick={() => trackEvent("repair_urgent_click", { service_type: "ac_repair", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("repair_urgent_click", { service_type: "ac_repair", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
