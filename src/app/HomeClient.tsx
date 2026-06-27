"use client";

import React from "react";
import { siteConfig } from "@/data/site";
import { servicesData } from "@/data/services";
import { casesData } from "@/data/cases";
import { faqsData } from "@/data/faqs";
import CTAButton from "@/components/CTAButton";
import ServiceCard from "@/components/ServiceCard";
import AreaSelector from "@/components/AreaSelector";
import TrustSection from "@/components/TrustSection";
import ProcessSection from "@/components/ProcessSection";
import CaseCard from "@/components/CaseCard";
import FAQAccordion from "@/components/FAQAccordion";
import ContactForm from "@/components/ContactForm";
import FinalCTA from "@/components/FinalCTA";

export default function HomeClient() {
  const handleAreaChange = () => {
    // Area changes are tracked inside the AreaSelector component
  };

  return (
    <main className="flex-1 flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh] lg:min-h-screen">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-950/20 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-950/20 blur-[100px] pointer-events-none"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 sm:space-y-8 animate-fadeIn">
              {/* Region Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/80 border border-slate-850 rounded-full text-xs font-bold text-sky-400 tracking-wider shadow-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                <span>高雄市 • 屏東縣 在地專業空調服務</span>
              </div>

              {/* Title (H1) */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
                高雄 / 屏東冷氣空調工程
                <span className="block text-2xl sm:text-3xl md:text-4xl text-sky-400 font-bold mt-2">
                  安裝、維修、清洗、商用空調規劃
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-355 leading-relaxed max-w-xl">
                焓耀空調工程提供家用冷氣、商用空調、冷氣清洗保養、維修檢修、冷氣舊換新與全熱交換器規劃。從現場評估、管線配置、排水散熱、節能設計到完工測試，協助你把空調問題一次處理到位。
              </p>

              {/* Call-to-Actions (Strictly specified links & tracking) */}
              <div className="w-full max-w-md flex flex-col gap-3.5 pt-2">
                {/* primary buttons row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                  {/* 📞 Call */}
                  <CTAButton
                    href={siteConfig.phone1Link}
                    trackEventName="phone_click"
                    trackParams={{ cta_position: "hero_primary" }}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-805 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01]"
                  >
                    <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>立即撥打：0931-940-133</span>
                  </CTAButton>

                  {/* 💬 LINE */}
                  <CTAButton
                    href={siteConfig.lineUrl}
                    external
                    trackEventName="line_click"
                    trackParams={{ cta_position: "hero_primary" }}
                    className="w-full py-4 bg-green-600 hover:bg-green-505 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-950/20 transition-all hover:scale-[1.01]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>LINE 傳照片初步評估</span>
                  </CTAButton>
                </div>

                {/* 📝 Appointment (Full Width) */}
                <CTAButton
                  href="#contact-section"
                  className="w-full py-4 bg-sky-500 hover:bg-sky-404 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>預約到府估價</span>
                </CTAButton>
              </div>
            </div>

            {/* Right Column: Premium Glassmorphism Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden group">
                {/* Card glow effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/25 transition-all duration-500"></div>
                
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-sky-500 rounded-full shrink-0"></span>
                  焓耀空調 • 工業級嚴謹保障
                </h3>
                
                {/* Stats */}
                <div className="space-y-5">
                  <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                    <div>
                      <span className="text-xs text-slate-500 block">專業證照</span>
                      <span className="text-sm font-semibold text-slate-200 mt-1 block">乙級冷凍空調裝修技術士</span>
                    </div>
                    <span className="text-xs bg-slate-950 text-sky-400 py-1 px-2.5 rounded border border-slate-800 font-mono">
                      乙級持照
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                    <div>
                      <span className="text-xs text-slate-500 block">公會審查</span>
                      <span className="text-sm font-semibold text-slate-200 mt-1 block">冷凍空調商業同業公會</span>
                    </div>
                    <span className="text-xs bg-slate-950 text-sky-400 py-1 px-2.5 rounded border border-slate-800 font-mono">
                      合規會員
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-start pb-2">
                    <div>
                      <span className="text-xs text-slate-500 block">服務保障</span>
                      <span className="text-sm font-semibold text-slate-200 mt-1 block">先場勘報價、完工附保固</span>
                    </div>
                    <span className="text-xs bg-slate-950 text-emerald-400 py-1 px-2.5 rounded border border-slate-800 font-mono">
                      100% 透明
                    </span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-slate-950/80 rounded-2xl border border-slate-850 text-xs text-slate-400 leading-relaxed">
                  💡 <strong>貼心叮嚀：</strong>冷氣故障漏水、噪音或不冷，可先點擊上方綠色按鈕加 LINE 傳照片，技師將免費在線上提供初步診斷，加速到府維修流程。
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Service Cards Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              全方位專業空調服務
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight sm:text-4xl">
              提供六大空調工程解決方案
            </h2>
            <p className="text-lg text-slate-400 mt-4 leading-relaxed">
              不論是家用空間舒適冷暖房，亦或是商用大樓、工廠高規格空調系統，焓耀持照技師團隊皆能提供最嚴謹的施工與服務。
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesData.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. GEO Section */}
      <section className="py-20 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              高屏地區在地深耕
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight sm:text-4xl">
              高雄、屏東在地快速派車服務
            </h2>
            <p className="text-lg text-slate-400 mt-4 leading-relaxed">
              請點選您的所在地區，查看我們在當地的具體服務範圍與說明。
            </p>
          </div>

          {/* Selector component with description */}
          <AreaSelector onAreaChange={handleAreaChange} />
        </div>
      </section>

      {/* 4. TrustSection */}
      <TrustSection />

      {/* 5. ProcessSection */}
      <ProcessSection />

      {/* 6. Case Preview Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              實績案例預覽
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight sm:text-4xl">
              焓耀工程案例實績方向
            </h2>
            <p className="text-lg text-slate-400 mt-4 leading-relaxed">
              從辦公大樓、骨科醫院、精密工廠、化學廠到連鎖早午餐店與運動中心，提供高標準空調系統設計與安裝。
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {casesData.map((item) => (
              <CaseCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ Preview Section */}
      <section className="py-20 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              解答您的疑問
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight sm:text-4xl">
              常見問題 FAQ
            </h2>
            <p className="text-lg text-slate-400 mt-4 leading-relaxed">
              我們整理了關於到府檢修排程、估價收費、清洗保養工法與保固條款的常見疑問，希望能幫助您快速了解。
            </p>
          </div>

          {/* Accordion */}
          <FAQAccordion items={faqsData} />
        </div>
      </section>

      {/* 8. Contact Section */}
      <section id="contact-section" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              線上預約到府估價
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight sm:text-4xl">
              立刻填寫預約表單
            </h2>
            <p className="text-lg text-slate-400 mt-4 leading-relaxed">
              請留下您的基本聯絡資料與空調需求，我們將指派專責工程師與您聯繫到府檢修或估價事宜。
            </p>
          </div>

          {/* Contact form */}
          <ContactForm />
        </div>
      </section>

      {/* 9. Final CTA */}
      <FinalCTA />
    </main>
  );
}
