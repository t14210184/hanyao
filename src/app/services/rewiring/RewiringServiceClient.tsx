"use client";

import React from "react";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import FAQAccordion from "@/components/FAQAccordion";
import TrustSection from "@/components/TrustSection";
import ContactForm from "@/components/ContactForm";
import FinalCTA from "@/components/FinalCTA";
import { siteConfig } from "@/data/site";

const symptoms = [
  {
    title: "插座發燙冒煙",
    desc: "插座、電器插頭或延長線異常發熱、甚至發出焦味，極可能是內部電線老化或用電量過載。"
  },
  {
    title: "頻繁跳電",
    desc: "每當同時使用冷氣、微波爐、吹風機時就常跳電，代表家裡線路規劃已不符合現代高電量需求。"
  },
  {
    title: "電費異常暴增",
    desc: "在用電習慣沒改變的前提下，電線老化引起的微小漏電暗耗可能讓您的電費單金額持續攀升。"
  },
  {
    title: "裝潢翻新需求",
    desc: "買了中古屋準備裝潢，在封天花板與封牆前，是全室重新抽換管線並佈局迴路的黃金時機。"
  },
  {
    title: "大電器裝設需求",
    desc: "計劃裝設大坪數冷氣、嵌入式烤箱、IH爐，或需要預留電動車充電樁等高功率電力需求。"
  }
];

const services = [
  {
    title: "全室電線抽換",
    desc: "將老舊已脆化、電阻過高的舊鋁線或細銅線全部抽除，重新穿入符合 CNS 國家標準的足坪數、防火安全新線。"
  },
  {
    title: "配電箱更新",
    desc: "汰換老舊閘刀開關，升級大容量匯流排配電箱，全面配備無熔絲斷路器與漏電防護開關，確保負載安全自動跳脫。"
  },
  {
    title: "冷氣專用迴路配置",
    desc: "針對分離式或吊隱式冷氣配置 110V/220V 專用獨立迴路與開關，避免因電流衝擊導致與照明或插座共用跳電。"
  },
  {
    title: "廚房高功率迴路",
    desc: "為烤箱、微波爐、洗碗機及IH感應爐等大功率電器規劃獨立專用插座與粗徑銅線，遠離廚房超載失火危機。"
  },
  {
    title: "電動車充電樁配線",
    desc: "依據電動汽車壁掛式充電器（常見 32A / 7.2kW）規格，從總開關箱拉設專用粗銅線與漏電斷路器，提供安心充電。"
  },
  {
    title: "局部電路更新",
    desc: "若預算有限或部分線路近年已更新，亦可針對特定高負載區域（如廚房或特定房間）進行局部抽換的經濟方案。"
  }
];

const steps = [
  {
    step: "01",
    title: "LINE傳照或現場丈量",
    desc: "您可以先加 LINE 傳送電箱外貌與告知坪數獲取初步估算，亦可預約技術專員到府現場精準丈量。"
  },
  {
    step: "02",
    title: "出具書面報價單",
    desc: "詳細列明全屋坪數、迴路規劃、線材規格及材料工資，提供透明且具有合約效力的書面報價，絕無隱藏收費。"
  },
  {
    step: "03",
    title: "排期分區施工",
    desc: "依約定時間進場，採用「分區斷電施工法」，當日施工完後即恢復基本生活用電，盡可能降低生活影響。"
  },
  {
    step: "04",
    title: "完工測試保固交屋",
    desc: "施作完畢後進行全室插座極性、電壓與跳電功能測試。提供 1 年施工保障與售後服務，確認安全後完工交屋。"
  }
];

const faqs = [
  {
    id: "faq-rw-1",
    question: "老屋電線重拉施工期間，全家需要搬出去住嗎？",
    answer: "通常不需要。我們採用分區斷電施工法，以 30 坪三房兩廳為例，工期約 3~5 天，每天施工結束後會恢復部分生活用電（廚房、廁所、主臥），無需外宿。"
  },
  {
    id: "faq-rw-2",
    question: "全室電線重拉大概要多少錢？有辦法先給一個初步預算嗎？",
    answer: "以 30 坪三房兩廳為例，全室抽換工程連工帶料約 NT$120,000~200,000。建議 LINE 傳現場照片先初步評估，到場後出具精確書面報價。"
  },
  {
    id: "faq-rw-3",
    question: "冷氣一定要拉專用迴路嗎？直接接在現有插座可以嗎？",
    answer: "強烈建議使用獨立迴路。冷氣啟動瞬間電流大，共用迴路易造成跳電，長期大電流通過細線可能導致電線絕緣老化發熱，形成火災隱患。"
  },
  {
    id: "faq-rw-4",
    question: "我家是 40 年老屋，用的是鋁線，一定要換掉嗎？",
    answer: "是的，強烈建議更換。鋁線接點容易氧化鬆動，電阻升高發熱，是老屋電器火災的高風險因子。目前法規已不允許新建住宅使用鋁線。"
  },
  {
    id: "faq-rw-5",
    question: "電線重拉施工後，保固多久？如果之後有問題怎麼辦？",
    answer: "我們提供 1 年施工保固。保固期內因施工不當造成的問題免費回場處理。保固期後若有新問題，我們提供到府優先服務，費用依現場情況收取。"
  }
];

