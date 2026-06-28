"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

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
    description: "分離式與吊隱式冷氣環保中性藥劑深層高壓清洗。徹底消除出風發霉異味、改善風量變小問題，維持節電能效。"
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

export default function KaohsiungAreaClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Kaohsiung Hero */}
      <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            高雄在地服務
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            高雄冷氣空調服務｜冷氣安裝、維修、清洗與商用空調規劃
          </h1>
          <p className="text-base sm:text-lg text-slate-200 mt-4 leading-[1.8] max-w-2xl mx-auto">
            焓耀空調提供高雄全區冷氣安裝、保養與維修服務。我們配備專業技師車隊，服務均依現場排程與狀況儘速為您安排。
          </p>
        </div>
      </section>

      {/* Local Services Section */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">專業冷氣空調工程服務</h2>
            <p className="text-sm sm:text-base text-slate-200 mt-2 leading-[1.8]">依現場坪數、熱源與管線長度進行實地查勘評估，報價透明安心。</p>
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
                  預約高雄服務評估
                </CTAButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kaohsiung Climatic & Environmental Air Challenges Section */}
      <section className="py-16 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-sky-500 pl-3">高雄在地冷氣空調規劃三大要點：氣候、水質與環境挑戰</h2>
          <p className="text-base sm:text-lg text-slate-200 leading-[1.8] mb-8">
            高雄由於臨海氣候、高溫潮濕、以及部分行政區水質偏硬，在安裝與保養冷氣空調時，必須針對這些在地環境挑戰進行特殊設計，才能有助於維持設備能效。
          </p>
          
          <div className="space-y-8 text-slate-200 text-base sm:text-lg leading-[1.8]">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850/60">
              <h3 className="text-lg font-bold text-white mb-3">1. 臨海高濕與高溫環境（防腐蝕與散熱設計）</h3>
              <p>
                高雄夏季漫長且氣溫經常突破 34°C 至 36°C，且沿海行政區（如鼓山、前鎮、小港、左營）空氣中含有較高濕度與微量鹽分。室外機鰭片長期暴露於此環境下極易受腐蝕。這會導致熱交換率衰退、主機耗電增加或冷媒外洩。因此，我們建議在安裝時挑選具備<strong>防鏽防腐蝕鍍層（藍波防鏽）</strong>的機型，並於保養時檢查室外機散熱環境。
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850/60">
              <h3 className="text-lg font-bold text-white mb-3">2. 局部硬水質挑戰（商用中央空調水垢防範）</h3>
              <p>
                高雄部分行政區（如鳳山、大寮、仁武、楠梓）水質硬度偏高，水中富含鈣、鎂等礦物質。對於使用冷卻水塔與冰水主機的商用中央空調而言，冷卻水在循環蒸發過程中極易結晶沉積形成水垢，阻礙冷媒散熱管路的熱交換效率，嚴重時會迫使主機超載運轉。技師在施作保養時，會針對水質狀況進行<strong>通管清洗、冷卻水塔藥洗</strong>與定期排污，以維持系統能效。
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850/60">
              <h3 className="text-lg font-bold text-white mb-3">3. 大樓外牆與透天高空作業（抗颱與用電安規）</h3>
              <p>
                高雄市區有許多高密度住宅大樓與透天厝，室外機的吊掛位置常位於女兒牆外側、懸空陽台或無站立點的外牆。這不僅增加了技師查檢與保養的難度，更考驗抗颱支架的結構剛性。我們技師堅持採用<strong>標準加厚白鐵支架與膨脹螺絲固定</strong>，並嚴格落實雙鉤高空作業安全規範，降低墜落及颱風吹落風險，確保人身與公眾安全。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local SEO FAQ Section */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">高雄冷氣安裝與保養常見問題 FAQ</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：高雄靠近臨海地區，冷氣室外機該如何保養防腐蝕？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：高雄臨海區域空氣鹽分高、環境潮濕，容易導致散熱鰭片生鏽。建議定期安排專業技師到府進行室外機沖洗，清除鰭片表面的鹽分與沙塵積垢，並在安裝時選用防蝕效果佳的白鐵安裝支架，可有助於減緩鏽蝕劣化風險。</p>
            </div>
            
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：為什麼高雄商用中央空調或冰水主機需要定期通管？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：因為高雄部分地區自來水硬度偏高，水中鈣鎂離子在冷卻水塔運行時極易在大氣蒸發下形成水垢，阻礙冷卻交換效率，增加壓縮機耗電負載。因此，商用與中央空調保養時，通管與水垢化學清洗顯得格外重要。</p>
            </div>
            
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-850">
              <h3 className="font-bold text-white mb-2 text-lg">Q：大樓外牆冷氣安裝時，會額外收取吊車或危險施工費嗎？</h3>
              <p className="text-slate-200 text-base sm:text-lg leading-[1.8]">答：這需要視現場環境而定。如果室外機吊掛在完全無站立點的外牆、需要技師跨出陽台懸空施作，或現場樓層過高無法配合室內施工，我們會依規定評估是否需要吊車或特殊高空安全防護作業，並在現場估價時清楚列明，雙方同意後才會施作，避免產生後續加價爭議。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Districts List */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">高雄服務行政區域</h2>
          <p className="text-base text-slate-200 mb-8 max-w-lg mx-auto">
            技師團隊備有專業工程巡迴車，提供高雄市區及周邊鄉鎮依排程安排到府查檢：
          </p>
          
          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
            {districts.map((dst, idx) => (
              <span 
                key={idx}
                className={`text-sm sm:text-base py-2 px-4 rounded-lg border ${
                  dst.includes("洽詢") 
                    ? "bg-slate-900 border-orange-500/30 text-orange-400 font-semibold" 
                    : "bg-slate-900/60 border-slate-850 text-slate-200"
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
                className="w-full sm:flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-base sm:text-lg min-h-[56px] shadow-md transition-all"
              >
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>高雄服務立即撥打</span>
              </CTAButton>
              
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "general", cta_position: "kaohsiung_area_page" }}
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
