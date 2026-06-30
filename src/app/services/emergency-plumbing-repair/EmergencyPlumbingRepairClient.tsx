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
    title: "半夜突然跳電",
    desc: "全家陷入黑暗，安全維護與冰箱電器全停擺，造成極大不便。"
  },
  {
    title: "水管破裂噴水",
    desc: "廚房或浴室水管爆裂，水不斷往外噴，無法自行關閥止水。"
  },
  {
    title: "馬桶堵塞積水",
    desc: "浴室積水無法退去，馬桶嚴重阻塞，嚴重影響日常基本生活。"
  },
  {
    title: "牆壁地板滲水",
    desc: "牆面或地板大量滲漏水，導致壁癌並損壞裝潢與電器設備。"
  },
  {
    title: "馬達轉不停",
    desc: "加壓馬達異常持續運轉，產生高溫與噪音，令人擔心管路爆裂與電費暴增。"
  }
];

const services = [
  {
    title: "跳電漏電查修",
    desc: "漏電斷路器跳脫、電線短路、電壓異常。專業技師攜帶精密儀器到場，排查電控箱與各迴路，精確找出跳電故障原因。"
  },
  {
    title: "水管破裂緊急搶修",
    desc: "冷熱水管老化破損、接頭斷裂等突發狀況。提供到場緊急封管、斷水、止漏搶修，第一時間降低裝潢損失。"
  },
  {
    title: "馬桶與排水管疏通",
    desc: "廚房油垢堵塞、浴室毛髮積水或馬桶掉入異物。利用專業通管機或高壓鋼索水柱疏通，當日即可恢復通暢。"
  },
  {
    title: "加壓馬達故障排除",
    desc: "電子恆壓馬達或傳統馬達發熱、轉不停、發出巨響或不啟動。現場快速排查压力開關與電路，提供維修或換新評估。"
  },
  {
    title: "電線走火危機排除",
    desc: "插座發燙變形、電線有燒焦味、甚至異味冒煙。緊急到場安全斷電、抽換受損導線、更換合格融斷開關，排除火災隱患。"
  },
  {
    title: "其他緊急水電故障",
    desc: "電熱水器不熱漏電、給水角閥失靈損壞、接地線斷路等各式突發水電問題，一通電話，高屏在地技師迅速出勤解決。"
  }
];

const steps = [
  {
    step: "01",
    title: "LINE傳照或電話說明",
    desc: "加 LINE 傳現場照片或電話描述水電狀況，專員初步判斷問題類型，並為您安排合適師傅。"
  },
  {
    step: "02",
    title: "到場精確檢測",
    desc: "高雄屏東在地師傅快速抵達現場診斷，確認故障範圍，向您說明處理方案並提供現場透明報價。"
  },
  {
    step: "03",
    title: "確認後立即施工",
    desc: "雙方確認報價與方案後，師傅立即展開施作。過程使用合格材料，透明合理，絕不任意追加費用。"
  },
  {
    step: "04",
    title: "完工測試與保固",
    desc: "施工完成後現場開機或通水測試，確認功能完全恢復正常，提供施工保障與後續保固說明。"
  }
];

const faqs = [
  {
    id: "faq-ep-1",
    question: "半夜叫修水電，師傅真的會來嗎？夜間有加成費用嗎？",
    answer: "我們提供 24 小時服務，高雄屏東市區緊急叫修，師傅 30 分鐘內確認出勤。夜間（22:00–06:00）加收緊急服務費 NT$500–1,000，到場後現場告知，雙方同意後才施作，絕不事後追加。"
  },
  {
    id: "faq-ep-2",
    question: "師傅到場檢測後，如果我不想修，基本出工費還是要付嗎？",
    answer: "是的，基本出工費（NT$300–500）為到場檢測費用，若您決定不施作，需支付此費用。若當場確認施作，這筆費用將全額折抵維修工資，不會重複計費。"
  },
  {
    id: "faq-ep-3",
    question: "水管爆裂師傅來之前，我自己能做什麼應急措施？",
    answer: "請立即找到家中的自來水總閥（通常在廚房流理台下方或公共管道間）並將其關閉，可防止繼續漏水損壞地板牆面。關閉後請立即 LINE 或電話聯繫我們，告知地址與狀況。"
  },
  {
    id: "faq-ep-4",
    question: "加壓馬達一直轉不停是壞了嗎？",
    answer: "不一定是馬達本身損壞。可先試著將馬達端水閥關閉，若馬達立刻停止，代表室內管路存在漏水；若仍持續運轉，代表馬達壓力開關或控制盤故障。建議聯繫我們到場精確診斷。"
  },
  {
    id: "faq-ep-5",
    question: "跳電查修後找不到原因，也要收費嗎？",
    answer: "若師傅在合理檢測範圍內確實無法判定跳電原因，我們將如實告知並說明後續方向，費用部分依現場溝通後決定。我們的原則是：透明告知、同意後才收費。"
  }
];

