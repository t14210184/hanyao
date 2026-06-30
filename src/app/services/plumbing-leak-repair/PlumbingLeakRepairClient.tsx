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
    title: "牆壁發霉滲水",
    desc: "油漆起泡剝落、牆面長期潮濕發霉（壁癌），懷疑內部暗埋的冷熱水管有肉眼看不見的微小漏水。"
  },
  {
    title: "水費暴增找不到原因",
    desc: "在沒有增加用水人口與用水習慣的前提下，每月水費突發暴增，高度懷疑地底或暗牆水管破裂暗漏。"
  },
  {
    title: "樓層漏水糾紛",
    desc: "樓下鄰居反映其天花板有水痕或甚至在滴水，面臨修繕責任釐清與鄰里關係的巨大壓力。"
  },
  {
    title: "水龍頭持續滴水",
    desc: "水龍頭或馬桶進水閥鎖緊後仍滴滴答答漏水不止，造成水資源浪費與水表持續暗轉。"
  },
  {
    title: "老屋管路預防汰換",
    desc: "屋齡已超過 20、30 年，原有水管多為易生鏽腐蝕的鍍鋅鋼管，想在爆管前主動進行全屋管線汰換。"
  }
];

const services = [
  {
    title: "管路漏水精密抓漏",
    desc: "使用專業聽音棒、管路打壓檢測，以及紅外線熱顯像儀等精密設備判定漏水點，將打牆開挖面積縮至最小。"
  },
  {
    title: "冷熱水管全面汰換",
    desc: "將高風險的老舊管線（如舊鐵管、PVC水管）全面升級為耐腐蝕、抗震、更耐高溫的高規不鏽鋼壓接管或明暗敷PEX軟管。"
  },
  {
    title: "給排水管局部更換",
    desc: "若屬單點漏水，以專業工法切除受損管段，精準換接新管路配件，為您省去大面積拆除費用與工時。"
  },
  {
    title: "止水閥與水龍頭更換",
    desc: "更換損壞的冷熱水混合龍頭、淋浴花灑、流理台龍頭、馬桶三角進水閥及總水源球閥，杜絕局部滴水問題。"
  },
  {
    title: "樓層漏水與樓板防水",
    desc: "配合大樓漏水糾紛，排查樓板、天花板及管道間水源方向，配合泥作施作局部防漏屏障與防水層修復。"
  },
  {
    title: "衛浴廚房管路整合翻修",
    desc: "配合室內裝潢裝修，進行浴室、廚房的所有進出水管路重新定位、高低配置與排水角度精密規劃。"
  }
];

const steps = [
  {
    step: "01",
    title: "LINE 傳照片或電話描述現象",
    desc: "傳滲水位置照片或描述發生時間與現象，讓師傅初步判斷可能的漏水類型"
  },
  {
    step: "02",
    title: "到場精密抓漏",
    desc: "攜帶熱顯像儀與聽音棒到場，在合理範圍內精密定位漏水位置，確認後才報價"
  },
  {
    step: "03",
    title: "確認報價後施工修繕",
    desc: "您同意報價後才進行修繕，縮小開挖範圍，精準處理漏水位置"
  },
  {
    step: "04",
    title: "完工測試，說明保固與後續注意事項",
    desc: "加壓測試確認無漏，說明保固範圍，並告知哪些後續狀況需要另外處理"
  }
];

const faqs = [
  {
    id: "faq-pl-1",
    question: "漏水師傅來了如果找不到漏水點，還是要收費嗎？",
    answer: "不收費。我們使用聽音棒與熱顯像儀等專業抓漏設備，若在合理檢測範圍內確實無法判定漏水位置，當次出工費用全額免收。"
  },
  {
    id: "faq-pl-2",
    question: "水費突然暴增但家裡看不出哪裡在漏，該怎麼確認？",
    answer: "睡前確認所有用水設備關閉，記下水表讀數，隔天早上再次讀取。若讀數有增加，代表確有暗管漏水。此時請聯繫我們攜帶儀器到場精密檢測，通常 1~2 小時內可鎖定漏水區域。"
  },
  {
    id: "faq-pl-3",
    question: "漏水修好之後有保固嗎？如果又漏怎麼辦？",
    answer: "有，我們提供施工保固 1 年。保固期內若確認為本公司施工區域問題，免費回場處理。"
  },
  {
    id: "faq-pl-4",
    question: "修漏水一定要打牆嗎？會破壞裝潢嗎？",
    answer: "不一定。精密抓漏儀器可縮小開挖範圍，有時局部開孔 10~20 公分即可完成修繕。若必須較大範圍施作，事前告知並書面報價，由您確認後才動工。"
  },
  {
    id: "faq-pl-5",
    question: "樓下鄰居說天花板在滴水，但我家地板看起來是好的，這是我的問題嗎？",
    answer: "不一定，但您的樓板有可能是水的通道。樓層間漏水有時來自上層浴室防水層失效，建議我們到場用熱顯像儀判斷水的來源方向，再決定是否需要樓板防水工程。"
  }
];