export default function RewiringServiceClient() {
  return (
    <main className="flex-1 flex flex-col pt-16 bg-slate-950">
      {/* Service Hero */}
      <section className="relative py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[30%] h-[50%] rounded-full bg-sky-950/10 blur-[100px] pointer-events-none"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3.5 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            高雄 • 屏東老屋電線重拉工程
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            高雄屏東老屋電線重拉<br className="sm:hidden" />｜全室電路更新、配電箱換新，不用搬家也能完工
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-3xl mx-auto">
            採用 CNS 國家標準合格線材，分區施作不影響生活｜施工保固，安全有保障
          </p>

          {/* Hero CTA Side-by-Side */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "rewiring", cta_position: "hero_line" }}
              className="w-full sm:flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>LINE 傳照片免費詢價</span>
            </CTAButton>

            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "rewiring", cta_position: "hero_phone" }}
              className="w-full sm:flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>立即電話諮詢</span>
            </CTAButton>
          </div>

          {/* Trust Points */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-900">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>高雄屏東在地服務</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>CNS 國家標準線材</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>分區施作不需搬家</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>施工完工保固 1 年</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              這些用電警訊，您家出現了嗎？
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              老屋電線老化是火災隱患，越早處理越安全
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {symptoms.map((symptom, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/20">
                    指標 {idx + 1}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-3 mb-2">
                    {symptom.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {symptom.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mid Section CTA */}
          <div className="mt-10 text-center">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "rewiring", cta_position: "painpoints_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>LINE 傳照片免費評估</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-slate-900/20 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              焓耀老屋電線更新服務內容
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              從全室重拉到局部迴路更新，依現場需求彈性規劃
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/30 border border-slate-850/60 p-6 rounded-2xl"
              >
                <h3 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TrustSection */}
      <TrustSection />

      {/* Pricing & Process Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              費用說明與施工流程
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              書面報價，確認後才動工，施工完工保固 1 年
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-slate-900/50 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6 mb-12">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-center font-semibold">
              「全室電線重拉依坪數、迴路數與線材規格評估，到場後出具書面報價，同意後才施工」
            </p>
            
            <div className="border-t border-slate-850 pt-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-450">
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>全室電線抽換（30 坪，連工帶料）</span>
                  <span className="text-sky-400 font-bold">約 NT$120,000 ~ 200,000</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>配電箱更新（10~20 迴路）</span>
                  <span className="text-sky-400 font-bold">約 NT$15,000 ~ 35,000</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>冷氣獨立迴路（每條）</span>
                  <span className="text-sky-400 font-bold">約 NT$3,500 ~ 6,000</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>局部問題迴路更換</span>
                  <span className="text-sky-400 font-bold">約 NT$3,000 ~ 8,000 / 迴路</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>電動車充電樁迴路配線</span>
                  <span className="text-sky-400 font-bold">約 NT$5,000 ~ 10,000</span>
                </li>
              </ul>
            </div>
            
            <p className="text-[11px] text-slate-550 text-center leading-relaxed">
              * 實際費用依現場坪數、迴路數量與線材規格評估，書面報價確認後才施工。
            </p>
          </div>

          {/* Highlight features */}
          <div className="bg-slate-900/30 border border-slate-850/50 p-6 rounded-2xl max-w-3xl mx-auto mb-16 text-center">
            <p className="text-xs sm:text-sm text-sky-400 font-medium leading-relaxed">
              💡 施工特點：採「分區斷電施作法」，以 30 坪三房兩廳為例，工期約 3~5 天，每日施工結束後恢復部分生活用電，業主無需外宿搬家。
            </p>
          </div>

          {/* Process steps */}
          <div className="mb-10 text-center">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              標準施作與更換流程
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-black text-sky-400/20 block font-mono">
                    {step.step}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white mt-2 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-450 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mid Section CTA */}
          <div className="mt-12 text-center">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "rewiring", cta_position: "process_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>LINE 預約免費評估</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="py-16 bg-slate-950 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              老屋電線重拉常見問題
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              施工前最常問的 5 個問題，幫您提前做好準備
            </p>
          </div>

          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* Related Services Links Section */}
      <section className="py-16 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            延伸閱讀・相關服務：
          </h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm">
            <Link href="/services/emergency-plumbing-repair/" className="text-sky-400 hover:underline">
              緊急水電維修 &rarr;
            </Link>
            <Link href="/services/plumbing-leak-repair/" className="text-sky-400 hover:underline">
              水管更換與漏水修繕 &rarr;
            </Link>
            <Link href="/services/ac-installation/" className="text-sky-400 hover:underline">
              冷氣安裝 &rarr;
            </Link>
            <Link href="/services/commercial-ac/" className="text-sky-400 hover:underline">
              商用冷氣工程 &rarr;
            </Link>
            <Link href="/contact/" className="text-sky-400 hover:underline">
              聯絡我們・預約估價 &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ContactForm Section */}
      <section id="contact-section" className="py-16 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm
            heading="預約免費評估・線路更新諮詢"
            subheading="請描述您的用電狀況或傳配電箱照片，我們為您評估換線方案與費用"
            formLocation="rewiring_page"
            defaultService="ac-installation"
          />
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA
        serviceType="rewiring"
        phoneText="立即電話諮詢換線"
        lineText="LINE 傳照片免費評估"
      />
    </main>
  );
}
