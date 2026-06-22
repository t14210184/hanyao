"use client";

import React from "react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function AcInstallationCostFactorsGuidePage() {
  const pageTitle = "冷氣安裝費用怎麼估？影響報價的 6 個現場條件 - 焓耀空調";
  const pageDescription = "冷氣安裝估價為什麼不建議電話直接報價？空調工程師為您分析影響安裝費用的 6 個現場條件，包括坪數、銅管長度、散熱位置、用電安全。歡迎 LINE 傳平面圖進行評估。";

  // Breadcrumbs Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首頁",
        "item": "https://www.xusen.pro/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "服務指南",
        "item": "https://www.xusen.pro/guides/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "冷氣安裝費用影響條件指南",
        "item": "https://www.xusen.pro/guides/ac-installation-cost-factors/"
      }
    ]
  };

  // Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "冷氣安裝費用怎麼估？影響報價的 6 個現場條件",
    "description": pageDescription,
    "url": "https://www.xusen.pro/guides/ac-installation-cost-factors/",
    "author": {
      "@type": "Organization",
      "name": "焓耀空調工程"
    },
    "publisher": {
      "@type": "Organization",
      "name": "焓耀空調工程"
    }
  };

  // FAQ Schema (Only visible FAQs on page)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "冷氣安裝為什麼不提供電話直接估價？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "因為每戶住家的梁柱結構、配電盤位置、室外機吊掛的危險程度（是否需要吊車或高空雙鉤作業）以及銅管所需的長度皆不相同。為了保證施工用電安規與日後不漏水，我們堅持依現場條件與實際需求進行量測評估，絕不以電話直接開死價，防止施作時產生後續糾紛。"
        }
      },
      {
        "@type": "Question",
        "name": "裝潢前，為什麼要先找空調技師場勘？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "因為冷媒配管與冷凝水排水坡度必須隱藏在木工吊頂天花板內。在木工進場前預先到場放樣配置管線、預留維修孔位置，能與裝潢設計師流暢套圖，避免完工後冷氣滴水或氣流死角而無法修改天花板。"
        }
      },
      {
        "@type": "Question",
        "name": "可以先在 LINE 上進行初步的估價諮詢嗎？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "可以。您可以先提供室內格局平面圖、安裝房間的實際照片、以及預計擺放室外機的陽台或外牆照片。我們的技師可以在官方 LINE 上為您進行線上初步判斷與機型配置建議，隨後再安排排程到府進行最終實地確認。"
        }
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": "https://www.xusen.pro/guides/ac-installation-cost-factors/"
  };

  const factors = [
    {
      title: "1. 空間坪數與現場熱源條件",
      detail: "安裝空間的長寬大小決定了基礎冷房噸數。此外，如果房間有頂樓西曬、挑高結構、挑空天井或高發熱電器，都必須精算熱負荷，否則會導致冷氣噸數不足、頻繁高速運轉而耗電不冷。"
    },
    {
      title: "2. 室外機擺放位置與施作高度",
      detail: "室外機的重量大且有散熱風阻要求。如果需要懸掛在外牆危險位置，必須加裝安全支架與高空防墜雙鉤防墜。施作環境是否涉及重型起重吊掛或申請路權吊車，均會直接影響工程項目。"
    },
    {
      title: "3. 冷媒銅管與訊號控制線長度",
      detail: "原廠冷氣隨機附帶的銅管長度通常為基本 5 米。若室內機與室外機的距離較遠，額外延長敷設的銅管、控制訊號線以及防曬裝飾管槽材料，會根據現場實際量測長度進行配置計算。"
    },
    {
      title: "4. 排水管路走線與坡度斜度",
      detail: "冷凝水排出完全依靠天然重力倾斜坡度。如果現場無現成排水孔、需要重新穿孔引流，或是排水管線過長需要繞樑走管，都需要更細緻的配管施工。若無天然斜度，則需加裝排水泵抽水器。"
    },
    {
      title: "5. 配電容量安全與主開關配線",
      detail: "大噸數冷氣或多聯變頻系統運轉電流大。現場主配電箱的電路容量是否足夠、是否需要重新敷設專用安全電源迴路、加裝漏電斷路器，都是考量用電安規的必要現場條件。"
    },
    {
      title: "6. 特殊工序如梁柱穿孔或拆回收舊機",
      detail: "新安裝冷氣如果需要穿透鋼筋混凝土梁柱穿孔（需洗孔作業），或舊冷氣需要拆卸清運、舊銅管路是否需要進行高壓氮氣清洗吹管，這些特殊施工作業均會作為現場配置評估的依據。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/guides/ac-installation-cost-factors/" />
        <JsonLd schema={pageSchema} />
        <JsonLd schema={breadcrumbSchema} />
        <JsonLd schema={articleSchema} />
        <JsonLd schema={faqSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Breadcrumbs */}
        <div className="bg-slate-950 py-3 border-b border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex text-xs text-slate-500 space-x-2">
              <Link href="/" className="hover:text-sky-400">首頁</Link>
              <span>/</span>
              <span className="text-slate-400">服務指南</span>
              <span>/</span>
              <span className="text-slate-350 truncate">安裝估價條件</span>
            </nav>
          </div>
        </div>

        {/* Article */}
        <article className="py-16 bg-slate-950 flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <header className="mb-10 text-center sm:text-left">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30 inline-block mb-4">
                工程費用分析
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                冷氣安裝費用怎麼估？影響報價的 6 個現場條件
              </h1>
              
              {/* Core conclusion */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-sky-400 block mb-1">核心結論：</strong>
                冷氣安裝費用通常會受坪數、機型、管線長度、排水條件、室外機位置與用電條件影響。建議先提供現場照片或平面配置，再由專人判斷是否需要到場評估。
              </div>
            </header>

            <div className="space-y-10 text-xs sm:text-sm text-slate-400 leading-relaxed">
              
              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">一、為什麼不建議只用電話固定報價</h2>
                <p>
                  很多客戶會習慣撥打電話直接詢問「裝一台變頻冷氣要多少錢？」。然而，空調工程是一項高度因地制宜的客製化施工。如果冷氣行在不清楚現場管線、電源與高空吊掛作業難度的情況下，在電話中盲目承諾一個低價，施工現場往往會因為「超出基本安裝」而產生追加費用爭議。
                </p>
                <p>
                  我們堅持誠實估價。技師到府場勘時，會測量實際銅管走線長度、判定用電配線安規、規劃冷凝水排水路徑與室外機安全吊架空間，才能開立明細報價，保障雙方權益。
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">二、影響報價的 6 個現場條件</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {factors.map((factor, idx) => (
                    <div key={idx} className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                      <h3 className="font-bold text-white mb-2">{factor.title}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">{factor.detail}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* HTML Table Section */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">三、影響冷氣安裝費用與建議提供資料對照表</h2>
                <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-900/20">
                  <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-300">
                        <th className="p-3 font-semibold">影響現場條件</th>
                        <th className="p-3 font-semibold">為什麼會影響工程項目</th>
                        <th className="p-3 font-semibold">建議先準備資料</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-slate-350">
                      <tr>
                        <td className="p-3 font-medium text-white">空間坪數 / 熱源</td>
                        <td className="p-3">決定冷氣所需的冷凍噸數（BTU），噸數越大主機尺寸與管徑不同</td>
                        <td className="p-3">室內格局平面圖、空間實測坪數、有無頂樓西曬說明</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">管線長度</td>
                        <td className="p-3">基本安裝超出 5 米的銅管與控制訊號線需要依長度追加材料費</td>
                        <td className="p-3">室內機預定位置到陽台室外機的大約距離照片</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">室外機散熱位置</td>
                        <td className="p-3">外牆吊掛作業涉及安全吊架、是否需要雙鉤高空或吊車作業</td>
                        <td className="p-3">室外陽台或大樓外牆預定安裝空間照片</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">排水條件</td>
                        <td className="p-3">天然排水坡度不夠時需要洗孔穿牆或加裝排水幫浦抽水器</td>
                        <td className="p-3">預計安裝位置周邊的排水孔或插座照片</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">用電條件</td>
                        <td className="p-3">是否需要從配電箱引出專用冷氣迴路、加裝安全無熔絲斷路器</td>
                        <td className="p-3">室內主配電箱（開關箱）外觀照片</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">四、分離式、變頻與吊隱式安裝差異</h2>
                <p>
                  <strong>家用變頻分離式：</strong>施工最為普及，通常 1-2 天內可完成單組拆裝，管線以外露防護管槽包覆，日後保養清洗極為便利。
                </p>
                <p>
                  <strong>天花板吊隱式：</strong>室內機完全隱蔽在木工裝潢天花板中，能與天花板美觀整合。然而，這需要空調技師在天花板封板前，先進行精準管道放樣、風管架設及排水試水。同時，主機下方必須預留至少 40x80cm 以上的維修保養孔，否則日後將無法清洗濾網或檢修零件。
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">五、如何提供照片以利 LINE 線上初步估價諮詢？</h2>
                <p>
                  我們不提供標準價格表或最低價保證，而是依現場條件與機型用電判斷。歡迎您加官方 LINE 帳號，並提供以下照片。技師會在線上為您進行初步分析與噸數配置建議，並為您排定到府場勘時間：
                </p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li><strong>室內空間照片：</strong>拍攝欲安裝冷氣的房間正面與預期掛機的位置，以利判斷高度與散熱。</li>
                  <li><strong>格局平面配置圖：</strong>新屋裝潢如有 CAD 或 PDF 格局圖，傳送有助於規劃冷媒風管走向。</li>
                  <li><strong>室外機放置空間：</strong>拍攝陽台預留空間或外牆照片，協助技師判定是否需要防墜設備或特殊吊架。</li>
                  <li><strong>如果是舊機舊換新：</strong>請拍攝舊主機上的標籤貼紙銘牌，技師能立刻查詢規格電壓，評估是否能沿用管路。</li>
                </ul>
                <p className="text-orange-400 font-semibold mt-4">
                  ※ 焓耀空調秉持安規工程。我們會根據您提供的照片在線上給出合理噸數與工法分析，並據實依排程到現場場勘量測，同意完整報價單明細後再施工。
                </p>
              </section>

              {/* FAQ Section */}
              <section className="space-y-4 pt-6 border-t border-slate-900">
                <h2 className="text-lg font-bold text-white">常見問題解答 FAQ</h2>
                <div className="space-y-4">
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                    <h3 className="font-bold text-white mb-2">Q：冷氣安裝為什麼不提供電話直接估價？</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">答：因為每戶住家的梁柱結構、配電盤位置、室外機吊掛的危險程度（是否需要吊車或高空雙鉤作業）以及銅管所需的長度皆不相同。為了保證施工用電安規與日後不漏水，我們堅持依現場條件與實際需求進行量測評估，絕不以電話直接開死價，防止施作時產生後續糾紛。</p>
                  </div>
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                    <h3 className="font-bold text-white mb-2">Q：裝潢前，為什麼要先找空調技師場勘？</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">答：因為冷媒配管與冷凝水排水坡度必須隱藏在木工吊頂天花板內。在木工進場前預先到場放樣配置管線、預留維修孔位置，能與裝潢設計師流暢套圖，避免完工後冷氣滴水或氣流死角而無法修改天花板。</p>
                  </div>
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                    <h3 className="font-bold text-white mb-2">Q：可以先在 LINE 上進行初步的估價諮詢嗎？</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">答：可以。您可以先提供室內格局平面圖、安裝房間的實際照片、以及預計擺放室外機的陽台或外牆照片。我們的技師可以在官方 LINE 上為您進行線上初步判斷與機型配置建議，隨後再安排排程到府進行最終實地確認。</p>
                  </div>
                </div>
              </section>

              {/* CTAs */}
              <div className="pt-6 text-center space-y-6">
                <h3 className="text-base font-bold text-white">規劃冷氣安裝？請 LINE 傳現場照片或預約場勘</h3>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                  <CTAButton
                    href={siteConfig.lineUrl}
                    external
                    trackEventName="line_click"
                    trackParams={{ service_type: "ac_installation", cta_position: "guide_installation_cost" }}
                    className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                  >
                    <span>LINE 傳現場照片</span>
                  </CTAButton>
                  
                  <CTAButton
                    href="/contact/"
                    className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                  >
                    <span>預約冷氣安裝估價</span>
                  </CTAButton>
                </div>
                
                <div className="flex justify-center gap-6 text-xs text-sky-400 font-semibold">
                  <a href="/lp/ac-installation/" className="hover:underline">冷氣安裝廣告專區 &rarr;</a>
                  <a href="/services/ac-installation/" className="hover:underline">變頻冷氣安裝服務頁 &rarr;</a>
                  <a href="/services/ac-replacement/" className="hover:underline">冷氣舊換新規劃指引 &rarr;</a>
                </div>
              </div>

            </div>

          </div>
        </article>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac_installation"
          phoneText="撥打安裝諮詢專線"
          lineText="加 LINE 傳照評估"
        />
      </main>
    </>
  );
}