export default function PlumbingLeakRepairClient() {
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
            高雄 • 屏東在地漏水修繕工程
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            高雄屏東專業水管更換與漏水修繕<br className="sm:hidden" />｜精密抓漏，找不到不收費
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-3xl mx-auto">
            漏水位置與管路狀況決定修法與費用，無法事先給出固定數字。請 LINE 傳滲水照片或描述現象，我們初步判斷後安排到場精密抓漏——找到才報價，您確認後才施工
          </p>

          {/* Hero CTA Side-by-Side */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "plumbing_leak", cta_position: "hero_line" }}
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
              trackParams={{ service_type: "plumbing_leak", cta_position: "hero_phone" }}
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
              <span>找不到漏水點不收費</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>找到才報價，確認後施工</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>施工保固，範圍明確說明</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              這些漏水警訊，您家出現了嗎？
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              漏水每天都在擴大損失，越早處理損失越小
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
              trackParams={{ service_type: "plumbing_leak", cta_position: "painpoints_line" }}
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
              焓耀水管更換與漏水修繕服務內容
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              精密儀器定位、縮小開挖範圍，透明報價確認後才施工
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
              透明抓漏，找不到不收費；修繕報價確認後才動工
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-slate-900/50 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6 mb-16">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-center font-semibold">
              「漏水修繕費用取決於漏水位置、管路狀況、是否需要打牆開挖，以及施工地點與材料規格。我們的原則是先精密抓漏、確認問題後才報價；若在合理檢測範圍內找不到漏水點，不收出工費。」
            </p>
            
            <div className="border-t border-slate-850 pt-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-400">
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>漏水位置與管路深度：明管處理簡單，暗管需儀器定位，確認範圍後才開挖</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>是否需要打牆開挖：縮小開挖範圍可降低後續泥作修復的費用與時間</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>管材規格與更換長度：鍍鋅管、不鏽鋼管、PEX 管的材料費各不相同</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>施工地點：高雄市區與屏東各鄉鎮的到場費用不同</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>樓層與施工空間：高樓層或管道間狹窄會影響工時與施工難度</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60">
                  <span className="text-sky-400 mr-1.5 font-bold">✓</span>
                  <span>是否需要搭配防水工程：樓板或浴室防水層修復需另行評估</span>
                </li>
              </ul>
            </div>
            
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              「漏水問題越拖損失越大，但貿然施工可能修錯地方。請先 LINE 傳滲水照片與發生時間，我們初步判斷後安排到場，找到才報價。」
            </p>
          </div>

          {/* Process steps */}
          <div className="mb-10 text-center">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              精準抓漏與修繕流程
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
                  <p className="text-xs sm:text-sm text-slate-455 leading-relaxed">
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
              trackParams={{ service_type: "plumbing_leak", cta_position: "process_line" }}
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
              水管漏水修繕常見問題
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
              關於漏水修繕，您可能沒想到的幾件事
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              誠實說明漏水工程的複雜性，讓您做出不後悔的決定
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                『找不到不收費』是真的，但有前提
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                我們攜帶專業儀器在合理的檢測範圍內做精密定位，若無法確認漏水位置，不收取出工費。但若您的管路非常老舊、問題發生在無法進入的公設管道間，或需要特殊條件才能檢測，我們會如實說明情況與後續可能的處理方向。
              </p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                漏水的來源不一定在您以為的位置
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                水會沿著結構縫隙流動，天花板滴水不代表正上方有問題，牆面滲水也不一定是同層管路造成的。我們使用熱顯像儀與聽音棒協助定位，有時需要排除多種可能性才能確認——這個過程值得花，否則修了錯的地方，漏水還是繼續。
              </p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                修漏水可能需要搭配泥作，我們會提前說清楚
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                若漏水位置需要打牆開挖，修完管路後的地磚、牆磚或防水層修復，通常需要另外找泥作師傅，費用不含在我們的報價內。我們在施工前會明確說明哪些是我們負責的範圍，讓您對整體費用有完整預期，不會出現驚喜帳單。
              </p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                樓層漏水糾紛，我們可以協助釐清責任歸屬
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                面臨樓上樓下的漏水糾紛時，我們到場後可出具技術說明，協助您釐清水源方向與可能的責任範圍。我們提供的是客觀的現場技術判斷，幫助您與鄰居或房東溝通，讓糾紛有客觀的依據可以討論。
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
            <Link href="/services/emergency-plumbing-repair/" className="text-sky-400 hover:underline">
              緊急水電維修 &rarr;
            </Link>
            <Link href="/services/rewiring/" className="text-sky-400 hover:underline">
              老屋電線抽換 &rarr;
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
            heading="預約漏水抓漏・免費諮詢"
            subheading="請描述滲水位置或傳照片，我們為您評估抓漏方式與修繕費用"
            formLocation="plumbing_leak_repair_page"
            defaultService="ac-repair"
          />
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA
        serviceType="plumbing_leak"
        phoneText="電話說明狀況，評估後報價"
        lineText="LINE 傳照片讓師傅評估"
      />
    </main>
  );
}
