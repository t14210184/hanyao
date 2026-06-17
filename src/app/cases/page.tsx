"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function CasesPage() {
  const pageTitle = "工程實績與案例方向｜舊網站公開資料整理 - 焓耀空調";
  const pageDescription = "焓耀空調工程提供高雄與屏東商用及家用空調實績案例方向，包含第一銀行、精密工業、化學工廠空調規劃、農科大廠、六吋盤早午餐與冰水主機拆組。實地到府場勘提供解決方案。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "工程實績與案例方向",
    "description": pageDescription,
    "url": "https://www.hanyao.com.tw/cases/"
  };

  const cases = [
    {
      title: "第一銀行",
      type: "商用中央空調與分區溫控",
      area: "高雄市",
      details: "配合分行辦公區與櫃檯格局，規劃高效率變頻多聯式空調與風管配置，確保空調出風均勻無死角。",
      notice: "金融機構施工作業需嚴格控制噪音與防塵，管線穿牆皆完成防火填塞與雙重絕緣密封。"
    },
    {
      title: "精密工業相關工程",
      type: "恆溫恆濕精密控制",
      area: "屏東縣 / 廠辦",
      details: "為產線機房設計精密空調配合排氣補風平衡系統，維持溫濕度在嚴格標準範圍內，防範精密製程因發熱而停擺。",
      notice: "需精算設備總負荷發熱量，並架設高負載用電盤與微正壓排氣管網。"
    },
    {
      title: "化學工廠空調工程",
      type: "防爆與特殊通風空調",
      area: "高雄市 / 工廠",
      details: "針對化學廠防爆環境要求，規劃特定等級防爆主機、防蝕處理銅管，搭配高效全熱交換器換氣系統。",
      notice: "室外機位置與維護動線需考量排污氣流方向，並配備完整工安高空吊裝保護防墜設備。"
    },
    {
      title: "農科大廠",
      type: "大型廠區冰水主機工程",
      area: "屏東農業生物科技園區",
      details: "規劃建置氣冷與水冷式冰水主機，配合大口徑配管及水路平衡閥門控制，提供廠房穩定冷凍水循環。",
      notice: "配合廠區生產排程進行深夜主機吊裝吊運，嚴格執行系統抽真空乾燥與加壓洩漏測試。"
    },
    {
      title: "六吋盤早午餐",
      type: "商業餐飲空間空調配置",
      area: "高雄/屏東連鎖店面",
      details: "高靜壓分離式空調搭配局部大風量風管設計，阻絕廚房油煙熱氣逸散，為顧客區提供舒適均勻的冷房溫度。",
      notice: "商用店面需特別注意排水斜度與凝結水引流，避免冷氣滴水損害裝潢天花板。"
    },
    {
      title: "前金運動中心工程案",
      type: "大型挑高空間冷房與通風",
      area: "高雄市",
      details: "針對運動場館高挑高、人潮湧入熱負荷大之特點，規劃大型氣冷式主機搭配大風量出風噴嘴，達成快速冷房。",
      notice: "高空管路敷設涉及路權申請與高空吊車聯合作業，技師全程穿戴雙鉤防墜吊帶施工。"
    },
    {
      title: "商業展場日立多聯變頻清洗保養",
      type: "商用空調高壓藥劑深層清洗",
      area: "高雄市 / 展館",
      details: "針對展場多聯式壁掛機及嵌入式室內機，以專用保護罩與高壓沖洗槍，徹底清除積累粉塵、黴菌與出風孔生物膜。",
      notice: "清洗前做好完整的裝潢與電氣盤防水保護，疏通冷凝水管並檢測馬達運轉電流。"
    },
    {
      title: "鋼鐵廠 180 噸滿液式冰機拆組",
      type: "重工業冰水主機維修汰換",
      area: "高雄市",
      details: "配合重工業廠房動線，將老舊冰水機系統進行定量冷媒回收封存、物理拆卸，重新定位安裝高效滿液式主機。",
      notice: "重型機具涉及高噸位起重吊掛安全，管線法蘭墊片接合面精密研磨防漏。"
    },
    {
      title: "高雄重仁骨科醫院",
      type: "醫療診所特殊氣流與空調維護",
      area: "高雄市",
      details: "對病房與診間規劃防霉防菌出風口、空氣過濾網更換，並為各冷媒分配閥進行壓力與訊號巡檢。",
      notice: "醫療環境對落塵要求極高，施工必須安排於非門診時段，並配備吸塵圍幕防止交叉污染。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.hanyao.com.tw/cases/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Cases Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-slate-900/20 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              案例與實績
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight">
              工程實績與案例方向
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              （舊網站公開資料整理之工程實績 / 案例方向。商用大系統涉及複雜的管路、電力配線與建物荷載。我們堅持實務查勘，不捏造省電能效或回本時間。）
            </p>
          </div>
        </section>

        {/* Cases Grid */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cases.map((item, index) => (
                <div 
                  key={index}
                  className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden flex flex-col hover:border-slate-750 transition-all duration-300 shadow-md group"
                >
                  {/* CSS/SVG Gradient Graphic Placeholder */}
                  <div className="h-48 w-full bg-gradient-to-br from-slate-900 to-slate-950 relative flex items-center justify-center overflow-hidden border-b border-slate-850">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20"></div>
                    <div className="absolute w-24 h-24 rounded-full bg-sky-500/5 blur-xl pointer-events-none"></div>
                    
                    {/* Visual Blueprint Emblem */}
                    <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center z-10 text-sky-400 font-bold group-hover:scale-105 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>

                    <span className="absolute bottom-3 right-3 text-[10px] bg-slate-950/80 text-slate-500 border border-slate-850 px-2 py-0.5 rounded">
                      藍圖編號 #{1000 + index}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[10px] font-bold text-sky-450 uppercase tracking-widest block bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/25">
                          {item.type}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0">{item.area}</span>
                      </div>
                      <h2 className="text-lg font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {item.details}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-850/60 text-[11px] text-orange-400/90 leading-relaxed">
                      <span className="font-semibold block text-slate-500 mb-0.5">工安與注意事項：</span>
                      {item.notice}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-16 text-center max-w-2xl mx-auto space-y-6">
              <h3 className="text-xl font-bold text-white">商用與特殊場域空調，需要詳細的現場勘查</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                商用工程涉及冷凍噸位精算、冷媒與冰水配管線路、用電安全配置與消防空間避讓。我們堅持實務查勘，不建議以電話直接報死價。歡迎先 LINE 傳平面圖或現場照片初步分析。
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
                <CTAButton
                  href={siteConfig.phone1Link}
                  trackEventName="phone_click"
                  trackParams={{ service_type: "commercial_ac", cta_position: "cases_page" }}
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
                  trackParams={{ service_type: "commercial_ac", cta_position: "cases_page" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>LINE 傳圖初步判斷</span>
                </CTAButton>
              </div>

              <div className="pt-2">
                <CTAButton
                  href="/contact/"
                  trackEventName="quote_request"
                  trackParams={{ service_type: "commercial_ac", cta_position: "cases_page_booking" }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-350 transition-colors"
                >
                  <span>預約商用空調現場估價場勘 &rarr;</span>
                </CTAButton>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="commercial_ac"
          phoneText="撥打專線諮詢"
          lineText="加 LINE 傳照評估"
          onPhoneClick={() => trackEvent("lp_cta_click", { service_type: "commercial_ac", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("lp_cta_click", { service_type: "commercial_ac", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
