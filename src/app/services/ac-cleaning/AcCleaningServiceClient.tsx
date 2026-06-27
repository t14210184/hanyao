"use client";

import React from "react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import CTAButton from "@/components/CTAButton";
import FAQAccordion from "@/components/FAQAccordion";
import TrustSection from "@/components/TrustSection";
import PriceFactorsSection from "@/components/PriceFactorsSection";
import ContactForm from "@/components/ContactForm";
import { siteConfig } from "@/data/site";

const symptoms = [
  {
    title: "異味飄散",
    desc: "一開冷氣有霉味、酸味或灰塵味"
  },
  {
    title: "發霉黑點",
    desc: "出風口有黑點、黴斑或灰塵堆積"
  },
  {
    title: "風量衰退",
    desc: "風量明顯變小，冷房速度變慢"
  },
  {
    title: "機體漏水",
    desc: "室內機滴水、排水不順或牆面潮濕"
  },
  {
    title: "冷房不夠",
    desc: "冷氣開很久仍不夠涼"
  },
  {
    title: "呼吸過敏",
    desc: "家中有小孩、長輩、過敏體質或寵物"
  },
  {
    title: "高粉塵環境",
    desc: "店面、辦公室長時間開機，易積油煙與粉塵"
  }
];

const services = [
  {
    title: "分離式冷氣清洗",
    desc: "拆卸外殼、風向葉片及水盤（視現場條件），使用無毒專用藥劑高壓沖洗冷排與鼓風輪，清除深層黴菌。"
  },
  {
    title: "窗型冷氣保養",
    desc: "針對窗型冷氣進行防護，清洗蒸發器與冷凝器翅片，疏通底盤排水孔，確保散熱良好與排水通暢。"
  },
  {
    title: "吊隱式冷氣清洗",
    desc: "配合天花板維修孔與出回風口，對控制基板作完整防水防護，高壓沖洗內部蒸發器與接水盤。"
  },
  {
    title: "室外機散熱清潔",
    desc: "技師现场評估室外機安裝位置之安全性。若符合安全施工標準，以高壓水沖洗散熱鰭片，提升能效。"
  },
  {
    title: "排水系統檢查",
    desc: "高壓清洗同時疏通室內機排水孔與排水軟管，清除果凍狀黏質黴菌，防止冷氣漏水滴水損壞裝潢。"
  },
  {
    title: "商用空調保養",
    desc: "針對辦公室、診所、餐飲店家等商用空調系統提供定期保養估價，可配合非營業時間排程施工。"
  }
];

const steps = [
  {
    step: "01",
    title: "LINE 初步詢問",
    desc: "線上確認您的地區、冷氣型式、清洗台數及冷氣症狀（如霉味、滴水），初步估算工法並為您預約時間。"
  },
  {
    step: "02",
    title: "到場開機檢查",
    desc: "施作前技師先開機測試功能，確認風量、冷度及有無機械或電路故障，評估安裝位置與施作安全性。"
  },
  {
    step: "03",
    title: "環境安全防護",
    desc: "施工現場對室內機下方的地板、牆面、家具及電器進行嚴密防水防塵遮蔽保護，確保環境乾淨。"
  },
  {
    step: "04",
    title: "拆洗高壓清潔",
    desc: "拆卸外殼與配件，掛上專業集水罩，噴灑抗菌抑霉無毒藥劑，以高壓沖洗冷排與風輪，手工刷洗外殼配件。"
  },
  {
    step: "05",
    title: "排水與基本測試",
    desc: "疏通排水孔與排水管，將配件手工乾燥後裝回，再次開機運轉測試出風量、冷度及排水狀況。"
  },
  {
    step: "06",
    title: "完工與保養說明",
    desc: "確認冷氣運轉及排水皆正常後，恢復現場環境，並向您說明冷氣維護重點與後續保養建議。"
  }
];

const priceFactors = [
  {
    name: "冷氣機型與拆洗方式",
    description: "分離式、吊隱式、窗型或其他機型，拆裝難度與清洗方式不同，需依實際機型確認。"
  },
  {
    name: "台數、髒污狀況與使用環境",
    description: "長時間未清洗、霉味明顯、風量變小或多台同時清洗，都會影響現場作業安排與所需時間。"
  },
  {
    name: "現場防護與施工空間",
    description: "室內家具、裝潢、排水位置與施工空間都會影響防護方式與清洗流程，需依現場狀況安排。"
  }
];

