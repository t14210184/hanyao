"use client";

import React, { useState } from "react";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import { siteConfig } from "@/data/site";

const faqs = [
  {
    id: "faq-main-1",
    question: "冷氣安裝前要先買好機器嗎？",
    answer:
      "不一定要先買好。可以先透過 LINE 描述空間需求，由技師協助評估適合的機型與噸數，再決定購買品牌與規格，避免買了不合適的機器後才發現安裝條件不符。",
  },
  {
    id: "faq-main-2",
    question: "分離式和吊隱式冷氣怎麼選？",
    answer:
      "分離式冷氣安裝彈性高、維修方便，適合一般住宅與小型辦公室。吊隱式冷氣將主機隱藏於天花板內，外觀簡潔，但需在裝潢前同步規劃，後期維修也需預留維修孔。可先描述空間條件，由技師協助說明兩者的差異與適用情境。",
  },
  {
    id: "faq-main-3",
    question: "吊隱式冷氣一定要在裝潢前規劃嗎？",
    answer:
      "是的。吊隱式主機需在天花板骨架施作前完成吊裝與配管，裝潢完成後若要新增吊隱式冷氣，維修孔與回風路徑的規劃難度會大幅提高，建議在裝潢前與設計師同步討論。",
  },
  {
    id: "faq-main-4",
    question: "冷氣噸數要怎麼估算？",
    answer:
      "基本估算以每坪約 400~500 Kcal/hr 為基準，但若有頂樓、西曬、挑高或大型電器等熱源，需適度提高估算係數。建議提供坪數、窗向與空間用途，由技師協助進行初步試算。",
  },
  {
    id: "faq-main-5",
    question: "汰舊換新時舊機拆除可以一起處理嗎？",
    answer:
      "可以。換新時可依現場狀況協助說明舊機拆除流程，並評估舊管路是否能留用。原有銅管若管徑、厚度符合新冷媒規格，可在清洗後留用；若不符則建議同步更換。",
  },
  {
    id: "faq-main-6",
    question: "排水管要怎麼安排，才不會日後漏水？",
    answer:
      "排水管需維持至少 1/100 的下斜坡度，接口須確實密封，並於封板前進行灌水測試。若裝潢已完成，需確認現有排水路徑是否符合規格，必要時安排現場確認評估。",
  },
  {
    id: "faq-main-7",
    question: "高雄、屏東哪些地區可以詢問？",
    answer:
      "主要服務區域涵蓋高雄市各區（含三民、左營、楠梓、鳳山、仁武等）與屏東縣各鄉鎮（含屏東市、潮州、東港、萬丹等）。可先 LINE 描述地址與需求，由我們確認可服務範圍。",
  },
  {
    id: "faq-main-8",
    question: "LINE 詢問安裝要提供哪些資料？",
    answer:
      "建議提供：（1）欲安裝空間照片、（2）坪數或平面圖、（3）室外機預計擺放位置照片、（4）是否有裝潢進度或時間限制。資料越完整，技師越能快速給出初步評估方向。",
  },
];

