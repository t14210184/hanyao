"use client";

import React from "react";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

export default function ServicesOverviewPage() {
  const pageTitle = "服務總覽｜冷氣安裝、維修、清洗與商用空調工程 - 焓耀空調";
  const pageDescription = "提供高雄與屏東地區家用及商用空調全方位服務，包括變頻冷氣安裝、舊換新、空調故障維修、高壓清洗保養、商用多聯 VRV 與中央空調冰水主機規劃、冷氣移機及全熱交換器換氣系統配置。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "服務項目總覽",
    "description": pageDescription,
    "url": "https://www.xusen.pro/services/"
  };

  const services = [
    {
      title: "冷氣安裝",
      target: "新屋裝潢、舊換新、套房冷氣規劃客戶",
      painPoint: "擔心施工粗糙、室外機防震不佳、管線配置不良導致日後漏水不冷",
      solution: "依現場坪數與熱源精算噸數，嚴格要求冷媒管路斜度、安全用電配置，提供美觀防震施作。",
      link: "/services/ac-installation/",
      ctaText: "查看冷氣安裝服務 &rarr;"
    },
    {
      title: "冷氣舊換新",
      target: "老舊冷氣耗電不冷、頻繁故障需要更換的家庭與商戶",
      painPoint: "每年夏季電費暴增、舊冷氣管路能否沿用判定困難、不知如何挑選合適變頻機型",
      solution: "免費現場評估舊管線與散熱條件，量身推薦一級能效變頻冷氣，並提供妥善的舊機拆卸回收服務。",
      link: "/services/ac-replacement/",
      ctaText: "查看冷氣舊換新服務 &rarr;"
    },
    {
      title: "冷氣維修",
      target: "冷氣突然滴水漏水、吹風不冷、運轉產生怪聲異音的用戶",
      painPoint: "擔心報價不透明、隨便補冷媒敷衍、過沒幾天故障重演",
      solution: "技師攜專業檢測儀器到府查檢，故障點與材料明細透明報價，客戶同意後再施工，拒絕模糊灌水。",
      link: "/services/ac-repair/",
      ctaText: "查看冷氣維修服務 &rarr;"
    },
    {
      title: "冷氣清洗保養",
      target: "冷氣吹出酸臭霉味、吹冷氣易過敏哈啾、風量明顯變小的用戶",
      painPoint: "出風口與風輪布滿霉斑黑點、冷房速度大打折扣、過濾網清洗無法解決內部積塵",
      solution: "施作環境防塵保護包覆，使用防霉無毒藥劑與高壓水槍深層清洗室內外機鰭片及水盤，消除過敏源。",
      link: "/services/ac-cleaning/",
      ctaText: "查看冷氣清洗服務 &rarr;"
    },
    {
      title: "商用空調工程",
      target: "辦公室、中大型廠辦、餐廳店面、特定排氣需求商戶",
      painPoint: "商用空間格局複雜導致冷房死角、吹風不均悶熱、商用空調高額電費難以負荷",
      solution: "精算空間熱負荷與換氣需求，規劃變頻多聯式 VRV 系統與風管配置，整合氣流循環達到節能省電。",
      link: "/services/commercial-ac/",
      ctaText: "查看商用空調工程 &rarr;"
    },
    {
      title: "冰水主機 / 中央空調",
      target: "廠辦大樓、重工業廠房、有中大型中央空調維護維修需求之企業",
      painPoint: "冰水主機管路卡垢能效下降、主機因高低壓異常頻繁跳機、缺乏專業年度巡檢維護",
      solution: "專屬技師進行水冷式與氣冷式主機通管清洗、冷媒壓力及馬達電流巡檢檢修，並提供定期保養合約。",
      link: "/services/chiller-maintenance/",
      ctaText: "查看冰水主機維修 &rarr;"
    },
    {
      title: "冷氣移機",
      target: "搬家需要搬遷舊冷氣、裝潢格局改變重新配置冷氣位置者",
      painPoint: "拆卸過程冷媒回收不當漏光、二次重新配置後機器能效受損或配線配管漏水",
      solution: "標準流程冷媒封存回收、防塵包裝運送，新環境散熱與電源配置安全判定，依現場與機況評估施作。",
      link: "/services/ac-relocation/",
      ctaText: "查看冷氣移機服務 &rarr;"
    },
    {
      title: "全熱交換器規劃 / Energy Recovery Ventilator",
      target: "重視空氣品質的新屋裝潢戶、經常緊閉門窗怕悶的住家與辦公室",
      painPoint: "緊閉門窗室內二氧化碳過高昏沉、開窗外面車輛噪音或空污嚴重、直接引進外氣使冷氣電費上升",
      solution: "裝潢木工進場前配置管道，熱交換核心將外氣過濾引入，排出髒空氣，大幅降低空調冷房負荷。",
      link: "/services/erv/",
      ctaText: "查看全熱交換器規劃 &rarr;"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.xusen.pro/services/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Services Hero */}
        <section className="relative py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-sky-950/15 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              服務項目總覽
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              焓耀空調工程服務總覽<br/>
              <span className="text-sky-400 text-lg sm:text-2xl font-bold mt-2 block">冷氣安裝、維修、清洗與商用空調工程</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              我們具備國家冷凍空調登記證書與乙級技術士執照，為高雄與屏東客戶提供安全合規、透明誠信的工程服務。家用與商用冷氣空調疑問，歡迎洽詢。
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((item, index) => (
                <div 
                  key={index}
                  className="bg-slate-900/35 border border-slate-850 p-6 sm:p-8 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-all duration-300 shadow-md group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                        {item.title}
                      </h2>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 shrink-0">
                        服務分類 #{index + 1}
                      </span>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-slate-400 leading-relaxed mb-8">
                      <p>
                        <strong className="text-slate-300 block mb-1">適合對象：</strong>
                        {item.target}
                      </p>
                      <p>
                        <strong className="text-slate-300 block mb-1">常見痛點：</strong>
                        {item.painPoint}
                      </p>
                      <p className="text-slate-350 bg-slate-950/40 p-3 rounded-lg border border-slate-850/60">
                        <strong className="text-sky-400/90 block mb-1">我們的協助方案：</strong>
                        {item.solution}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-4">
                    <CTAButton
                      href={item.link}
                      className="text-xs sm:text-sm font-semibold text-sky-400 hover:text-sky-350 transition-colors"
                    >
                      {item.ctaText}
                    </CTAButton>
                    
                    <CTAButton
                      href="/contact/"
                      className="text-[11px] py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
                    >
                      線上預約
                    </CTAButton>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Contact Bar */}
            <div className="mt-16 bg-slate-900/20 border border-slate-850 p-8 rounded-3xl text-center max-w-3xl mx-auto space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">冷氣空調問題？先 LINE 傳圖諮詢，技師為您初步分析</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
                家用冷氣漏水故障，或公司行號需要冰水主機定期維護，您均可先加官方 LINE 傳現場照片或格局平面圖。我們的專業技師會在線上提供初步判斷與排程建議，絕不過度承諾或捏造數據。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-2">
                <CTAButton
                  href={siteConfig.phone1Link}
                  trackEventName="phone_click"
                  trackParams={{ service_type: "general", cta_position: "services_overview" }}
                  className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>撥打諮詢專線</span>
                </CTAButton>
                
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "general", cta_position: "services_overview" }}
                  className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>LINE 傳照片評估</span>
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
    </>
  );
}
