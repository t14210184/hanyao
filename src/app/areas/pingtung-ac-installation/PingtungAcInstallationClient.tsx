"use client";

import React from "react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

const services = [
  {
    title: "屏東家用分離式冷氣安裝",
    description: "提供變頻分離式冷氣安裝服務。依現場格局與日照狀況推薦合適規格，注意室外機固定與日常維護，以維持良好的風量循環。"
  },
  {
    title: "屏東新屋與裝潢前冷氣配置",
    description: "在木工施作前，技師可到現場進行冷媒管路排管、控制訊號線配線與排水坡度配置，與裝潢設計師配合進行物理性排程規劃。"
  },
  {
    title: "屏東冷氣舊換新規劃",
    description: "老舊主機運作狀況不佳時，提供屏東在地到府舊機狀況評估、拆除，排查管路狀況並協助回收舊機服務。"
  },
  {
    title: "屏東天花板吊隱式空調",
    description: "依室內格局規劃風道配置，注意排水重力斜度並預留維修空間，使空調系統與裝潢設計完美融合。"
  }
];

const districts = [
  "屏東市", "潮州", "萬丹", "長治", "內埔", "竹田", "麟洛"
];

export default function PingtungAcInstallationClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            屏東在地服務
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            屏東冷氣安裝估價｜新屋、舊換新、分離式與吊隱式規劃
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-6 leading-[1.8] max-w-3xl mx-auto">
            我們為高屏地區合法登記之冷凍空調公司，提供屏東在地到府規劃與冷氣安裝估價（均採派工到府行動服務，無對外開放實體門市）。我們依現場勘查實際條件進行規劃與說明。
          </p>
        </div>
      </section>

      {/* Pingtung Local Challenges Section */}
      <section className="py-16 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">屏東在地冷氣安裝與環境考量</h2>
            <p className="text-sm text-slate-400 mt-3">針對屏東在地的特殊環境條件，提醒您安裝冷氣時需留意的物理與空間規劃因子。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-850">
              <div className="w-10 h-10 rounded-lg bg-orange-950/30 border border-orange-900/30 flex items-center justify-center mb-6">
                <span className="text-orange-400 font-bold">01</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">日照與高溫散熱</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
                屏東長夏氣溫偏高且日照強烈。冷氣室外機安裝位置若處於高溫或強烈日曬處，可能影響其周邊的散熱條件，需於現場勘查時做好空間避開或防護規劃。
              </p>
            </div>

            <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-850">
              <div className="w-10 h-10 rounded-lg bg-blue-950/30 border border-blue-900/30 flex items-center justify-center mb-6">
                <span className="text-blue-400 font-bold">02</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">海風與沿海氣候</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
                屏東部分沿海或風大空曠的區域，空氣中的水氣與環境因子可能影響室外機。在進行主機架設規劃時，需特別留意室外機固定位置與整體耐候性。
              </p>
            </div>

            <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-850">
              <div className="w-10 h-10 rounded-lg bg-green-950/30 border border-green-900/30 flex items-center justify-center mb-6">
                <span className="text-green-400 font-bold">03</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">物理遮蔽與日常維護</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
                裝設室外機時若使用遮陽棚，可提供物理性遮擋。但應合理規劃遮蔽空間，避免阻擋風扇出風，並為日常保養與維修預留充足的操作空間。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {services.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl hover:border-slate-800 transition-colors"
              >
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                  {item.title}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Districts List */}
          <div className="mt-16 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">屏東冷氣安裝服務行政區</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-[1.8] mb-6">
              我們主要提供以下屏東地區到府現場評估規劃：
            </p>
            
            <div className="flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto mb-6">
              {districts.map((dst, idx) => (
                <span 
                  key={idx}
                  className="text-xs py-1.5 px-3.5 bg-slate-900/60 border border-slate-850 text-slate-300 rounded-lg font-medium"
                >
                  {dst}
                </span>
              ))}
            </div>

            <div className="mb-12">
              <span className="text-xs text-orange-400 font-semibold bg-slate-900 border border-orange-500/20 py-2.5 px-5 rounded-xl">
                ※ 其他屏東地區可來電或 LINE 洽詢
              </span>
            </div>

            {/* Action Box */}
            <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-2xl max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-bold text-white">確認安裝格局？請 LINE 傳送現場照片或平面圖</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-[1.8]">
                不論是客房裝設還是整棟格局冷氣規劃，歡迎您先加 LINE 傳現場照片或平面圖。技師團隊會在線上提供初步判斷，並約定時間到府做實地勘查與估價。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac_installation_pingtung", cta_position: "pingtung_photo_box" }}
                  className="w-full sm:flex-1 min-h-[56px] bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                >
                  <span>LINE 傳現場照片</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  className="w-full sm:flex-1 min-h-[56px] bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <span>屏東冷氣安裝估價</span>
                </CTAButton>
              </div>
            </div>

            {/* Navigation links (Corrected to remove forbidden paths) */}
            <div className="mt-12 pt-8 border-t border-slate-900 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
              <Link href="/services/ac-installation/" className="text-sky-400 hover:underline">冷氣安裝服務 &rarr;</Link>
              <Link href="/services/ac-installation/split-ac/" className="text-sky-400 hover:underline">家用分離式冷氣安裝 &rarr;</Link>
              <Link href="/contact/" className="text-sky-400 hover:underline">預約現場估價場勘 &rarr;</Link>
            </div>

          </div>

        </div>
      </section>

      {/* Visible FAQ Section */}
      <section className="py-16 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">屏東冷氣安裝 FAQ</h2>
            <p className="text-sm text-slate-400 mt-3">提供您冷氣安裝、規格選擇與排程的常見問題排查說明。</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：屏東冷氣安裝如何選擇合適的噸數？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：冷氣噸數選擇通常與房間坪數、西曬狀況、挑高程度、頂樓或鐵皮屋頂等環境條件有關，仍需依現場格局、安裝位置與使用需求評估。</p>
            </div>

            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：冷氣室外機安裝在頂樓或陽光直射處需要注意什麼？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：高溫或日曬環境可能影響室外機周邊散熱條件。安裝位置需依現場通風、日曬、牆面固定與施工安全評估；若需要遮蔽，也應避免影響室外機出風與維修空間。</p>
            </div>

            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：屏東冷氣安裝如何安排預約？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：屏東地區冷氣安裝會依案件類型、服務位置、現場條件與當期派工狀況進行排程溝通，實際安排仍以雙方確認為準。</p>
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
