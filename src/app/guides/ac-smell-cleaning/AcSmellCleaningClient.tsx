"use client";

import React from "react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function AcSmellCleaningClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Breadcrumb */}
      <div className="bg-slate-950 py-3 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex text-xs text-slate-500 space-x-2">
            <Link href="/" className="hover:text-sky-400">首頁</Link>
            <span>/</span>
            <span className="text-slate-400">服務指南</span>
            <span>/</span>
            <span className="text-slate-355 truncate">冷氣有霉味、風量變小怎麼辦</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="py-16 bg-slate-950 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <header className="mb-10 text-center sm:text-left">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30 inline-block mb-4">
              空調清洗指引
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              冷氣有霉味、風量變小怎麼辦？清洗保養前先確認這幾件事
            </h1>
            
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span>發佈日期：2026-06-17</span>
              <span>•</span>
              <span>分類：冷氣清洗保養</span>
            </div>
          </header>

          {/* Core Conclusion */}
          <div className="bg-sky-950/15 border-l-4 border-sky-500 p-6 rounded-r-xl mb-10 text-slate-300 text-sm sm:text-base leading-relaxed">
            <strong className="text-sky-400 block mb-2">核心結論</strong>
            冷氣有霉味或風量變小，常見原因包含濾網髒污、蒸發器積垢、風鼓髒污、排水環境或長期未保養。是否需要清洗或檢修，建議先依機型、使用狀況與現場條件判斷。
          </div>

          <div className="space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-900 pb-2">
                一、冷氣有霉味的常見原因
              </h2>
              <p>
                冷氣在運轉時，蒸發器表面會產生大量的凝結水。若關機後內部環境保持溫暖潮濕，最容易滋生黴菌與細菌。常見引起異味的原因包括：
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>內部發霉</strong>：蒸發器鰭片、水盤、以及風鼓鼓風輪表面滋生黴菌，形成滑溜的生物膜。</li>
                <li><strong>排水管異味回流</strong>：排水管直接接到大樓的廢水管、雨水管或水溝，且沒有設計存水彎，導致管道內的沼氣或廢水臭味直接吸回室內。</li>
                <li><strong>環境異味殘留</strong>：室內裝潢防潮不良、寵物皮屑、烹飪油煙、或抽菸等氣味被吸入附著在冷氣塑膠外殼及鰭片上。</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-900 pb-2">
                二、冷氣風量變小的可能原因
              </h2>
              <p>
                出風量明顯減弱，會使冷氣散熱能效大打折扣，造成房間冷房緩慢。可能原因包含：
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>濾網嚴重卡塵</strong>：防塵網太久沒洗，灰塵完全堵住進風路徑，使氣流吸不進去、吹不出來。</li>
                <li><strong>鼓風輪堵塞</strong>：出風口內的風鼓葉片縫隙卡滿一圈圈的髒污、棉絮或黴菌，阻礙葉片撥風效能。</li>
                <li><strong>蒸發器結霜或結冰</strong>：可能因系統漏冷媒或散熱極差導致結冰，堵死了風道。</li>
                <li><strong>硬體異常</strong>：如控制基板電容老化、風扇馬達軸承磨損導致轉速不足，這需要技師精密檢查。</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-900 pb-2">
                三、清洗保養前可以先檢查哪些地方
              </h2>
              <p>
                在安排專業人員到府前，您可以先做以下簡單檢查，確認是否只需自行排除：
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>拆下濾網檢查</strong>：將濾網取出清洗，若洗乾淨後風量即恢復，代表只是表層堵塞。</li>
                <li><strong>觀察出風口內部</strong>：使用手電筒照向出風口，用肉眼觀察轉動的鼓風輪上是否卡有黑色黴菌斑點或棉絮。</li>
                <li><strong>確認運轉聲音</strong>：如果出風時有強弱不均的波動聲、或卡卡的異音，大多是鼓風輪卡垢嚴重不平衡所致。</li>
              </ol>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-900 pb-2">
                四、室內機清洗與室外機清洗差異
              </h2>
              <p>
                完整的清洗保養一般包含室內機與室外機兩部分，兩者的施作內容與效果有所不同：
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>室內機清洗</strong>：使用水袋與防塵防護措施，將水盤、蒸發器鰭片、鼓風輪用專業高壓水槍徹底沖洗，主要是改善風量、異味、粉塵飛散以及內部霉垢，並暢通排水孔防止溢水。</li>
                <li><strong>室外機清洗</strong>：室外機主要是鰭片散熱。若鰭片堆積棉垢或油垢，熱交換率下降會導致主機跳機甚至耗電增加。高壓沖洗鰭片有助於恢復散熱效率，達到省電目的。</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-900 pb-2">
                五、清洗與維修如何判斷
              </h2>
              <p>
                冷氣異常不一定是髒污引起的，有時屬於零件故障。您可以透過以下要點做初步區分：
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>清洗保養適用</strong>：運轉及冷度正常，但有霉味、黑屑噴出、風速變慢、出風忽大忽小，或是水盤堵塞造成的溢水滴水。</li>
                <li><strong>維修檢修適用</strong>：完全無法開機、面板閃燈報錯誤代碼、只吹送風（壓縮機沒動，完全無冷度）、或機器運作時發出金屬撞擊等劇烈噪音。</li>
              </ul>
            </section>

            {/* Comparison Table */}
            <section className="space-y-4 py-4">
              <h3 className="text-lg font-bold text-white">冷氣異常狀況自我排查表</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 border border-slate-800 text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold border-r border-slate-800">狀況</th>
                      <th className="px-4 py-3 text-left font-bold border-r border-slate-800">可能原因</th>
                      <th className="px-4 py-3 text-left font-bold">建議處理方向</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-800 font-semibold text-slate-200">有霉味</td>
                      <td className="px-4 py-3 border-r border-slate-800">蒸發器與水盤發霉、滋生黴菌與生物膜</td>
                      <td className="px-4 py-3">進行防霉深層高壓清洗</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-800 font-semibold text-slate-200">風量變小</td>
                      <td className="px-4 py-3 border-r border-slate-800">鼓風輪卡滿棉絮灰塵、濾網阻塞</td>
                      <td className="px-4 py-3">清洗鼓風輪與防塵濾網</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-800 font-semibold text-slate-200">出風不均</td>
                      <td className="px-4 py-3 border-r border-slate-800">風鼓部分葉片被髒污堵死、馬達轉速異常</td>
                      <td className="px-4 py-3">進行風鼓清洗，若馬達異常需安排檢修</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-800 font-semibold text-slate-200">排水異味</td>
                      <td className="px-4 py-3 border-r border-slate-800">排水管連接大樓排水溝、未做存水彎</td>
                      <td className="px-4 py-3">進行水盤清洗，並評估排水管改道或加裝存水彎</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-800 font-semibold text-slate-200">清洗後仍異常</td>
                      <td className="px-4 py-3 border-r border-slate-800">零件故障（如電容或基板）、漏冷媒</td>
                      <td className="px-4 py-3">安排技師到府進行故障查檢與維修</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-900 pb-2">
                六、LINE 傳照片時建議提供哪些資訊
              </h2>
              <p>
                為了讓技師在線上更精準地評估與報價，當您透過官方 LINE 諮詢時，建議提供以下資訊：
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>冷氣台數與類型</strong>：例如分離式 2 台、吊隱式 1 台。</li>
                <li><strong>室內機照片</strong>：正面外觀照片，以及用手電筒照出風口內部的特寫，方便觀察風鼓發霉情況。</li>
                <li><strong>室外機位置照片</strong>：室外機的安裝環境，方便判斷高空或特殊作業環境。</li>
                <li><strong>機器使用年份與狀況說明</strong>：例如是否有漏水、使用約幾年，以利評估是否有機器老舊的脆化風險。</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-900 pb-2">
                七、什麼情況建議安排檢查
              </h2>
              <p>
                If 您的冷氣有異味但出風完全是常溫（主機沒在運轉）、清洗後過幾天依然滴水、或者出風口完全沒有風吹出，這可能代表不僅是髒污問題，而是線路、冷媒系統或馬達硬體有所磨損故障。此時建議由專業技師安排實地查檢與評估，找出核心病因後對症下藥。
              </p>
            </section>

            {/* CTAs inside article */}
            <div className="pt-6 text-center space-y-6">
              <h3 className="text-base font-bold text-white">冷氣霉味風量小？請 LINE 傳照初步分析或預約清洗</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click" trackParams={{ service_type: "ac_cleaning", cta_position: "guide_ac_smell" }}
                  className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>LINE 傳照片評估</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>預約現場清洗</span>
                </CTAButton>
              </div>
              
              <div className="flex justify-center gap-6 text-xs text-sky-400 font-semibold">
                <Link href="/lp/ac-cleaning/" className="hover:underline">冷氣清洗廣告專區 &rarr;</Link>
                <Link href="/services/ac-cleaning/" className="hover:underline">變頻冷氣清洗服務 &rarr;</Link>
                <Link href="/faq/" className="hover:underline">常見保養問題 &rarr;</Link>
              </div>
            </div>

            {/* FAQ Section */}
            <section className="space-y-6 pt-10 border-t border-slate-900">
              <h2 className="text-xl font-bold text-white text-center mb-6">冷氣發霉與清洗常見問答 FAQ</h2>
              
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：冷氣有霉味一定需要清洗嗎？</h3>
                  <p className="text-slate-450 text-xs sm:text-sm">答：不一定。若只是防塵濾網上有灰塵，自行清洗濾網即可改善；但若異味來自蒸發器內部鰭片、深處的水盤或風鼓（鼓風輪）上的黴菌與果凍狀生物膜，則需要專業人員使用高壓清洗機搭配無毒藥劑進行深層清洗才能改善。</p>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：冷氣風量變小一定是髒污嗎？</h3>
                  <p className="text-slate-455 text-xs sm:text-sm">答：不一定。最常見的原因是風鼓與濾網卡滿灰塵與棉絮，阻擋了出風氣流，清洗後通常可恢復風速。但也有可能是室內風扇馬達軸承磨損導致轉速變慢、啟動電容老化衰退、或是控制基板訊號故障，需要到府進行現場診斷。</p>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：可以只清室內機嗎？</h3>
                  <p className="text-slate-455 text-xs sm:text-sm">答：可以。室內機是主要的冷風出口與熱交換器，冷氣發霉、有霉味、粉塵飛散或滴水問題大都與室內機有關。若預算有限，可優先清洗室內機；但若室外機鰭片堆積大量塵土落葉影響散熱，仍建議一併施作。</p>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：室外機也需要清洗嗎？</h3>
                  <p className="text-slate-455 text-xs sm:text-sm">答：需要。室外機長期置於室外，冷凝鰭片容易累積塵垢、寵物毛髮或落葉。當散熱鰭片被嚴重堵塞時，主機散熱不良會使壓縮機高溫過載而跳機，同時提高耗電量。清洗室外機有助於恢復散熱效率，達到省電目的並延長壓縮機壽命。</p>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：清洗和維修怎麼判斷？</h3>
                  <p className="text-slate-455 text-xs sm:text-sm">答：若冷氣運轉功能正常且有冷風，但伴隨霉味、出風量變小或出風口滴水，通常只需進行「清洗保養」。若冷氣完全無法啟動、電源燈閃爍報錯誤代碼、只吹送風（壓縮機沒動，完全無冷度）、或機器運作時發出金屬撞擊等劇烈噪音，則屬於「維修檢修」範圍。</p>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                  <h3 className="font-bold text-white mb-2">Q：可以先 LINE 傳照片確認嗎？</h3>
                  <p className="text-slate-455 text-xs sm:text-sm">答：可以。建議將室內機的正面外觀、掀開面板後的濾網狀況、出風口內部鰭片或風鼓的特寫照片，以及室外機的安裝環境拍照上傳至我們的官方 LINE，技師可協助進行初步的機型確認與施作評估。</p>
                </div>
              </div>
            </section>

          </div>

        </div>
      </article>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="ac_cleaning"
        phoneText="撥打清洗諮詢專線"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