const faqs = [
  {
    id: "faq-cleaning-1",
    question: "冷氣多久需要清洗一次？",
    answer: "一般家用冷氣建議每 1 ~ 2 年清洗保養一次。若家中有過敏體質、寵物、或冷氣安裝在餐廳、客廳等高頻率使用區域，則建議每年定期安排清洗，以維護空氣品質並避免排水管堵塞。"
  },
  {
    id: "faq-cleaning-2",
    question: "有霉味一定要拆洗嗎？",
    answer: "是的。霉味代表內部貫流風鼓與排水盤已滋生黴菌與累積發霉塵垢，單洗濾網或噴灑市售清潔噴霧無法清除風輪深處的霉斑，必須透過專業到府高壓沖洗才能根除異味。"
  },
  {
    id: "faq-cleaning-3",
    question: "冷氣不冷是缺冷媒還是太髒？",
    answer: "大多數不冷的情況是因為濾網、蒸發器冷凝翅片或風鼓卡滿污垢，阻礙風流與熱交換，清洗後即可恢復冷房能效。冷媒在密閉系統中除非有破損漏點否則不會減少，不冷時應先排查髒污，不應隨意強行灌冷媒。"
  },
  {
    id: "faq-cleaning-4",
    question: "清洗會不會弄髒家裡？",
    answer: "不會。我們在清洗前會使用專業的防水塑膠防護布與遮蔽膠帶，將冷氣下方的家具、電器、牆面及地板作全面包覆，並掛上專用漏斗形承接水罩，髒水會直接排入集水桶，絕不弄髒裝潢。"
  },
  {
    id: "faq-cleaning-5",
    question: "分離式冷氣清洗大約要多久？",
    answer: "家用單台壁掛分離式冷氣的清洗時間大約在 1.5 到 2 小時之間，這包含前置機況檢測、周邊防護作業、高壓沖洗、配件刷洗裝回以及完工後的排水與運轉測試。"
  },
  {
    id: "faq-cleaning-6",
    question: "吊隱式冷氣可以清洗嗎？",
    answer: "可以的。吊隱式空調會透過天花板上的維修孔進行施工。技師會對電控板與周邊裝潢做嚴密的防水遮蔽，再將高壓沖洗槽與集水罩掛載於蒸發器與接水盤下方進行清洗。"
  },
  {
    id: "faq-cleaning-7",
    question: "室外機需要洗嗎？",
    answer: "室外機負責散熱。若翅片塞滿沙塵落葉會影響散熱，使壓縮機過載耗電。技師到府時會先評估室外機的安裝位置，在確認安全且符合高壓沖洗條件下，才會建議您加購清洗室外機。"
  },
  {
    id: "faq-cleaning-8",
    question: "店面或辦公室可以定期保養嗎？",
    answer: "可以。營業場所因為長時間運轉且空氣流通量大，極易累積灰塵油煙。我們提供商用空調定期清洗保養服務，亦可配合店家非營業時間（夜間或週末假日）進行排程施工。"
  },
  {
    id: "faq-cleaning-9",
    question: "清洗前需要準備什麼？",
    answer: "請協助將冷氣下方約一坪範圍內的物品、家具或易碎品移開，以便技師放置鋁梯與高壓清洗機。若有無法移動的重型家具，技師會在現場使用雙重防水防塵布包覆保護。"
  },
  {
    id: "faq-cleaning-10",
    question: "如何預約高雄屏東冷氣清洗？",
    answer: "建議您直接加官方 LINE，將室內機的型號銘牌照片（通常在室內機下方）以及現場安裝環境拍照片傳給我們，並告知您所在的區域與台數，客服專員會為您進行初步評估與預約排程。"
  }
];

