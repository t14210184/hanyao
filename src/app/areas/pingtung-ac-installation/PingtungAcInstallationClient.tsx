"use client";

import React from "react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

const services = [
  {
    title: "屏東家用分離式冷氣安裝",
    description: "屏東在地家庭變頻分離式冷氣安裝。根據日照與房間坪數推薦合適噸數，嚴格要求銅管包覆、室外機穩固防震施工，保障運轉效能."
  },
  {
    title: "屏東新屋與裝潢前冷氣配置",
    description: "在木工封板前，技師預先到屏東現場進行冷媒管路排管、控制訊號線配線與冷凝水排水坡度放樣，與裝潢設計師流暢套圖配合。"
  },
  {
    title: "屏東冷氣舊換新評估",
    description: "老舊冷氣耗電、能效低。提供屏東到府舊機評估拆卸，判斷舊銅管是否適合沿用，引進高能效變頻一級冷氣並清運回收舊機。"
  },
  {
    title: "屏東天花板吊隱式空調",
    description: "出回風口完美融入木工設計。由持證技師精密估算風壓與管道阻力，架設排水重力斜度並預留日後便利清洗保養的檢修空間。"
  }
];

const districts = [
  "屏東市", "潮州", "萬丹", "長治", "內埔", "竹田", "麟洛"
];

export default function PingtungAcInstallationClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            屏東在地服務處
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            屏東冷氣安裝估價｜新屋、舊換新、分離式與吊隱式規劃
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            焓耀空調登記地址位於屏東市，為高屏合法冷凍空調公司。我們依現場勘查實際條件進行精準規畫與透明報價，絕不虛構或捏造誇大數據。
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {services.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
              >
                <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Districts List */}
          <div className="mt-16 text-center max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">屏東冷氣安裝服務行政區</h2>
            <p className="text-xs text-slate-400 mb-6">
              我們備有專業巡迴工程車，主要提供以下屏東地區到府現場評估規劃：
            </p>
            
            <div className="flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto mb-6">
              {districts.map((dst, idx) => (
                <span 
                  key={idx}
                  className="text-xs py-1.5 px-3.5 bg-slate-900/60 border border-slate-850 text-slate-355 rounded-lg"
                >
                  {dst}
                </span>
              ))}
            </div>

            <div className="mb-12">
              <span className="text-xs text-orange-400 font-semibold bg-slate-900 border border-orange-500/20 py-2 px-4 rounded-xl">
                ※ 其他屏東地區可來電或 LINE 洽詢
              </span>
            </div>

            {/* Action Box */}
            <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-2xl max-w-2xl mx-auto space-y-6">
              <h3 className="text-base font-bold text-white">確認安裝格局？請 LINE 傳送現場照片或平面圖</h3>
              <p className="text-xs text-slate-455 leading-relaxed">
                不論是客房新裝還是整棟透天冷氣規劃，歡迎您先加 LINE 傳現場照片或格局平面圖。技師團隊會在線上提供初步判斷，並約定時間到府做實地勘查與精準估價。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac_installation_pingtung", cta_position: "pingtung_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>LINE 傳現場照片</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  className="w-full sm:flex-1 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>屏東冷氣安裝估價</span>
                </CTAButton>
              </div>
            </div>

            {/* Navigation links */}
            <div className="mt-12 pt-8 border-t border-slate-900 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
              <Link href="/services/ac-installation/" className="text-sky-400 hover:underline">冷氣安裝服務 &rarr;</Link>
              <Link href="/services/ac-replacement/" className="text-sky-400 hover:underline">冷氣舊換新規劃指引 &rarr;</Link>
              <Link href="/contact/" className="text-sky-400 hover:underline">預約現場估價場勘 &rarr;</Link>
            </div>

          </div>

        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="ac_installation_pingtung"
        phoneText="撥打安裝諮詢"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
