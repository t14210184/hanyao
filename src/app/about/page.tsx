"use client";

import React from "react";
import { siteConfig } from "@/data/site";
import CTAButton from "@/components/CTAButton";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import { trackEvent } from "@/lib/tracking";

export default function AboutPage() {
  const pageTitle = "關於焓耀空調｜公司資格憑證與冷凍空調技術士團隊";
  const pageDescription = "焓耀空調工程有限公司為政府登記合規之冷凍空調工程業（丙等，統一編號：90234660）。我們是台灣區冷凍空調工程工業同業公會會員，旗下技師持有國家乙級冷凍空調裝修技術士證照。";

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "關於焓耀空調 - 資格憑證與證照",
    "description": pageDescription,
    "url": "https://www.hanyao.com.tw/about/"
  };

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.hanyao.com.tw/about/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* About Hero */}
        <section className="relative py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-[-10%] w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              政府登記 • 專業認證
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight">
              公司資格與專業憑證
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              焓耀空調秉持誠信、安全與專業的最高標準。我們具備國家法定的冷凍空調業登記及技師執照，提供客戶合法合規、有保障的空調工程服務。
            </p>
          </div>
        </section>

        {/* Credentials Cards */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Card 1: 經濟部登記證書 */}
              <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md">
                <div>
                  <div className="w-12 h-12 bg-sky-950 border border-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-4">冷凍空調業登記證書</h2>
                  <ul className="space-y-3 text-sm text-slate-350 leading-relaxed">
                    <li><strong className="text-slate-200">公司名稱：</strong>焓耀空調工程有限公司</li>
                    <li><strong className="text-slate-200">統一編號：</strong>90234660</li>
                    <li><strong className="text-slate-200">經濟部冷凍空調業登記：</strong>經冷字第 1120002883 號</li>
                    <li><strong className="text-slate-200">營業範圍：</strong>E602011 冷凍空調工程業</li>
                    <li><strong className="text-slate-200">登記等級：</strong>丙等</li>
                    <li><strong className="text-slate-200">有效日期：</strong>至 117 年 11 月 14 日止</li>
                  </ul>
                </div>
              </div>

              {/* Card 2: 技師證照與公會 */}
              <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md">
                <div>
                  <div className="w-12 h-12 bg-emerald-950 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-4">專業資格與公會證明</h2>
                  <ul className="space-y-4 text-sm text-slate-350 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <strong className="text-slate-200 block">乙級冷凍空調裝修技術士</strong>
                        <span>現場施作人員均持有國家乙級冷凍空調裝修技術士證照，注重工程品質與施工安全。</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 pt-2 border-t border-slate-850">
                      <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <strong className="text-slate-200 block">台灣區冷凍空調工程工業同業公會會員</strong>
                        <span>公司為台灣區冷凍空調工程工業同業公會會員，符合商業與工程法規。</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Company Basic Info Card */}
            <div className="mt-8 bg-slate-900/20 border border-slate-850 p-8 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-6 pb-2 border-b border-slate-800">基本聯絡資訊</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-350">
                <div className="space-y-3">
                  <p><strong className="text-slate-200">公司名稱：</strong>焓耀空調工程有限公司</p>
                  <p><strong className="text-slate-200">公司地址：</strong>900 屏東縣屏東市建南路106號</p>
                  <p><strong className="text-slate-200">電子信箱：</strong>hanyao0105@gmail.com</p>
                </div>
                <div className="space-y-3">
                  <p><strong className="text-slate-200">聯絡電話一：</strong>0931-940-133</p>
                  <p><strong className="text-slate-200">聯絡電話二：</strong>0905-828-620</p>
                  <p><strong className="text-slate-200">官方 LINE ID：</strong>@451vpomq</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <CTAButton
                href={siteConfig.phone1Link}
                trackEventName="phone_click"
                trackParams={{ service_type: "about_general", cta_position: "about_page" }}
                className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>撥打諮詢電話</span>
              </CTAButton>
              
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "about_general", cta_position: "about_page" }}
                className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-950/20 transition-all"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>LINE 傳照片評估</span>
              </CTAButton>
            </div>
            
            <div className="mt-4 text-center">
              <CTAButton
                href="/contact/"
                trackEventName="quote_request"
                trackParams={{ service_type: "about_general", cta_position: "about_page_booking" }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-350 py-2 transition-colors"
              >
                <span>預約到府估價場勘 &rarr;</span>
              </CTAButton>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="about_general"
          phoneText="撥打專線諮詢"
          lineText="加 LINE 傳照評估"
          onPhoneClick={() => trackEvent("lp_cta_click", { service_type: "about_general", cta_position: "final_cta", lead_method: "phone" })}
          onLineClick={() => trackEvent("lp_cta_click", { service_type: "about_general", cta_position: "final_cta", lead_method: "line" })}
        />
      </main>
    </>
  );
}
