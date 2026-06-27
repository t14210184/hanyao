"use client";

import React from "react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

const checkSteps = [
  {
    step: "步驟一：檢查室內機防塵網是否堵塞",
    detail: "防塵濾網卡滿灰塵會使風量驟減，導致熱交換效率極低，冷空氣無法吹出。請先拆下濾網沖洗乾淨、陰乾後裝回，觀察冷風是否恢復。"
  },
  {
    step: "步驟二：檢查室外機周圍是否堆積雜物",
    detail: "室外機負責將室內的熱量排出。若室外機前方堆放盆栽、雜物，或安裝在通風受阻的窄道中，會造成熱風短路回流，主機過熱降頻或跳機保護。"
  },
  {
    step: "步驟三：確認遙控器運轉模式與溫度設定",
    detail: "請檢查遙控器是否誤設定為『送風』或『除濕』模式。建議設定為『冷氣』模式，並確認設定溫度低於室內環境溫度，觀察壓縮機是否正常起動。"
  }
];

export default function AcNotColdClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Breadcrumb Navigation on Front-end */}
      <div className="bg-slate-950 py-3 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex text-xs text-slate-500 space-x-2">
            <Link href="/" className="hover:text-sky-400">首頁</Link>
            <span>/</span>
            <span className="text-slate-400">服務指南</span>
            <span>/</span>
            <span className="text-slate-350 truncate">冷氣不冷排查指南</span>
          </nav>
        </div>
      </div>

      {/* Article Content */}
      <article className="py-16 bg-slate-950 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <header className="mb-10 text-center sm:text-left">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30 inline-block mb-4">
              空調排查指南
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              冷氣不冷怎麼辦？高雄 / 屏東空調工程師建議先檢查這 3 件事
            </h1>
            
            {/* Core conclusion box */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong className="text-sky-400 block mb-1">核心結論：</strong>
              冷氣不冷常見原因包含濾網髒污、室外機散熱不良、冷媒系統異常或電控零件問題。若基本清潔與散熱確認後仍無改善，建議拍照或錄影後 LINE 傳給專業人員初步判斷。
            </div>
          </header>

          <div className="space-y-10 text-xs sm:text-sm text-slate-450 leading-relaxed">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">一、冷氣不冷的常見原因</h2>
              <p>
                當冷氣開啟後只吹出像電風扇一般的送風，或是風量微弱、溫度降不下來時，請先了解原因可能非常多樣，並非單純「補冷媒」就能解決。主要原因包含：
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>環境與清潔條件：</strong>防塵濾網卡滿棉絮、灰塵或寵物毛髮；室內機或室外機鋁鰭片卡滿油煙髒污。</li>
                <li><strong>室外機散熱受阻：</strong>室外機出風方向被建築物外牆、雜物或盆栽擋住，導致熱量無法排出。</li>
                <li><strong>冷媒系統壓力異常：</strong>管路可能因物理磨損或老舊接口鬆動而微漏冷媒，導致冷凍噸數不足。</li>
                <li><strong>電控零件老舊受損：</strong>壓縮機運作所需的啟動電容衰退燒毀、控制基板保險絲燒斷，或感溫器失靈。</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">二、可以自行檢查的 3 個步驟</h2>
              <div className="space-y-4">
                {checkSteps.map((step, idx) => (
                  <div key={idx} className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                    <h3 className="font-bold text-white mb-2">{step.step}</h3>
                    <p className="text-slate-400">{step.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* HTML Table Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">三、冷氣不冷自我排查對照表</h2>
              <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-900/20">
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-300">
                      <th className="p-3 font-semibold">可能原因</th>
                      <th className="p-3 font-semibold">可自行檢查方法</th>
                      <th className="p-3 font-semibold">是否建議預約專業檢修</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-350">
                    <tr>
                      <td className="p-3 font-medium text-white">濾網嚴重卡塵</td>
                      <td className="p-3">拆卸濾網查看是否透光、清洗乾淨</td>
                      <td className="p-3 text-slate-500">否（可自行處理）</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">室外機散熱受阻</td>
                      <td className="p-3">確認室外機出風口無雜物堆積與遮擋</td>
                      <td className="p-3 text-slate-500">否（可自行清除雜物）</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">電容燒毀 / 控制板故障</td>
                      <td className="p-3">濾網乾淨但室外壓縮機不運轉、無熱風排出</td>
                      <td className="p-3 text-orange-400 font-medium">是（需拆機檢測安規）</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">冷媒系統洩漏</td>
                      <td className="p-3">銅管接頭處有明顯結霜、冷度逐月衰退</td>
                      <td className="p-3 text-orange-400 font-medium">是（需加壓查漏與補漏）</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">風扇馬達損壞</td>
                      <td className="p-3">開機後只吹送風，室內機無出風量或伴隨劇烈異音</td>
                      <td className="p-3 text-orange-400 font-medium">是（需現場更換馬達零件）</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">四、為什麼冷氣不冷不要「只靠補冷媒」判斷</h2>
              <p>
                許多客戶遇到冷氣不冷，會要求師傅「直接灌冷媒」。然而，冷氣是一個密閉的循環系統，如果系統沒有洩漏，冷媒是不會平白無故消失的。
              </p>
              <p>
                如果系統管路有微漏（例如接頭鬆動、蒸發器銅管砂孔），只灌冷媒而不進行查漏焊接，冷媒通常會在數天或數週內再度漏光。此外，在髒污堵塞或電器零件損壞的情況下盲目補充冷媒，會使系統壓力過高，進而導致壓縮機燒毀，得不償失。
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">五、如何預約檢修與 LINE 傳照初步分析</h2>
              <p>
                當您完成基本清潔與散熱排除，冷氣依然只吹風不冷時，建議您加我們的官方 LINE 帳號進行諮詢。為了幫助技師在線上更精準地進行初步狀況分析，傳送訊息時建議提供以下資訊：
              </p>
              <ul className="list-decimal pl-5 space-y-2">
                <li><strong>冷氣型號銘牌照片：</strong>通常貼在室內機下方或室外機側面，以利技師查詢機器規格與零件圖。</li>
                <li><strong>室外機安裝環境照片：</strong>拍攝主機周邊空間，讓技師評估是否涉及高空吊裝安全。</li>
                <li><strong>目前冷氣運作狀態與聲音：</strong>說明出風口是否只有常溫送風，如有異音可錄製簡短影片。</li>
                <li><strong>控制面板故障代碼：</strong>若有出現閃爍燈號或代碼（如 E1, F3 等），請一併拍照提供。</li>
              </ul>
              <p className="text-orange-400 font-semibold mt-4">
                ※ 焓耀空調秉持誠實診斷，我們不捏造數據，亦不盲目灌冷媒。技師會依約定排程到府現場檢測分析，詳細說明故障點與報價，同意後才施作。
              </p>
            </section>

            {/* FAQ Section */}
            <section className="space-y-4 pt-6 border-t border-slate-900">
              <h2 className="text-lg font-bold text-white">常見問題解答 FAQ</h2>
              <div className="space-y-4">
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：冷氣不冷是不是一定要補冷媒？</h3>
                  <p className="text-slate-450 text-xs sm:text-sm">答：不一定。冷氣不冷最常見的原因是濾網髒污、冷凝器卡灰塵導致風阻過大，或是室外機散熱空間被雜物阻擋。如果是漏冷媒，必須先找出漏水點焊接修補，否則只加冷媒依然會反覆漏光，且容易導致壓縮機過載燒毀。</p>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：自行清洗濾網後，冷氣還是不冷該怎麼辦？</h3>
                  <p className="text-slate-450 text-xs sm:text-sm">答：如果濾網乾淨、室外機通風良好卻仍只吹送風，可能是壓縮機啟動電容損壞、主控板受損或冷媒管路微漏。建議先關閉電源，拍照或錄製冷氣運轉聲音，LINE 傳給專業師傅協助初步分析。</p>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：技師到府檢查冷氣不冷一般會做哪些項目？</h3>
                  <p className="text-slate-455 text-xs sm:text-sm">答：我們會進行系統性的查檢，包含出風口溫差量測、壓縮機運轉電流測量、冷媒高低壓壓力檢測、控制訊號線與基板診斷，並觀察鰭片髒污程度，依現場狀況與檢測數據向您說明最合適的處理方式。</p>
                </div>
              </div>
            </section>

            {/* CTAs */}
            <div className="pt-6 text-center space-y-6">
              <h3 className="text-base font-bold text-white">冷氣持續不冷？請 LINE 傳照初步分析或預約檢修</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click" trackParams={{ service_type: "ac_repair", cta_position: "guide_ac_not_cold" }}
                  className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>LINE 傳照片初步判斷</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>預約檢修諮詢</span>
                </CTAButton>
              </div>
              
              <div className="flex justify-center gap-6 text-xs text-sky-400 font-semibold">
                <Link href="/lp/ac-repair/" className="hover:underline">冷氣維修廣告專區 &rarr;</Link>
                <Link href="/services/ac-repair/" className="hover:underline">變頻冷氣檢修服務頁 &rarr;</Link>
              </div>
            </div>

          </div>

        </div>
      </article>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="ac_repair"
        phoneText="撥打冷氣檢修專線"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
