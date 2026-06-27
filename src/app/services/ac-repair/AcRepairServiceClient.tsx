"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import CTAButton from "@/components/CTAButton";
import FAQAccordion from "@/components/FAQAccordion";
import TrustSection from "@/components/TrustSection";
import PriceFactorsSection from "@/components/PriceFactorsSection";
import ContactForm from "@/components/ContactForm";

const faqs = [
  {
    id: "main-faq-1",
    question: "冷氣不冷一定是冷媒不足嗎？",
    answer: "不一定。最常見的原因是濾網或冷凝器嚴重髒污堵塞風道，或是室外機散熱不良。冷媒在密閉系統內若無洩漏是不需要添加的。若是漏冷媒，必須先找出洩漏點修補，單純灌冷媒只會反覆漏光。"
  },
  {
    id: "main-faq-2",
    question: "冷氣漏水可以自己清排水管嗎？",
    answer: "如果只是排水管出口有泥沙阻塞，可自行清理；但如果是室內機內部水盤積垢、黴菌堵塞，或管線坡度問題，自行清理容易損壞管線或導致積水往裝潢滲漏，建議委由專業師傅處理。"
  },
  {
    id: "main-faq-3",
    question: "冷氣一直跳電可以繼續開嗎？",
    answer: "不行。跳電代表電路過載、短路或壓縮機故障，是系統的安全保護機制。反覆強行啟動會導致電控板燒毀、電線損壞甚至引發大火。請先保持電源關閉並預約檢測。"
  },
  {
    id: "main-faq-4",
    question: "冷氣有異音是不是壓縮機壞了？",
    answer: "不一定。室內機異音多為風鼓髒污不平衡、風扇馬達軸承老化磨損；室外機異音可能是避震腳墊老化硬化共振。壓縮機故障通常會伴隨冷氣完全不冷，並發出劇烈卡死的嗡嗡聲。"
  },
  {
    id: "main-faq-5",
    question: "灌冷媒可以撐多久？",
    answer: "若沒有修補漏點，灌冷媒可能幾天至幾週內就會漏光。必須先由技師進行壓力測試，找出確切洩漏處焊接修補或重做接頭喇叭口，抽真空後重新定量充填，才能維持長期運運裝。"
  },
  {
    id: "main-faq-6",
    question: "維修前需要先清洗冷氣嗎？",
    answer: "如果冷氣不冷是由於鰭片與風鼓積塵過多，通常清洗保養即可解決；但如果是啟動電容或控制基板損壞，則需先進行零件維修更換。技師現場檢測時會為您說明主要原因。"
  },
  {
    id: "main-faq-7",
    question: "高雄、屏東哪些地區可服務？",
    answer: "我們主要服務高雄市（如三民、左營、楠梓、鼓山、苓雅、前鎮、小港、鳳山、仁武、大寮、岡山、橋頭等）與屏東縣市（如屏東市、潮州、東港、萬丹、長治、麟洛、內埔、九如、里港、恆春、車城等）鄰近區域。技師會依現有排程與動線規劃提供到府檢修。"
  },
  {
    id: "main-faq-8",
    question: "LINE 詢問要提供哪些資料？",
    answer: "建議提供冷氣品牌型號（室內機下方的貼紙照片）、故障現象的照片或短影片（如漏水位置、異常噪音聲），並告知您的所在區域與方便聯絡時間，以利技師線上初步分析可能原因。"
  }
];

const symptomCards = [
  {
    title: "冷氣不冷",
    url: "/services/ac-repair/not-cold/",
    symptom: "冷氣吹風不冷，室溫降不下來，冷房速度變慢",
    causes: ["濾網或鰭片卡塵髒污", "啟動電容衰退損壞", "系統管路微漏冷媒"]
  },
  {
    title: "冷氣漏水滴水",
    url: "/services/ac-repair/leaking-water/",
    symptom: "室內機滴水漏水，出風口噴水，牆面受潮滲水",
    causes: ["排水管與水盤堵塞", "排水管安裝坡度不良", "蒸發器結冰融化溢水"]
  },
  {
    title: "冷氣異音",
    url: "/services/ac-repair/noise/",
    symptom: "室內機怪聲運轉，室外機噪音大，震動共鳴聲",
    causes: ["風鼓卡滿髒污失衡", "馬達軸承老化磨損", "外機支架安裝鬆動"]
  },
  {
    title: "冷氣跳電不啟動",
    url: "/services/ac-repair/no-power/",
    symptom: "冷氣打不開，燈號異常閃爍，開機後立刻跳電",
    causes: ["控制基板電控損壞", "壓縮機過載跳機保護", "系統漏電或短路跳閘"]
  },
  {
    title: "冷媒不足 / 漏冷媒",
    url: "/services/ac-repair/refrigerant-leak/",
    symptom: "冷度明顯衰退，出風口不冷，銅管接頭處結霜",
    causes: ["接頭擴口老化微漏", "銅管因碰撞砂孔漏冷媒", "銅帽鬆脫或破裂洩漏"]
  },
  {
    title: "維修費用與檢測流程",
    url: "/services/ac-repair/cost/",
    symptom: "想了解檢修收費標準，報價流程與施工保固",
    causes: ["依現場狀況實地查驗", "零件材料與拆裝工資明細", "客戶同意後才進行施作"]
  }
];