export default function AcCleaningServiceClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Service Hero */}
      <section className="relative py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[30%] h-[50%] rounded-full bg-sky-950/10 blur-[100px] pointer-events-none"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3.5 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            高雄 • 屏東在地冷氣清洗工程
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            高雄屏東冷氣清洗保養<br className="sm:hidden" />｜分離式、窗型、吊隱式到府清潔
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-3xl mx-auto">
            冷氣有霉味、風量變小、滴水或越吹越不冷？焓耀空調工程提供高雄、屏東冷氣清洗保養，依現場機型與髒污狀況評估清潔方式，協助改善空氣品質與冷房效率。
          </p>

          {/* Hero CTA Side-by-Side */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "ac_cleaning", cta_position: "hero_line" }}
              className="w-full sm:flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>立即 LINE 諮詢</span>
            </CTAButton>

            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "ac_cleaning", cta_position: "hero_phone" }}
              className="w-full sm:flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>電話詢問清洗保養</span>
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
              <span>清洗前先確認機況</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>施工前後基本測試</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-350">
              <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
              <span>不亂灌冷媒、不誇大推銷</span>
            </div>
          </div>
        </div>
      </section>

      {/* Symptoms Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              您的冷氣可能該清洗保養了
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              如果遇到以下幾種常見現象，代表冷氣內部已累積大量灰塵與發霉菌斑
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              trackParams={{ service_type: "ac_cleaning", cta_position: "symptoms_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>告訴我們冷氣症狀</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-slate-900/20 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              焓耀冷氣清洗保養服務內容
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              針對不同空調機型提供專業工法，徹底洗淨內部髒污與排水盤
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

      {/* 1. TrustSection — 放在 Services 服務內容後、Process 清洗流程前 */}
      <TrustSection />

      {/* Process Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              嚴謹的冷氣清洗保養流程
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              六步驟標準施作流程，從機況確認、細緻防護到高壓洗淨與排水測試
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-black text-sky-400/20 block font-mono">
                    {step.step}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-2 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-450 leading-relaxed">
                    {step.desc}
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
              trackParams={{ service_type: "ac_cleaning", cta_position: "process_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>LINE 預約冷氣清洗</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* 2. PriceFactorsSection — 放在 Process 清洗流程後、Pricing 價格說明前 */}
      <PriceFactorsSection
        title="冷氣清洗費用會受哪些因素影響？"
        subtitle="冷氣清洗會依機型、台數、髒污狀況、現場防護與施工空間而有所不同。先了解機型與現場條件，才能提供較合適的清洗建議與估價方式。"
        factors={priceFactors}
      />

      {/* Pricing Section */}
      <section className="py-16 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              冷氣清洗價格與報價說明
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              誠信收費，依現場實際條件評估
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6">
            <p className="text-sm sm:text-base text-slate-350 leading-relaxed text-center font-semibold">
              「清洗費用依機型、台數、安裝位置、髒污程度與是否需特殊拆洗評估報價」
            </p>
            
            <div className="border-t border-slate-850 pt-6">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">
                主要影響報價的因素：
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 shrink-0 font-bold">•</span>
                  <span>分離式 / 窗型 / 吊隱式 / 商用空調機型差異</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 shrink-0 font-bold">•</span>
                  <span>是否需要拆卸貫流風鼓、塑料排水盤進行特殊清潔</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 shrink-0 font-bold">•</span>
                  <span>室外機安裝位置是否安全、符合施作空間與高壓沖洗條件</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 shrink-0 font-bold">•</span>
                  <span>是否為多台同址清洗（可享交通與工時折抵優惠）</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 shrink-0 font-bold">•</span>
                  <span>高雄與屏東偏遠或山區（需先確認車馬排程）</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 text-center bg-slate-950/40 p-4 rounded-xl">
              <p className="text-xs text-sky-300">
                建議加 LINE 傳送您的冷氣室內機照片與台數，客服專員會為您線上初步估算清洗費用！
              </p>
            </div>
          </div>

          {/* Mid Section CTA */}
          <div className="mt-10 text-center">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "ac_cleaning", cta_position: "pricing_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>傳照片快速詢問</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Service Area Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              高雄與屏東到府服務區域
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              深耕高屏在地服務，依照工作排程依序安排，實際區域以 LINE 確認為準
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl">
              <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                高雄主要服務區域
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                三民區、左營區、鼓山區、苓雅區、前鎮區、小港區、鳳山區、仁武區、楠梓區、鳥松區、大寮區、岡山區、橋頭區、路竹區等，實際施作動線以 LINE 確認。
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl">
              <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                屏東主要服務區域
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                屏東市、萬丹鄉、長治鄉、九如鄉、麟洛鄉、潮州鎮、內埔鄉、竹田鄉、東港鎮等，偏遠區域或山區建議提前聯絡客服排定。
              </p>
            </div>
          </div>

          {/* Mid Section CTA */}
          <div className="mt-10 text-center">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "ac_cleaning", cta_position: "areas_line" }}
              className="inline-flex py-3 px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl items-center gap-2 text-xs sm:text-sm shadow-md transition-all"
            >
              <span>詢問高雄屏東到府保養</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Inner links for SEO Cluster */}
      <section className="py-12 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            冷氣清洗保養主題專區：
          </h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm">
            <Link href="/services/ac-cleaning/pricing/" className="text-sky-400 hover:underline">
              清洗價格說明 &rarr;
            </Link>
            <Link href="/services/ac-cleaning/process/" className="text-sky-400 hover:underline">
              施工作業流程 &rarr;
            </Link>
            <Link href="/services/ac-cleaning/split-type/" className="text-sky-400 hover:underline">
              分離式冷氣清洗 &rarr;
            </Link>
            <Link href="/services/ac-cleaning/odor-mold/" className="text-sky-400 hover:underline">
              霉味異味除臭 &rarr;
            </Link>
            <Link href="/services/ac-cleaning/dripping-not-cooling/" className="text-sky-400 hover:underline">
              滴水不冷檢查 &rarr;
            </Link>
            <Link href="/services/ac-cleaning/kaohsiung-pingtung/" className="text-sky-400 hover:underline">
              高屏到府服務區 &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 延伸閱讀區塊 */}
      <section className="py-16 bg-slate-950 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/40 rounded-full border border-sky-900/30">
              延伸閱讀
            </span>
            <h2 className="text-xl font-bold text-white mt-4">
              延伸閱讀：清洗保養前先了解
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl mx-auto leading-relaxed">
              如果還在判斷冷氣霉味、滴水、不冷或是否需要清洗，可先閱讀下列說明；實際狀況仍需依機型、髒污程度與現場條件確認。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="bg-slate-900/20 border border-slate-850 p-5 rounded-xl hover:border-slate-800 transition-colors">
              <h3 className="text-base font-bold text-white mb-3">日常保養與常見問題</h3>
              <ul className="space-y-1.5 text-sm sm:text-base font-medium">
                <li>
                  <Link href="/guides/ac-smell-cleaning/" className="py-1.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>冷氣有霉味要清洗嗎？</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/services/ac-cleaning/pricing/" className="py-1.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>冷氣清洗價格與影響因素</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/20 border border-slate-850 p-5 rounded-xl hover:border-slate-800 transition-colors">
              <h3 className="text-base font-bold text-white mb-3">專業清洗項目與判斷</h3>
              <ul className="space-y-1.5 text-sm sm:text-base font-medium">
                <li>
                  <Link href="/services/ac-cleaning/odor-mold/" className="py-1.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>霉味與黴菌清洗</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/services/ac-cleaning/dripping-not-cooling/" className="py-1.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>滴水不冷清洗判斷</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-slate-950 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              冷氣清洗保養常見問題 FAQ
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              為您解答有關冷氣清洗時間、施工防護、霉味與不冷等疑問
            </p>
          </div>

          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* 3. ContactForm + 下方電話 CTA — 放在 FAQ 後、Photo box guide 前 */}
      <section id="contact-section" className="py-16 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm
            heading="冷氣清洗保養諮詢"
            subheading="填寫後一鍵複製到 LINE，讓我們更快了解您的機型、台數與清洗狀況。"
            messagePlaceholder="例如：分離式冷氣 2 台，其中 1 台有霉味、風量變小，想了解清洗保養方式，方便聯絡時間為平日晚上。"
            formLocation="ac_cleaning_service_page"
            defaultService="cleaning-split"
            serviceOptions={[
              { id: "cleaning-split", name: "分離式冷氣清洗" },
              { id: "cleaning-odor", name: "冷氣霉味處理" },
              { id: "cleaning-airflow", name: "冷氣風量變小" },
              { id: "cleaning-drip", name: "冷氣滴水處理" },
              { id: "cleaning-quote", name: "清洗價格詢問" },
              { id: "cleaning-multiple", name: "多台冷氣清洗" },
              { id: "cleaning-other", name: "其他清洗保養需求" }
            ]}
          />
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 mb-3">或直接撥打電話諮詢清洗評估</p>
            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "ac_cleaning", cta_position: "form_phone" }}
              className="inline-flex items-center gap-2 py-3 px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-sm transition-all"
            >
              <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>直接撥打電話</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Photo box guide */}
      <section className="py-12 bg-slate-950 border-t border-slate-900">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-2xl space-y-6">
            <h3 className="text-base font-bold text-white">確認清洗費用？請 LINE 傳送室內機與台數照片</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              壁掛式或天花板吊隱式冷氣的施作工序不同。建議您加官方 LINE 傳送室內機外觀照片，並說明需要清洗的台數與大約位置（例如：客廳一台、臥室兩台），我們將回覆您初步的清洗保養分析。
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "ac_cleaning", cta_position: "cleaning_photo_box" }}
                className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all"
              >
                <span>LINE 傳台數與照片</span>
              </CTAButton>
              
              <Link
                href="/contact/"
                className="w-full sm:flex-1 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-850 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
              >
                <span>預約現場評估</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA 
        serviceType="ac_cleaning"
        phoneText="撥打清洗諮詢"
        lineText="加 LINE 傳照評估"
      />
    </main>
  );
}
