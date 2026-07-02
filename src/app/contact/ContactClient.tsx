"use client";

import React from "react";
import ContactForm from "@/components/ContactForm";
import FinalCTA from "@/components/FinalCTA";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

export default function ContactClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Contact Hero */}
      <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/10 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            聯絡我們
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight">
            預約估價、檢修與保養服務
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            提供高雄與屏東全區到府服務。無論是空調冷氣安裝清洗，或是商用大系統規劃，歡迎填寫表單或直接與我們聯絡，技師團隊將儘速與您對接。
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">線上快速預約表單</h2>
                <p className="text-xs text-slate-400">請填寫您的基本資訊與需求項目，我們收到後會主動與您聯繫。</p>
              </div>
              <ContactForm />
            </div>

            {/* Right Column: Info & Map (5 cols) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Info Card */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">聯絡管道</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-sky-400 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">諮詢專線</span>
                      <a href={siteConfig.phone1Link} onClick={() => trackEvent("phone_click", { service_type: "contact_page", cta_position: "contact_info" })} className="text-white hover:text-sky-400 font-bold block text-sm sm:text-base transition-colors">{siteConfig.phone1}</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-slate-850/60">
                    <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-green-400 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">官方 LINE 帳號</span>
                      <a href="https://line.me/R/ti/p/@451vpomq" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("line_click", { service_type: "contact_page", cta_position: "contact_info", link_type: "line" })} className="text-white hover:text-green-400 font-bold block text-sm sm:text-base transition-colors">@451vpomq</a>
                      <span className="text-xs text-slate-400">（可 LINE 傳平面圖或現場舊機照片，以利初步判斷）</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-slate-850/60">
                    <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-purple-400 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">電子信箱 Email</span>
                      <span className="text-white text-sm">hanyao0105@gmail.com</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-slate-850/60">
                    <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-orange-400 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">服務時間 & 地址</span>
                      <span className="text-white text-sm block">營業時間：週一至週五 08:00–17:00</span>
                      <span className="text-slate-355 text-xs block mt-1">地址：900 屏東縣屏東市建南路106號</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl overflow-hidden shadow-inner flex flex-col justify-between h-[300px] relative group hover:border-slate-800 transition-colors">
                {/* Decorative map background grid */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-25"></div>
                
                {/* Styled location markers */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                  <span className="w-4 h-4 bg-sky-500 rounded-full animate-ping absolute"></span>
                  <span className="w-4 h-4 bg-sky-500 rounded-full border-2 border-white relative z-10"></span>
                  <div className="bg-slate-950/90 border border-slate-850 px-3 py-1.5 rounded-lg text-center mt-2 shadow-lg max-w-[200px]">
                    <span className="text-[11px] font-bold text-white block">焓耀空調工程</span>
                    <span className="text-[9px] text-slate-450 block mt-0.5">屏東市建南路106號</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">地理位置</span>
                  <span className="text-sm font-bold text-white block mt-1">高雄市與屏東縣在地服務區</span>
                </div>

                <div className="relative z-10 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-850/40">
                  服務區域包括高雄全區（鳳山、三民、左營等）與屏東地區（屏東市、潮州、萬丹等）。
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="contact_general"
        phoneText="撥打專線諮詢"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
