"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function CommercialAcServicePage() {
  const pageTitle = "商用空調工程｜中央空調、冰水主機、VRV 多聯式系統規劃維護 - 焓耀空調";
  const pageDescription = "高雄與屏東專業商用空調工程。服務工廠、餐廳店面、辦公大樓與特殊無塵室空間。提供變頻多聯式 VRV 系統、冰水主機設備定期巡檢保養與年度維修合約，先看現場熱源與動線再報價。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "商用空調工程服務",
    "description": pageDescription,
    "url": "https://www.xusen.pro/services/commercial-ac/"
  };

  const sectors = [
    {
      title: "餐廳與連鎖店面空調",
      description: "針對餐飲業的高油煙、廚房高溫與人員出入頻繁特性，規劃高靜壓分離式空調或嵌入式四方吹。阻絕熱氣倒灌，配置均勻冷房流速，防範冷氣滴水與排水堵塞。"
    },
    {
      title: "辦公大樓與廠辦空間",
      description: "多分區、隔間多之辦公空間。規劃高效率變頻多聯式 VRV 系統，可獨立分區溫控開關，避免無人空間空轉浪費，達到最大節電能效與便利管理。"
    },
    {
      title: "工廠與特定生產車間",
      description: "廠房空間挑高、機械發熱量高、落塵要求嚴格。規劃大風量氣冷式或水冷式中央空調系統，並整合排氣通風管道，提供穩定的製程生產溫濕度條件。"
    },
    {
      title: "特殊與精密環境空調",
      description: "診所醫療室、精密實驗室及特定無塵室空間。配置高效空氣過濾器換氣系統與防爆防蝕等級室外主機，嚴格控制落塵與微正壓，防範交叉污染。"
    },
    {
      title: "中央空調與冰水主機保養",
      description: "承接氣冷與水冷式冰水主機通管清洗、冷媒壓力運轉電流檢測。技師持專業證照施作，維持冰機冷卻能效，降低企業高額電費支出。"
    },
    {
      title: "商用年度維護維修合約",
      description: "適合工廠、商場與醫院長期合作。透過定期合約安排每月或每季主機巡檢，提早發現皮帶磨損、冷媒洩漏與基板訊號異常，預防無預警跳機停產損失。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/services/commercial-ac/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Service Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              企業與廠辦合作
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              商用空調工程｜中央空調、冰水主機、VRV 多聯式系統規劃維護
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              商用系統涉及冷凍噸位計算、高供電容安規、天花板風管走線與技師維護動線。我們堅持實務現場勘查評估，絕不以電話直接粗估報價。
            </p>
          </div>
        </section>

        {/* Commercial Grid */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-white">商用與廠辦空調主要場域</h2>
              <p className="text-xs sm:text-sm text-slate-450 mt-2">
                針對不同商業場域與建物結構設計氣流平衡及排水線路，確實執行安全防護。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sectors.map((sec, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                >
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-850 pb-2">
                    <span className="w-1.5 h-1.5 bg-sky-405 rounded-full"></span>
                    {sec.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{sec.description}</p>
                </div>
              ))}
            </div>

            {/* Assessment requirement notice */}
            <div className="mt-12 bg-slate-900/20 border border-slate-850 p-8 rounded-2xl text-center max-w-2xl mx-auto space-y-6">
              <h3 className="text-base font-bold text-white">商用大系統規劃，需要先看現場熱源、管線與排水條件</h3>
              <p className="text-xs text-slate-405 leading-relaxed">
                商用工程牽涉到高噸位起重吊掛安全、配電容量、主機放置散熱條件與維護動線。歡迎您先加 LINE 傳送格局平面圖、現場照片與設備銘牌照片，技師團隊將會主動聯繫您，並為您排程安排到府場勘估價。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "commercial_ac", cta_position: "commercial_photo_box" }}
                  className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>LINE 傳平面圖與設備照片</span>
                </CTAButton>
                
                <CTAButton
                  href="/contact/"
                  className="w-full sm:flex-1 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <span>預約商用空調場勘</span>
                </CTAButton>
              </div>
            </div>

            {/* Internal Navigation Links */}
            <div className="mt-12 pt-8 border-t border-slate-900 text-center space-y-4">
              <span className="text-xs text-slate-500 block">商用空調相關連結：</span>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                <a href="/lp/commercial-ac/" className="text-sky-400 hover:underline">商用工程高轉換專區 &rarr;</a>
                <a href="/services/chiller-maintenance/" className="text-sky-400 hover:underline">中央空調冰水主機維護 &rarr;</a>
                <a href="/cases/" className="text-sky-400 hover:underline">工程實績案例方向 &rarr;</a>
                <a href="/contact/" className="text-sky-400 hover:underline">預約現場估價場勘 &rarr;</a>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="commercial_ac"
          phoneText="撥打商用工程諮詢"
          lineText="加 LINE 傳照評估"
        />
      </main>
    </>
  );
}
