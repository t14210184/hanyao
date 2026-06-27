"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

const systems = [
  {
    title: "1. 冰水主機 (Chiller) 保養與通管",
    description: "針對水冷式冰水機熱交換器（冷凝器/蒸發器）進行物理通管沖洗，徹底清除水垢、淤泥以維持熱交換效率；亦提供壓縮機電流與冷媒進出壓力查檢、冷凍油與乾燥過濾器預防性更換。"
  },
  {
    title: "2. 中央空調 (Central AC) 水路與電機系統",
    description: "包含冷卻水塔清洗維護、水泵電機軸承潤滑、過濾網清洗、以及各樓層箱（AHU/FCU）自動控制閥閥體開度檢測，確保風路與水路阻力降至合理範圍。"
  },
  {
    title: "3. 氣冷式冰水主機散熱鰭片沖洗",
    description: "對於無配置冷卻水塔之氣冷式主機，鰭片卡塵會造成排氣壓力升高。我們使用專業化學藥劑配合高壓噴槍，安全沖洗外部散熱鰭片，穩定系統能效並防範主機因過熱而跳機。"
  },
  {
    title: "4. 商用空調保養與深層除菌",
    description: "針對大樓、診所、餐飲店面之中大型分離式或吊隱式空調，以不影響日間營運為目標，安排專業防塵防漏清洗，徹底洗淨鰭片、排水盤黴菌以維持出風量與空氣品質。"
  },
  {
    title: "5. 年度維護合約與定期巡檢",
    description: "提供每季或半年定期的巡檢合約。由持照技師現場量測紀錄機組運轉電壓、電流、高低壓力、絕緣電阻與控制器設定參數，建立設備保養履歷，降低高額停機停產損失。"
  }
];

export default function ChillerMaintenanceClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Chiller Hero */}
      <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-slate-900/20 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            商用大空調系統
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight">
            冰水主機 / 中央空調維修保養｜商用空調系統檢修與年度維護洽詢
          </h1>
          <p className="text-sm text-slate-405 mt-4 leading-relaxed max-w-2xl mx-auto">
            商用空調系統涉及建物用電負載與製程發熱需求。我們提供氣冷與水冷式大主機定期保養與故障維修，現場場勘後提供明細報價，依狀況與排程進行安排。
          </p>
        </div>
      </section>

      {/* System Details */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white">商用與中央空調保養維護範疇</h2>
              <p className="text-xs text-slate-400 mt-2">大型設備涉及配電安全與危險高空作業，技師均持有冷凍空調裝修技術士證執照。</p>
            </div>

            <div className="space-y-8">
              {systems.map((sys, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 sm:p-8 rounded-2xl flex gap-6 hover:border-slate-800 transition-colors">
                  <div className="w-10 h-10 bg-sky-950 border border-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm">
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">{sys.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-405 leading-relaxed">{sys.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Assessment rationale */}
            <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-3xl text-center space-y-4">
              <h3 className="text-lg font-bold text-white">為什麼商用大主機工程必須現場場勘？</h3>
              <p className="text-xs sm:text-sm text-slate-405 max-w-xl mx-auto">
                商用大空調需要先了解現場條件，不建議只用電話直接報價。因為各廠區的水管管路走向、冷卻水塔高度、馬達水泵配電線路、以及天花板防火消防避讓皆不相同。實地看完現場，能避免日後任意加價。
              </p>
              <p className="text-xs text-orange-400">
                ※ 您可以先 LINE 傳主機設備上的「規格銘牌照片」、現場格局平面圖或管路照片，以利工程師在線上進行初步負載計算與方案初步分析。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-2">
                <CTAButton
                  href={siteConfig.phone1Link}
                  trackEventName="phone_click"
                  trackParams={{ service_type: "commercial_ac", cta_position: "chiller_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                >
                  <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>撥打工程諮詢</span>
                </CTAButton>
                
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "commercial_ac", cta_position: "chiller_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>LINE 傳設備照片</span>
                </CTAButton>
              </div>

              <div className="pt-2">
                <CTAButton
                  href="/contact/"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-350 transition-colors"
                >
                  <span>預約中央空調現場檢修場勘 &rarr;</span>
                </CTAButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="commercial_ac"
        phoneText="撥打專線諮詢"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