export default function AcRepairServiceClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* 一、Hero 首屏 */}
      <section className="relative py-16 sm:py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-slate-900/15 blur-[120px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            透明診斷 • 誠實報價
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            高雄、屏東冷氣維修｜冷氣不冷、漏水、異音、跳電先檢查再說明
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            家用與商用冷氣常見故障檢修，協助判斷不冷、滴水、漏水、異音、跳電、不啟動、冷媒異常等問題。可先透過 LINE 描述狀況，師傅依現場情況評估處理方向。
          </p>

          {/* 首屏 CTA 按鈕 */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "ac_repair", cta_position: "lp_hero_line" }}
              className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>LINE 傳照片諮詢</span>
            </CTAButton>

            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "ac_repair", cta_position: "lp_hero_phone" }}
              className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>立即電話諮詢</span>
            </CTAButton>
          </div>

          {/* 首屏下方信任點 */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-slate-850 pt-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-2">
              <span className="text-sky-400 font-bold shrink-0">✓</span>
              <p className="text-xs text-slate-350"><strong className="text-white block">高雄 / 屏東服務</strong>提供在地技術士團隊到府評估</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sky-400 font-bold shrink-0">✓</span>
              <p className="text-xs text-slate-350"><strong className="text-white block">整合空調服務</strong>提供維修、清洗與安裝一條龍</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sky-400 font-bold shrink-0">✓</span>
              <p className="text-xs text-slate-350"><strong className="text-white block">線上故障說明</strong>依據描述與影像分析可能原因</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sky-400 font-bold shrink-0">✓</span>
              <p className="text-xs text-slate-350"><strong className="text-white block">不誇大保證</strong>不捏造數據，實事求是報價</p>
            </div>
          </div>
        </div>
      </section>

      {/* 二、症狀快速選擇區 */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/40 rounded-full border border-sky-900/30">
              常見症狀排查
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-4">
              您的冷氣遇到什麼問題？請選擇對應症狀
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {symptomCards.map((card, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/35 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-950/10 transition-all duration-300 group"
              >
                <div>
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mb-4">{card.symptom}</p>
                  <div className="mb-6">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">常見原因：</span>
                    <ul className="space-y-1.5">
                      {card.causes.map((cause, cIdx) => (
                        <li key={cIdx} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link 
                  href={card.url}
                  className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-sky-400 group-hover:text-white group-hover:bg-sky-600 font-bold rounded-lg border border-slate-800 group-hover:border-sky-600 text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <span>查看處理方式 &rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TrustSection — 信任背書 */}
      <TrustSection />

      {/* 三、維修流程區 */}
      <section className="py-16 bg-slate-900/10 border-t border-b border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/40 rounded-full border border-sky-900/30">
              標準維修流程
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-4">
              從線上初步判斷到現場透明報價的完整流程
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: "01", title: "描述狀況", desc: "透過 LINE 或電話向技師描述故障症狀。" },
              { step: "02", title: "提供基本資料", desc: "提供冷氣類型、品牌、地址區域及故障特徵。" },
              { step: "03", title: "初步診斷原因", desc: "技師依影像與敘述進行線上初步判斷。" },
              { step: "04", title: "必要時現場檢查", desc: "安排技師攜帶測試儀器至現場實地查驗。" },
              { step: "05", title: "現場報價說明", desc: "現場向您說明可能原因與零件明細，經同意後施工。" },
              { step: "06", title: "維修與保固建議", desc: "完成維修測試，提供後續合理使用與保養建議。" }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900/20 border border-slate-850/60 p-5 rounded-xl relative">
                <span className="absolute top-4 right-4 text-xl font-extrabold text-slate-800 leading-none">
                  {item.step}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 四、使用者先準備什麼 */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-2xl">
            <h2 className="text-base sm:text-lg font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              為了更快速地為您判斷，預約前請先準備：
            </h2>

            <ul className="space-y-4">
              {[
                "冷氣品牌與型號（可於室內機下方的型號貼紙銘牌拍攝照片）",
                "室內機與室外機的安裝環境照片（協助判斷施作空間）",
                "漏水位置照片，若有異常聲音建議錄製 10-15 秒影片",
                "近期是否曾進行過高壓清洗、移機或充填冷媒",
                "您的所在區域（如高雄左營區、屏東潮州鎮）與方便聯絡時段"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded bg-sky-950 text-sky-400 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">
                    ✓
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PriceFactorsSection — 為何需要現場檢測 */}
      <PriceFactorsSection
        title="冷氣維修費用受哪些因素影響？"
        subtitle="冷氣故障原因多樣，相同症狀可能對應不同零件或管路問題。需現場檢測、確認故障點與處理方式後，才能提供較合理的估價說明。"
        factors={[
          {
            name: "故障原因與零件類型",
            description: "冷氣不冷、漏水、異音或跳電，可能涉及電容、風扇馬達、主機板、排水、冷媒管路或其他零件問題，需現場檢測後判斷。"
          },
          {
            name: "冷媒與漏點檢查",
            description: "若疑似冷媒不足或冷媒洩漏，需確認是否有漏點、管路狀況與修復方式，處理內容會影響估價。"
          },
          {
            name: "室外機位置與施工安全",
            description: "室外機高度、維修空間、散熱環境與施工安全條件，都會影響檢修方式與所需時間。"
          }
        ]}
      />

      {/* 延伸閱讀區塊 */}
      <section className="py-16 bg-slate-950 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-base sm:text-lg font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/40 rounded-full border border-sky-900/30">
              延伸閱讀
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-4">
              延伸閱讀：常見冷氣維修判斷
            </h2>
            <p className="text-lg sm:text-xl text-slate-200 mt-3 max-w-2xl mx-auto leading-[1.8]">
              如果還在判斷冷氣不冷、漏水或是否需要檢修，可先閱讀下列說明；實際原因仍需依現場環境、機型與檢測結果確認。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-xl hover:border-slate-800 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">常識與故障自助排查</h3>
              <ul className="space-y-2 text-lg sm:text-xl font-semibold">
                <li>
                  <Link href="/guides/ac-not-cold/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>冷氣不冷怎麼辦？</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/guides/ac-leaking-water/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>冷氣漏水怎麼辦？</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-xl hover:border-slate-800 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">專業檢修服務細項</h3>
              <ul className="space-y-2 text-lg sm:text-xl font-semibold">
                <li>
                  <Link href="/services/ac-repair/not-cold/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>冷氣不冷檢修服務</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/services/ac-repair/leaking-water/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>冷氣漏水檢修服務</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 五、FAQ 區塊 */}
      <section className="py-16 bg-slate-900/10 border-t border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/40 rounded-full border border-sky-900/30">
              常見問題 FAQ
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-4">
              冷氣故障檢修常見疑難解答
            </h2>
          </div>

          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* 六、LINE 複製式諮詢表單 */}
      <section
        id="contact-section"
        className="py-16 bg-slate-950 border-t border-slate-900 scroll-mt-20"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm
            heading="冷氣故障維修諮詢"
            subheading="填寫後一鍵複製到 LINE，讓我們更快了解您的冷氣故障狀況。"
            messagePlaceholder="例如：分離式冷氣開機後不冷，室外機沒有明顯運轉聲，想了解是否需要檢修，方便聯絡時間為平日晚上。"
            formLocation="ac_repair_service_page"
            defaultService="repair-not-cold"
            serviceOptions={[
              { id: "repair-not-cold",    name: "冷氣不冷" },
              { id: "repair-leaking",     name: "冷氣漏水" },
              { id: "repair-noise",       name: "冷氣異音" },
              { id: "repair-trip",        name: "冷氣跳電" },
              { id: "repair-refrigerant", name: "漏冷媒檢查" },
              { id: "repair-no-power",    name: "無法開機" },
              { id: "repair-quote",       name: "維修費用詢問" },
              { id: "repair-other",       name: "其他維修問題" },
            ]}
          />
          {/* 電話 CTA 同區區塊顯示 */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 mb-3">或直接撥打電話諮詢故障排除</p>
            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "ac_repair", cta_position: "form_phone" }}
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

      {/* 六、GEO 區塊 */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-2xl">
            <div className="text-center mb-8">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/40 rounded-full border border-sky-900/30">
                服務區域說明
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-4">
                高雄與屏東主要服務與可詢問區域
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                ※ 實際派車到府時間需視當日技師排程及動線規劃而定。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-slate-400 leading-relaxed">
              <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-900">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sky-400">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                  高雄服務地區：
                </h3>
                <p>三民區、左營區、楠梓區、鼓山區、苓雅區、前鎮區、小港區、鳳山區、仁武區、大寮區、岡山區、橋頭區 等主要服務及可詢問區域。</p>
              </div>

              <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-900">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sky-400">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                  屏東服務地區：
                </h3>
                <p>屏東市、潮州鎮、東港鎮、萬丹鄉、長治鄉、麟洛鄉、內埔鄉、九如鄉、里港鄉、恆春鎮、車城鄉 等主要服務及可詢問區域。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 七、底部強 CTA */}
      <section className="py-16 relative overflow-hidden bg-slate-900/40 border-t border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            初步分析 • 現場報價
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-6 tracking-tight">
            還不知道冷氣是哪裡壞？先把症狀傳給我們判斷
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed max-w-xl mx-auto">
            不捏造數據，不強推無用維修。您可以加 LINE 傳送滴水位置、故障閃燈照片或錄製異常運轉聲音，協助初步判斷原因。
          </p>

          {/* 底部按鈕 */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "ac_repair", cta_position: "lp_bottom_line" }}
              className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>LINE 傳照片諮詢</span>
            </CTAButton>

            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "ac_repair", cta_position: "lp_bottom_phone" }}
              className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>立即電話諮詢</span>
            </CTAButton>
          </div>
        </div>
      </section>
    </main>
  );
}