const subpageCards = [
  {
    href: "/services/ac-installation/split-ac/",
    title: "分離式冷氣安裝",
    summary: "住宅與小型辦公室最常見機種，安裝彈性高、保養便利。",
    questions: [
      "室內機裝哪個位置最合適？",
      "銅管要多長、怎麼配？",
      "室外機怎麼架才穩固又散熱好？",
    ],
  },
  {
    href: "/services/ac-installation/concealed-ac/",
    title: "吊隱式冷氣安裝",
    summary: "將主機隱藏於天花板，保持空間美觀，需裝潢前同步規劃。",
    questions: [
      "什麼時候要跟木工討論？",
      "維修孔要留在哪裡？",
      "回風口怎麼設計才不會短路？",
    ],
  },
  {
    href: "/services/ac-installation/replacement/",
    title: "冷氣汰舊換新",
    summary: "舊機拆除、管路評估、新機安裝一次規劃，依現場條件說明流程。",
    questions: [
      "舊銅管可以留用嗎？",
      "電源容量夠不夠？",
      "新舊機型號不同怎麼處理？",
    ],
  },
  {
    href: "/services/ac-installation/piping-drainage/",
    title: "配管排水規劃",
    summary: "排水坡度與密封工法是防止滴水壁癌的關鍵，封板前需先測試。",
    questions: [
      "排水管斜度要多少才夠？",
      "明管和暗管哪個好？",
      "配管完成後怎麼驗收？",
    ],
  },
  {
    href: "/services/ac-installation/capacity-planning/",
    title: "坪數噸數規劃",
    summary: "依空間坪數、樓層與熱源評估冷房能力，避免選錯規格。",
    questions: [
      "頂樓西曬要加大幾噸？",
      "挑高空間怎麼算？",
      "變頻冷氣買太大有什麼問題？",
    ],
  },
  {
    href: "/services/ac-installation/cost/",
    title: "安裝費用與流程",
    summary: "說明標準安裝範疇與可能追加項目，施工前先確認再報價。",
    questions: [
      "標準安裝費用包含什麼？",
      "洗孔、高空作業怎麼收費？",
      "現場確認後不裝會收費嗎？",
    ],
  },
];

const preCheckItems = [
  { label: "坪數與使用情境", desc: "住宅臥室、客廳或商業空間，使用強度不同，噸數估算也不同。" },
  { label: "室內機安裝位置", desc: "需確認牆壁承重、冷風方向，避免直吹床頭或主要座位。" },
  { label: "室外機安裝位置", desc: "需評估散熱空間、機架安全性與鄰近熱源情況。" },
  { label: "排水路徑", desc: "確認排水管可下斜路徑，避免過多彎折或需穿越裝潢的複雜路線。" },
  { label: "電源與迴路", desc: "確認冷氣專用迴路是否足夠，避免與其他大型電器共用而跳電。" },
  { label: "是否配合裝潢進度", desc: "吊隱式或埋管配置需在木工封板前完成，需與設計師時間配合。" },
  { label: "日後維修孔與保養動線", desc: "預先規劃維修孔尺寸與位置，避免日後清洗濾網或維修時無法施作。" },
];

const processSteps = [
  { title: "LINE／電話描述需求", desc: "告知空間類型、坪數、是否配合裝潢，以及預計安裝機型或尚未決定。" },
  { title: "提供空間照片與尺寸", desc: "上傳室內空間照、預計室外機位置照、電箱照，讓技師初步評估。" },
  { title: "初步判斷機型與施工條件", desc: "依照片資訊評估噸數、配管長度與可能的施工條件，提供初步方向。" },
  { title: "必要時安排現場確認", desc: "若管線條件複雜或吊隱式規劃需要，安排技師到府確認並詳細評估。" },
  { title: "說明安裝方式與報價", desc: "依機型、施工條件與材料項目逐一說明報價，確認後再安排施作日期。" },
  { title: "安裝完成後提供使用注意事項", desc: "完工後說明運轉測試結果、保養週期建議與緊急聯絡方式。" },
];

