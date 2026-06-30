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
    title: "LINE 傳照片或電話描述",
    desc: "請傳現場照片、影片或描述故障狀況與您的地址，讓師傅初步判斷問題性質"
  },
  {
    step: "02",
    title: "師傅評估，告知費用與時間",
    desc: "師傅根據您的地點與狀況，告知可出勤時間與預估費用，您確認後才安排派工"
  },
  {
    step: "03",
    title: "確認後到場施工",
    desc: "雙方確認費用與時間後，師傅準時到場，依實際狀況施工，不隨意追加費用"
  },
  {
    step: "04",
    title: "完工驗收，提供保固說明",
    desc: "完工後說明保固範圍與注意事項，讓您對後續維護有明確預期"
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
            遇到水電緊急狀況？先傳照片或影片給我們，師傅評估現場狀況與您的地點後，告知可出勤時間與費用——您確認後才派工，不會有事後追加帳單
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
              <span>LINE 傳照片讓師傅評估</span>
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
              <span>電話說明狀況，評估後報價</span>
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
              <span>傳照片評估，確認後才派工</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>費用透明說明在前</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>施工保固，不額外追加</span>
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
              <span>LINE 傳照片讓師傅評估</span>
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
              「水電故障的修繕費用，取決於故障類型、施工難度、地點與出勤時間，無法給出固定價格。我們的做法是：您先 LINE 傳照片與地址，師傅評估後告知費用，雙方確認後才派工。」
            </p>
            
            <div className="border-t border-slate-850 pt-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-400">
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>故障類型與複雜程度：跳電查修、水管封管、馬達維修等，所需工時與材料各不相同</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>施工地點與距離：高雄市區、屏東市區與偏遠鄉鎮的出勤費用不同</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>出勤時間：夜間與假日緊急叫修有相應的加成費用，出勤前會告知</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>現場材料規格：管徑、線徑與材料等級均影響材料費用</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>是否需要特殊設備：高壓疏通、抓漏儀器等有相應設備使用費</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>施工後是否需要泥作修復：部分工程完工後牆面或地磚需另行復原</span>
                </li>
              </ul>
            </div>
            
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              「以上因素均會影響最終費用。請先 LINE 傳照片與地址，師傅評估後說明費用，您確認後才出勤——所有費用在施工前透明告知，不會有事後意外帳單。」
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
              <span>LINE 傳照片讓師傅評估</span>
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

      {/* More Scenarios Section */}
      <section className="py-16 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              關於緊急叫修，我們想讓您事先了解的事
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              誠實說明我們的服務範圍與方式，幫助您做出適合的決定
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                我們服務高雄、屏東，但不是每個地點都能立即到達
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                我們的師傅以高雄市區及屏東市區為主要服務範圍。若您位於偏遠鄉鎮，我們會如實告知出勤費用與可排程的時間，絕不讓您等了很久才說無法到達。建議先 LINE 告知地址，確認師傅可出勤後再安排。
              </p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                照片比文字描述更能幫助師傅準確判斷
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                同樣是「跳電」，可能是迴路過載、漏電、電器故障或配電箱老化，所需的處理方式差異很大。一張配電箱照片或一段現場影片，往往能讓師傅在到場前就有初步判斷，減少您等待與溝通的時間，也讓報價更貼近實際。
              </p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                我們不提供電話報價，是為了保護您
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                師傅沒看到現場說出的任何數字，對您都沒有保障意義——到場後可能差很多，那才是真正的困擾。我們的做法是師傅到場後依實際狀況告知費用，您同意才施工。這是保護您不被亂報價的方式。
              </p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                緊急出勤費是真實存在的，但不會在完工後才告知
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                夜間或假日緊急出勤會有相應的加成費用。我們在您確認出勤前就會說明這項費用，您同意才出發。所有費用在施工前告知，不會有完工後才出現的「額外項目」。
              </p>
            </div>
          </div>
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
        phoneText="電話說明狀況，評估後報價"
        lineText="LINE 傳照片讓師傅評估"
      />
    </main>
  );
}
