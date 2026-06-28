"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

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
    description: "以專業防塵保護與高壓水槍，深層清洗鼓風輪與水盤積塵黴菌，改善出風霉味並維持良好風量循環。"
  },
  {
    title: "屏東商用空調",
    description: "工廠、廠辦大樓與連鎖餐飲店面中大型空調規劃。規劃變頻多聯式 VRV 系統，兼顧節能與氣流循環。"
  },
  {
    title: "屏東在地服務",
    description: "本團隊登記地址位於屏東市建南路，均採派工到府行動服務（無對外開放實體門市）。實地場勘規劃，估價透明，維護便利有保障。"
  }
];

const districts = [
  "屏東市", "潮州", "萬丹", "長治", "內埔", "竹田", "麟洛"
];

export default function PingtungAreaClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Pingtung Hero */}
      <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/10 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            屏東在地服務
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            屏東冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃
          </h1>
          <p className="text-base sm:text-lg text-slate-200 mt-4 leading-[1.8] max-w-2xl mx-auto">
            我們為高屏地區合規登記之冷凍空調公司，提供屏東在地到府規劃與安裝維護（均採派工到府行動服務，無對外開放實體門市）。提供家用及商用空調到府巡檢與場勘，將依當期派工狀況依序為您安排。
          </p>
        </div>
      </section>

      {/* Local Services Section */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">專業冷氣空調工程服務</h2>
            <p className="text-sm sm:text-base text-slate-200 mt-2 leading-[1.8]">提供屏東在地化專業規劃，現場精密檢測分析，透明報價。</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((srv, idx) => (
              <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-850/60 pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
                    {srv.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-200 leading-[1.8] mb-6">
                    {srv.description}
                  </p>
                </div>
                <CTAButton
                  href="/contact/"
                  className="w-full text-center py-3 bg-slate-850 hover:bg-sky-500 text-white font-semibold rounded-lg border border-slate-800 hover:border-sky-500 text-sm min-h-[44px] transition-colors"
                >
                  預約屏東服務評估
                </CTAButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pingtung Climatic & Environmental Air Challenges Section */}
      <section className="py-16 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-sky-500 pl-3">屏東在地冷氣空調規劃三大要點：高溫日照、海風防鏽與強風挑戰</h2>
          <p className="text-base sm:text-lg text-slate-200 leading-[1.8] mb-8">
            屏東由於年日照時間長、氣溫炎熱，且部分地區面臨海風鹽分侵蝕與強烈風力，在冷氣空調的安裝規劃與維護保養上，必須考量以下在地地理與環境因素，方能有助於維護設備的正常運轉。
          </p>
          
          <div className="space-y-8 text-slate-200 text-base sm:text-lg leading-[1.8]">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850/60">
              <h3 className="text-lg font-bold text-white mb-3">1. 南台灣超長日照與高溫曝曬（主機散熱與配管防護）</h3>
              <p>
                屏東常年氣溫居高不下，室外機若長期處於日光直射的無遮蔽環境下，會使冷媒凝結溫度過高，影響冷房效果。我們技師在安裝時，會優先挑選具有遮陽或散熱良好的安裝位置，並對暴露在強烈陽光下的冷媒銅管外包覆<strong>高耐候抗 UV 保護防護膠帶</strong>，防範保溫棉脆化破損，作為防範冷媒管路老化的保護措施之一。
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850/60">
              <h3 className="text-lg font-bold text-white mb-3">2. 沿海鹽分腐蝕與強風吹襲（防鏽與白鐵支架固定）</h3>
              <p>
                屏東擁有漫長的海岸線，部分沿海鄉鎮（如東港、佳冬、林邊、枋寮等）空氣中帶有高鹽分。室外機鰭片若無適當防護，可能面臨生鏽與老化考量。此外，部分特定區域（如恆春半島）在秋冬季節會受到強烈落山風襲擊。因此，我們在安裝時會特別注重<strong>防鏽處理與加厚白鐵安裝支架</strong>，並使用膨脹螺絲強力固定，是防範主機受風力動搖或墜落的安全維護措施。
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850/60">
              <h3 className="text-lg font-bold text-white mb-3">3. 透天平房大跨距配管（冷凝排水斜度與電壓安全）</h3>
              <p>
                屏東住宅型態以透天厝與單層平房為主，在安裝冷氣時常面臨配管跨距較大或排水管路過長的問題。如果排水坡度計算不精準，容易造成積水回流漏水。我們的技師施作時，均嚴格遵守<strong>每公尺至少 1/100 的物理排水斜度</strong>，並對透天厝高負載的變頻冷氣獨立配線，是防範線路超載與漏水發霉的標準施工規範。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local SEO FAQ Section */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">屏東冷氣安裝與保養常見問題 FAQ</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：屏東太陽大且高溫，冷氣室外機需要安裝遮雨棚嗎？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：如果室外機安裝在陽光強烈直射的屋頂或外牆，加裝冷氣遮陽棚是遮擋直射光照的方式之一，能對室外機提供物理遮蔽。但遮陽棚安裝必須穩固，且不能阻擋室外機前方風扇的出風散熱空間，避免反而造成熱風迴流跳機。</p>
            </div>
            
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：沿海地區的冷氣室外機，生鏽了該怎麼處理？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：在海風鹽分較重的區域，室外機鰭片可能受到環境鹽分影響。如果只是輕微狀況，定期安排沖洗是防範積鹽的日常維護措施之一；若是鏽蝕嚴重導致散熱鰭片粉碎損壞或冷媒外漏，則應由技師到府查檢評估，判定是否需進行零件更換或採取其他適當的保護措施。</p>
            </div>
            
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：屏東地區預約冷氣安裝或清洗，排程與預約流程為何？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：我們提供屏東地區到府服務，均採派工到府行動服務（無對外開放實體門市）。預約到府場勘或施作，將由客服與您聯繫並依實際派工狀況規劃排定。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Districts List */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">屏東服務行政區域</h2>
          <p className="text-base text-slate-200 mb-8 max-w-lg mx-auto">
            提供以下屏東地區到府場勘、冷氣安裝清洗與故障排除：
          </p>
          
          <div className="flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto">
            {districts.map((dst, idx) => (
              <span 
                key={idx}
                className="text-sm sm:text-base py-2 px-4 bg-slate-900/60 border border-slate-850 text-slate-200 rounded-lg"
              >
                {dst}
              </span>
            ))}
          </div>
          
          <div className="mt-6">
            <span className="text-sm sm:text-base text-orange-400 font-semibold bg-slate-900 border border-orange-500/20 py-2.5 px-5 rounded-xl">
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
                className="w-full sm:flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-base sm:text-lg min-h-[56px] shadow-md transition-all"
              >
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>屏東服務立即撥打</span>
              </CTAButton>
              
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "general", cta_position: "pingtung_area_page" }}
                className="w-full sm:flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base sm:text-lg min-h-[56px] shadow-md shadow-green-950/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  );
}
