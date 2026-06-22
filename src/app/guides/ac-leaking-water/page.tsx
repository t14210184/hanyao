"use client";

import React from "react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function AcLeakingWaterGuidePage() {
  const pageTitle = "冷氣滴水、漏水怎麼辦？排水、髒污與安裝坡度都可能是原因 - 焓耀空調";
  const pageDescription = "冷氣滴水漏水怎麼辦？空調技師分析滴水原因包含排水堵塞、水盤發霉、室內機髒污或安裝水平斜度不良。教您自行排查步驟與如何判斷清洗或維修。";

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
        "name": "冷氣滴水漏水排查指南",
        "item": "https://www.xusen.pro/guides/ac-leaking-water/"
      }
    ]
  };

  // Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "冷氣滴水、漏水怎麼辦？排水、髒污與安裝坡度都可能是原因",
    "description": pageDescription,
    "url": "https://www.xusen.pro/guides/ac-leaking-water/",
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
        "name": "冷氣滴水是不是只要清洗保養就會好？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "不一定。滴水原因與排水管路、髒污程度、安裝坡度及環境條件皆有關係。如果是排水盤淤積發霉黏膜造成堵塞，進行深層清洗即可排除；但若是排水軟管破裂、銅管保溫套老化產生冷凝水，或是原安裝水平跑位，則必須安排維修更換配件，需依現場狀況進行診斷與判斷。"
        }
      },
      {
        "@type": "Question",
        "name": "冷氣突然開始滴水，應該先做什麼？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "請先關閉冷氣電源，避免凝結水持續溢出損壞天花板裝潢或壁紙。接著可先用抹布擦乾，檢查室外排水管口是否順暢排出，並可將滴水處或周圍管線配置拍照，LINE 傳送給技師協助判斷。"
        }
      },
      {
        "@type": "Question",
        "name": "使用裝潢排水盒（小水幫浦）容易壞掉滴水嗎？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "是的。當室內機沒有天然重力排水坡度時，會安裝機械式排水器。排水器內部有感應浮球與小馬達，使用時間久了容易積垢卡死，導致積水無法排出而溢水滴漏。這通常需要更換新的排水器零件。"
        }
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": "https://www.xusen.pro/guides/ac-leaking-water/"
  };

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/guides/ac-leaking-water/" />
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
              <span className="text-slate-350 truncate">冷氣滴水漏水排查</span>
            </nav>
          </div>
        </div>

        {/* Article */}
        <article className="py-16 bg-slate-950 flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <header className="mb-10 text-center sm:text-left">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30 inline-block mb-4">
                漏水故障排除
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                冷氣滴水、漏水怎麼辦？排水、髒污與安裝坡度都可能是原因
              </h1>
              
              {/* Core conclusion */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-sky-400 block mb-1">核心結論：</strong>
                冷氣滴水常見原因包含排水管堵塞、室內機髒污、排水坡度不良或安裝位置影響。若擦乾後仍反覆滴水，建議先停止長時間運轉並安排檢查。
              </div>
            </header>

            <div className="space-y-10 text-xs sm:text-sm text-slate-400 leading-relaxed">
              
              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">一、冷氣滴水 / 漏水常見原因</h2>
                <p>
                  室內機運轉時，蒸發器會產生凝結水並落入排水盤中。如果凝結水無法順利排出，就會從機身縫隙或出風口溢出滴漏。主要原因包括：
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>排水管路嚴重堵塞：</strong>水盤與排水管內因濕氣滋生黴菌，形成果凍狀的生物膜黏液，將細小的排水孔完全封死。</li>
                  <li><strong>安裝水平斜度不良：</strong>冷氣自然排水全靠重力坡度。如果安裝時水平量測跑位、或因地震牆面變形產生「逆坡度」，凝結水便會向另一側低窪處溢出。</li>
                  <li><strong>室內機蒸發器嚴重髒污：</strong>鰭片卡滿髒污油煙阻礙風道，導致局部結冰結霜。當風機關閉或室溫升高時，結冰急速融化，水量過大導致排水盤宣洩不及。</li>
                  <li><strong>保溫棉老舊破損：</strong>連接冷媒銅管與排水管的保溫套老化，在空氣接觸下產生嚴重的冷凝水（冒汗現象），進而滲漏滴水。</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">二、可以先自行排查的位置</h2>
                <p>
                  當冷氣出現漏水時，您可以先觀察並記下以下位置，有助於線上諮詢時初步判斷：
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>出風口風葉：</strong>滴水是從擺葉出風口滴下，還是順著機身兩側的縫隙漏出？（出風口滴水多為鰭片結霜或髒污風阻所致）。</li>
                  <li><strong>機身底部：</strong>滴水是否沿著機身底部貼牆面流下？（貼牆流下常為排水盤溢水、排水管接頭鬆脫或逆坡引起）。</li>
                  <li><strong>室外排水管口：</strong>到陽台或戶外觀察冷氣外接排水管出口，是否有凝結水穩定滴出？如果開機數小時卻沒有一滴水排出，代表內部一定嚴重堵塞。</li>
                </ol>
              </section>

              {/* HTML Table Section */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">三、冷氣漏水原因與建議處理對照表</h2>
                <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-900/20">
                  <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-300">
                        <th className="p-3 font-semibold">滴水原因</th>
                        <th className="p-3 font-semibold">可能現象 / 自檢指標</th>
                        <th className="p-3 font-semibold">建議處理方式</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-slate-350">
                      <tr>
                        <td className="p-3 font-medium text-white">排水盤卡霉堵塞</td>
                        <td className="p-3">吹風有酸霉味，出風口或機身底部溢水，外頭無排水</td>
                        <td className="p-3">安排專業高壓清洗，疏通水盤與排水管道</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">安裝水平逆坡</td>
                        <td className="p-3">水從排水孔反方向的機身角落溢出，安裝位置傾斜</td>
                        <td className="p-3">安排專業檢修，重測水平並調整室內機掛架坡度</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">排水盒/抽水幫浦損壞</td>
                        <td className="p-3">排水器發出劇烈達達聲或完全靜音，水從機器周邊滲漏</td>
                        <td className="p-3">更換新品，清洗排水管路防範回流堵塞</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">銅管保溫套破損</td>
                        <td className="p-3">沿著包覆銅管的管槽、包飾板產生冷凝水滴漏（出汗）</td>
                        <td className="p-3">安排專業維修，重新敷設防凝露保溫棉與膠帶包覆</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">四、如何判定需要「清洗保養」還是「維修處理」？</h2>
                <p>
                  冷氣滴水可能與排水、髒污、安裝坡度或環境條件等諸多複雜原因有關。
                </p>
                <p>
                  <strong>清洗保養可以解決的範疇：</strong>若經技師查檢，確認管線與坡度完好，滴水完全是由於排水盤堆積發霉黏膜、果凍生物質，或是鋁鰭片堵塞引發結霜，則透過高壓化學清洗與管道疏通即可排除，不需更換零件。
                </p>
                <p>
                  <strong>需要維修處理的範疇：</strong>若排水軟管在天花板內被壓折、老化破裂；或原先施作的天然排水坡度不足、排水馬達（小水幫浦）運轉壽命已到燒毀，此時僅進行清洗是無法改善的，必須進行實地拆裝維修、調整水平坡度或更換組件，需依現場狀況進行判斷。
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3">五、如何提供照片以利線上初步分析？</h2>
                <p>
                  當您的冷氣出現滴水時，建議您加官方 LINE，並提供以下位置的照片，技師將能更迅速地為您評估：
                </p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li><strong>冷氣滴水處近照與遠照：</strong>讓技師辨識漏水是出風口擺葉處、機底貼牆處，或是外露銅管保溫處。</li>
                  <li><strong>室內機正面外觀：</strong>讓技師辨別是壁掛式還是天花板吊隱式冷氣。</li>
                  <li><strong>周邊裝潢天花板近照：</strong>如果冷氣為吊隱式，拍攝天花板維修孔照片，以利技師判斷施工動線空間。</li>
                </ul>
                <p className="text-orange-400 font-semibold mt-4">
                  ※ 焓耀空調秉持誠實施工與安規原則，我們不進行誇大承諾。技師到府實地診斷後，會為您分析滴水是因髒污引發還是管路損壞，並據實報價再施工，保證消費誠信透明。
                </p>
              </section>

              {/* FAQ Section */}
              <section className="space-y-4 pt-6 border-t border-slate-900">
                <h2 className="text-lg font-bold text-white">常見問題解答 FAQ</h2>
                <div className="space-y-4">
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                    <h3 className="font-bold text-white mb-2">Q：冷氣滴水是不是只要清洗保養就會好？</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">答：不一定。滴水原因與排水管路、髒污程度、安裝坡度及環境條件皆有關係。如果是排水盤淤積發霉黏膜造成堵塞，進行深層清洗即可排除；但若是排水軟管破裂、銅管保溫套老化產生冷凝水，或是原安裝水平跑位，則必須安排維修更換配件，需依現場狀況進行診斷與判斷。</p>
                  </div>
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                    <h3 className="font-bold text-white mb-2">Q：冷氣突然開始滴水，應該先做什麼？</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">答：請先關閉冷氣電源，避免凝結水持續溢出損壞天花板裝潢或壁紙。接著可先用抹布擦乾，檢查室外排水管口是否順暢排出，並可將滴水處或周圍管線配置拍照，LINE 傳送給技師協助判斷。</p>
                  </div>
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850">
                    <h3 className="font-bold text-white mb-2">Q：使用裝潢排水盒（小水幫浦）容易壞掉滴水嗎？</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">答：是的。當室內機沒有天然重力排水坡度時，會安裝機械式排水器。排水器內部有感應浮球與小馬達，使用時間久了容易積垢卡死，導致積水無法排出而溢水滴漏。這通常需要更換新的排水器零件。</p>
                  </div>
                </div>
              </section>

              {/* CTAs */}
              <div className="pt-6 text-center space-y-6">
                <h3 className="text-base font-bold text-white">冷氣滴水不止？請 LINE 傳照初步分析或預約檢修</h3>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                  <CTAButton
                    href={siteConfig.lineUrl}
                    external
                    trackEventName="line_click"
                    trackParams={{ service_type: "ac_repair", cta_position: "guide_ac_leaking_water" }}
                    className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                  >
                    <span>LINE 傳滴水位置照片</span>
                  </CTAButton>
                  
                  <CTAButton
                    href="/contact/"
                    className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                  >
                    <span>預約檢修諮詢</span>
                  </CTAButton>
                </div>
                
                <div className="flex justify-center gap-6 text-xs text-sky-400 font-semibold">
                  <a href="/lp/ac-repair/" className="hover:underline">冷氣維修廣告專區 &rarr;</a>
                  <a href="/services/ac-repair/" className="hover:underline">冷氣檢修服務項目 &rarr;</a>
                  <a href="/services/ac-cleaning/" className="hover:underline">冷氣清洗保養項目 &rarr;</a>
                </div>
              </div>

            </div>

          </div>
        </article>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="ac_repair"
          phoneText="撥打冷氣滴水檢修"
          lineText="加 LINE 傳照評估"
        />
      </main>
    </>
  );
}