export default function EmergencyPlumbingRepairClient() {
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
            高雄 • 屏東在地水電維修工程
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            高雄屏東 24 小時緊急水電搶修<br className="sm:hidden" />｜跳電、水管爆裂、堵塞，我們立刻到
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-3xl mx-auto">
            基本出工費 NT$300~500，確認施工後全額折抵｜高雄屏東在地師傅，30 分鐘內報到
          </p>

          {/* Hero CTA Side-by-Side */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "emergency_plumbing", cta_position: "hero_line" }}
              className="w-full sm:flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>LINE 傳照片馬上估</span>
            </CTAButton>

            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "emergency_plumbing", cta_position: "hero_phone" }}
              className="w-full sm:flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>立即電話叫修</span>
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
              <span>到場透明報價</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>同意後才施工</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>24 小時緊急出勤</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              您遇到這些狀況了嗎？
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              緊急水電故障，每分每秒都在損失——讓我們立刻到場處理
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
              trackParams={{ service_type: "emergency_plumbing", cta_position: "painpoints_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>立即 LINE 告知狀況</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-slate-900/20 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              焓耀緊急水電搶修服務內容
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              涵蓋電路、管路、設備故障，到場精確診斷，報價確認後立即施工
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
              費用說明與服務流程
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              透明收費，到場報價，確認後才施工
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-slate-900/50 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6 mb-16 animate-pulse-slow">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-center font-semibold">
              「到場基本出工費 NT$300~500，確認施作後全額折抵工資，不重複計費」
            </p>
            
            <div className="border-t border-slate-850 pt-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-450">
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>基本出工檢測費（高屏市區）</span>
                  <span className="text-sky-400 font-bold">NT$300 ~ 500</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>夜間緊急叫修加成（22:00–06:00）</span>
                  <span className="text-sky-400 font-bold">加收 NT$500 ~ 1,000</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>通馬桶 / 排水管疏通</span>
                  <span className="text-sky-400 font-bold">NT$1,500 ~ 3,500</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>水管破裂緊急封管</span>
                  <span className="text-sky-400 font-bold">NT$2,000 ~ 5,000</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>跳電查修排除</span>
                  <span className="text-sky-400 font-bold">NT$800 ~ 2,500</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span>加壓馬達維修</span>
                  <span className="text-sky-400 font-bold">NT$1,500 ~ 4,000</span>
                </li>
              </ul>
            </div>
            
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              * 實際費用依現場狀況、材料與施工難度評估，報價確認後才施工，無追加項目。以上價格為參考區間。
            </p>
          </div>

          {/* Process steps */}
          <div className="mb-10 text-center">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              標準施作與搶修流程
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
              trackParams={{ service_type: "emergency_plumbing", cta_position: "process_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>LINE 預約緊急叫修</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="py-16 bg-slate-950 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              緊急水電維修常見問題
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              叫修前最常問的 5 個問題，讓您安心決定
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
            <Link href="/services/plumbing-leak-repair/" className="text-sky-400 hover:underline">
              水管更換與漏水修繕 &rarr;
            </Link>
            <Link href="/services/rewiring/" className="text-sky-400 hover:underline">
              老屋電線抽換 &rarr;
            </Link>
            <Link href="/services/ac-repair/" className="text-sky-400 hover:underline">
              冷氣維修檢修 &rarr;
            </Link>
            <Link href="/services/ac-cleaning/" className="text-sky-400 hover:underline">
              冷氣清洗保養 &rarr;
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
            heading="預約緊急叫修・免費諮詢"
            subheading="請描述故障狀況，或傳照片給我們評估，高雄屏東師傅盡快確認出勤時間"
            formLocation="emergency_plumbing_repair_page"
            defaultService="ac-repair"
          />
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA
        serviceType="emergency_plumbing"
        phoneText="立即電話叫修"
        lineText="LINE 傳照片估價"
      />
    </main>
  );
}
