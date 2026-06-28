"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

const symptoms = [
  {
    name: "冷氣吹風不冷",
    description: "主機送風正常但無冷房效果。建議安排物理性檢查，排查管線、蒸發器與室外機周邊散熱狀況。"
  },
  {
    name: "室內機滴水 / 漏水",
    description: "出風口或底座滴水。通常與內部排水管路積垢、髒污淤積或蒸發器結霜有關，需現場檢測判斷。"
  },
  {
    name: "冷氣運作異音",
    description: "機器運轉時有異常震動聲、高頻異音或摩擦聲. 建議由技師進行風扇馬達、軸承與內部配管檢查。"
  },
  {
    name: "系統洩漏冷媒",
    description: "冷度逐月下降或銅管結霜。技師會針對冷媒銅管與接頭進行物理防滲檢測與壓力排查。"
  },
  {
    name: "排水管路堵塞",
    description: "凝結水無法順利排出。技師可協助排查管路積垢、進行物理性高壓疏通或排水管路日常保養防範措施。"
  },
  {
    name: "電源無法啟動",
    description: "遙控器與機身開關皆無反應。可能與電源插頭、配線、主機基板或電控狀況有關，需現場查核。"
  }
];

export default function KaohsiungAcRepairClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Repair Hero */}
      <section className="relative py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            高雄專業維修服務
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            高雄冷氣維修檢修｜冷氣不冷、滴水、漏水、異音排查
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-6 leading-[1.8] max-w-3xl mx-auto">
            提供高雄地區分離式與吊隱式空調維修檢測服務。我們先精密檢測分析，現場明細說明，客戶同意後才進行施作，將依實際派工狀況規劃排定。
          </p>
        </div>
      </section>

      {/* Kaohsiung Local Challenges Section */}
      <section className="py-16 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">高雄在地冷氣維修與環境考量</h2>
            <p className="text-sm text-slate-400 mt-3">針對高雄特有的地理氣候環境，提醒您日常冷氣運作時需留意的環境影響因素。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-850">
              <div className="w-10 h-10 rounded-lg bg-orange-950/30 border border-orange-900/30 flex items-center justify-center mb-6">
                <span className="text-orange-400 font-bold">01</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">高溫與日曬環境影響</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
                高雄夏季長且氣溫高，若室外機長時間處於高溫或強烈日曬環境下，可能會影響室外機周邊的散熱條件，進而造成冷房效果下降。
              </p>
            </div>

            <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-850">
              <div className="w-10 h-10 rounded-lg bg-blue-950/30 border border-blue-900/30 flex items-center justify-center mb-6">
                <span className="text-blue-400 font-bold">02</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">沿海與空曠場域留意</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
                高雄沿海或空曠場域環境中，空氣鹽分或環境因子可能對室外機產生影響，安裝與日常維護時需要特別留意室外機的固定與防護狀況。
              </p>
            </div>

            <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-850">
              <div className="w-10 h-10 rounded-lg bg-green-950/30 border border-green-900/30 flex items-center justify-center mb-6">
                <span className="text-green-400 font-bold">03</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">漏水與排水不順檢測</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
                高溫潮濕季節容易影響冷氣排水效能，產生漏水、結冰或排水不順等問題。此類狀況成因較多，仍需依現場實際檢查結果判定具體原因。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Symptoms Diagnostic Grid */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">常見冷氣故障症狀排查</h2>
            <p className="text-sm text-slate-400 mt-3">冷氣異常若強行運轉，易導致主機組件損毀，建議儘早安排檢測。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {symptoms.map((sym, idx) => (
              <div key={idx} className="bg-slate-900/30 border border-slate-850 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                    {sym.name}
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-[1.8] mb-8">
                    {sym.description}
                  </p>
                </div>
                <CTAButton
                  href="/contact/"
                  className="w-full text-center min-h-[56px] py-4 bg-slate-800 hover:bg-sky-500 text-white font-semibold rounded-xl border border-slate-750 hover:border-sky-500 text-sm transition-colors flex items-center justify-center"
                >
                  預約高雄檢修
                </CTAButton>
              </div>
            ))}
          </div>

          {/* District footprint statement */}
          <div className="mt-16 text-center max-w-2xl mx-auto p-6 bg-slate-900/20 border border-slate-850 rounded-2xl">
            <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
              高雄市區與周邊行政區可依案件類型、距離、現場條件與當期派工狀況安排評估。
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-16 text-center max-w-lg mx-auto space-y-6">
            <h3 className="text-xl font-bold text-white">冷氣故障？先 LINE 傳狀況免費初步分析</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
              可先 LINE 傳故障顯示代碼、故障運轉狀況影片或主機位置照，以利工程師初步診斷與料件排程準備。
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
              <CTAButton
                href={siteConfig.phone1Link}
                trackEventName="phone_click"
                trackParams={{ service_type: "ac-repair", cta_position: "kaohsiung_repair_page" }}
                className="w-full sm:flex-1 min-h-[56px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>高雄冷氣維修立即撥打</span>
              </CTAButton>
              
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "ac-repair", cta_position: "kaohsiung_repair_page" }}
                className="w-full sm:flex-1 min-h-[56px] bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>LINE 傳故障狀況</span>
              </CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* Visible FAQ Section */}
      <section className="py-16 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">高雄冷氣維修 FAQ</h2>
            <p className="text-sm text-slate-400 mt-3">提供您冷氣故障與維修排程的常見問題排查說明。</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：高雄冷氣不冷一定是冷媒不足嗎？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：不一定。冷氣不冷可能與濾網、蒸發器、室外機周邊散熱條件、管線、冷媒系統、感溫或電控狀況有關，仍需依現場檢查結果判斷。</p>
            </div>

            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：冷氣漏水可以先自己處理嗎？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：可以先確認濾網是否髒污、室內機周邊是否有明顯滴水位置，並拍照提供初步判斷。若涉及拆機、排水管內部、電路、冷媒系統或高處室外機，建議由技師現場檢查。</p>
            </div>

            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：高雄冷氣維修排程如何確認？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：高雄地區維修會依案件類型、服務位置、現場條件與當期派工狀況進行排程溝通，實際安排仍以雙方確認為準。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="ac-repair"
        phoneText="撥打專線諮詢"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