function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="border border-slate-850 rounded-xl overflow-hidden">
            <button
              id={faq.id}
              className="w-full text-left px-5 py-4 flex justify-between items-center gap-3 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-white leading-snug">{faq.question}</span>
              <svg
                className={`w-4 h-4 text-sky-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 py-4 bg-slate-950 text-xs sm:text-sm text-slate-400 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AcInstallationServiceClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">

      {/* ── Breadcrumb ── */}
      <div className="bg-slate-950 py-3 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex text-xs text-slate-500 space-x-2">
            <Link href="/" className="hover:text-sky-400">首頁</Link>
            <span>/</span>
            <Link href="/services/" className="hover:text-sky-400">服務項目</Link>
            <span>/</span>
            <span className="text-slate-400">空調冷氣安裝</span>
          </nav>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            高雄 • 屏東專業空調建置
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            空調冷氣安裝｜高雄、屏東分離式、變頻、吊隱式冷氣規劃
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            不只安裝冷氣，也協助評估坪數、冷房能力、室內外機位置、配管排水與日後維修便利性。可先透過 LINE 提供空間照片與需求，依現場條件評估安裝方式。
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "ac_installation", cta_position: "hero_line" }}
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
              trackParams={{ service_type: "ac_installation", cta_position: "hero_phone" }}
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

      {/* ── Scope ── */}
      <section className="py-10 bg-slate-950 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-widest mb-4">本服務涵蓋範圍</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {[
                "住宅冷氣安裝（公寓、透天、新屋裝修）",
                "分離式與變頻冷氣安裝",
                "吊隱式冷氣規劃與安裝",
                "小型店面與小型辦公室冷氣安裝",
                "新屋裝修配管與裝潢前管路規劃",
                "冷氣汰舊換新（含舊機拆除）",
                "配管排水坡度規劃與室外機位置評估",
                "坪數噸數計算與冷房能力建議",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full mt-1.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-850">
              大型商用空調、VRV 多聯式系統、冰水主機工程等，請參閱
              <Link href="/services/commercial-ac/" className="text-sky-400 hover:underline ml-1">
                商用空調工程服務 →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Subpage cards ── */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white">安裝需求快速選擇</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              選擇最符合您需求的情境，查看規劃重點與常見問題說明。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subpageCards.map((card) => (
              <div
                key={card.href}
                className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col hover:border-slate-700 transition-colors"
              >
                <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">{card.summary}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {card.questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="text-sky-500 mt-0.5 shrink-0">›</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={card.href}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 w-full py-2.5 border border-sky-800/50 bg-sky-950/30 hover:bg-sky-950/60 text-sky-400 text-xs font-bold rounded-xl transition-colors"
                >
                  查看規劃重點 &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pre-check ── */}
      <section className="py-16 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white border-l-4 border-sky-500 pl-3 mb-8">
            安裝前需要確認什麼
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {preCheckItems.map((item, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 flex items-start gap-4">
                <span className="w-7 h-7 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{item.label}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white border-l-4 border-sky-500 pl-3 mb-8">
            安裝洽談流程
          </h2>
          <div className="space-y-4">
            {processSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-slate-900/20 border border-slate-850/60 rounded-2xl p-5">
                <span className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center text-sm font-bold shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white mb-1">{step.title}</p>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mid CTA */}
          <div className="mt-10 text-center p-8 bg-sky-950/20 border border-sky-900/30 rounded-2xl">
            <p className="text-xs sm:text-sm text-sky-300 font-semibold mb-4">
              可先 LINE 描述需求，由技師依現場條件評估安裝方式
            </p>
            <div className="max-w-xs mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "ac_installation", cta_position: "mid_line" }}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>LINE 傳照片諮詢</span>
              </CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white border-l-4 border-sky-500 pl-3 mb-8">
            常見問題解答 FAQ
          </h2>
          <FAQSection />
        </div>
      </section>

      {/* ── GEO ── */}
      <section className="py-14 bg-slate-950 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
            主要服務與可詢問區域
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5">
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">高雄市</p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                三民、左營、楠梓、鼓山、苓雅、前鎮、小港、鳳山、仁武、大寮、岡山、橋頭及高雄市各區
              </p>
            </div>
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5">
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">屏東縣</p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                屏東市、潮州、東港、萬丹、長治、麟洛、內埔、九如、里港、恆春、車城及屏東縣各鄉鎮
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            可先 LINE 描述地址與需求，由我們確認可服務範圍後再安排後續。
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 relative overflow-hidden bg-slate-900/40 border-t border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            先確認條件，再說明安裝方式與費用
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-6 tracking-tight sm:text-3xl">
            還不確定冷氣要裝哪一種？<br className="hidden sm:block" />先把空間照片傳給我們判斷
          </h2>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-xl mx-auto">
            可先 LINE 描述需求，提供空間照片與坪數，由技師依現場條件評估最適合的安裝方式，必要時安排現場確認。
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "ac_installation", cta_position: "bottom_line" }}
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
              trackParams={{ service_type: "ac_installation", cta_position: "bottom_phone" }}
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
