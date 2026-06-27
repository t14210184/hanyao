"use client";

import React, { useState } from "react";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import TrustSection from "@/components/TrustSection";
import PriceFactorsSection from "@/components/PriceFactorsSection";
import ContactForm from "@/components/ContactForm";
import { siteConfig } from "@/data/site";

const faqItems = [
  {
    id: "faq-1",
    question: "商用空調和一般冷氣安裝差在哪？",
    answer: "商用空調通常涉及更大坪數 of 冷房噸數、複雜的室內機分配（如一對多或 VRF 系統）、高用電容量核算、風管規劃與室外機散熱評估。相較於一般家用一對一冷氣，商用工程在施工規範、冷媒管路長度與起重吊掛等安裝條件上，有更多安全防護與系統選型考量。"
  },
  {
    id: "faq-2",
    question: "辦公室適合 VRF 還是分離式？",
    answer: "若辦公室有多個隔間且使用時間不同，VRF/VRV 多聯式系統可獨立分區溫控，有助於減少無人空間的耗電，並簡化配管路徑。若為單一開放式大空間，高靜壓吊隱式分離式冷氣則為性價比較高的選擇。建議提供平面圖，依現場供電容量與格局進行系統評估。"
  },
  {
    id: "faq-3",
    question: "餐飲店面冷氣要注意哪些熱源？",
    answer: "餐飲店面最大的熱源通常來自廚房設備、人員頻繁出入帶來的冷量流失以及玻璃大面造成的日照熱負荷。規劃時需考量前場與後場的氣流方向，避免廚房熱氣逆流。此外，嵌入式主機的排水坡度與封板前的排水灌水測試也極為重要，可協助降低運轉後的滴水風險。"
  },
  {
    id: "faq-4",
    question: "廠房空調一定要用冰水主機嗎？",
    answer: "不一定。若廠區空間挑高大、設備發熱量極高，冰水主機系統（氣冷式或水冷式）是處理大噸數的常見選擇；但若廠房有特定作業區需要降溫，亦可評估大風量氣冷直膨式系統或風管分區送風。建議提供廠區平面配置與設備發熱量，依實際條件說明適合方案。"
  },
  {
    id: "faq-5",
    question: "冰水主機和 VRF 怎麼選？",
    answer: "冰水主機以冰水輸送冷量，冷媒集中於主機端，適合整棟大型建築或需集中管理、冷凍噸數極大的廠區. VRF 系統則以冷媒直接輸送，安裝空間彈性大，適合中型商業大樓或多分區獨立控制需求。兩者需依建築規模、用電配置與吊掛條件進行評估。"
  },
  {
    id: "faq-6",
    question: "可以只做維護保養合約嗎？",
    answer: "可以. 針對既有辦公室或工廠的空調設備，我們提供定期巡檢與保養合約，依約定頻率進行電流、冷媒量測與基本清潔，協助提早發現零件磨損或冷媒慢漏，協助降低設備非計畫性停機的風險。合約內容依設備規模與數量另行評估說明。"
  },
  {
    id: "faq-7",
    question: "高雄屏東哪些地區可詢問？",
    answer: "我們主要服務與可詢問區域包括：高雄市（如三民、左營、楠梓、鼓山、苓雅、前鎮、小港、鳳山、仁武、大寮、岡山、橋頭、路竹、燕巢等各區）及屏東縣（如屏東市、潮州、東港、萬丹、長治、麟洛、內埔、九如、里港、恆春、車城等各鄉鎮），皆可加 LINE 傳照片或平面圖進行初步諮詢。"
  },
  {
    id: "faq-8",
    question: "LINE 詢問要提供哪些資料？",
    answer: "可先 LINE 提供格局平面圖、現場空間照片、使用的冷氣主機銘牌（規格標籤）照片、配電箱現況照片以及特殊需求說明（如特定製程溫濕度控制）。資料越完整，越能協助技師進行初步判斷與系統選型說明，必要時我們也會安排現場確認。"
  }
];

const cards = [
  {
    title: "辦公室與商辦空調規劃",
    href: "/services/commercial-ac/office-ac/",
    desc: "多隔間、分區控溫與能源管理需求",
    scenarios: [
      "多間獨立會議室分區溫控",
      "大樓廠辦獨立分戶電表規劃",
      "老舊大樓多聯式空調管路改造"
    ]
  },
  {
    title: "餐飲、店面與賣場空調",
    href: "/services/commercial-ac/restaurant-retail/",
    desc: "營業空間廚房熱隔離、人員進出頻繁冷房評估",
    scenarios: [
      "前場用餐區與後場廚房熱氣隔離",
      "商業場所嵌入式冷氣漏水防護",
      "店面挑高大門防風簾與氣流配置"
    ]
  },
  {
    title: "廠房與工業空調改善",
    href: "/services/commercial-ac/factory-ac/",
    desc: "挑高廠區、製程發熱設備降溫與局部冷房規劃",
    scenarios: [
      "機械高熱源排氣與冷風管整合",
      "精密生產線特定溫濕度控制",
      "大面積廠區高效率氣冷/水冷系統"
    ]
  },
  {
    title: "VRF / VRV 多聯式商用空調",
    href: "/services/commercial-ac/vrf-vrv/",
    desc: "一台室外機搭配多台室內機，彈性配管分區控制",
    scenarios: [
      "室外機空間有限、需長管路施工",
      "辦公區需要集中與個別獨立控制",
      "低天花板高度之吊隱式室內機配置"
    ]
  },
  {
    title: "冰水主機與中央空調系統",
    href: "/services/commercial-ac/chiller-system/",
    desc: "大冷凍噸數中央空調、新設與改建系統選型規劃",
    scenarios: [
      "整棟商辦大樓集中空調系統規劃",
      "水冷式主機與冷卻水塔系統選型",
      "氣冷式冰水主機新設與位置起重評估"
    ]
  },
  {
    title: "商用空調維護保養合約",
    href: "/services/commercial-ac/maintenance-contract/",
    desc: "企業空調定期巡檢與日常耗損提早排除",
    scenarios: [
      "防範無預警跳機造成的運作中斷",
      "定期電流冷媒檢測與節能評估",
      "年度大噸數主機清洗與巡檢排程"
    ]
  }
];

export default function CommercialAcServiceClient() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <main className="flex-1 flex flex-col pt-16 bg-slate-950 text-slate-100">
      {/* 一、Hero 首屏 */}
      <section className="relative py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[40%] h-[80%] rounded-full bg-sky-950/10 blur-[100px] pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            企業・廠辦・商業空間
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            商用空調工程｜高雄屏東辦公室、店面、廠房、VRF與冰水主機規劃
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            協助評估商辦、餐飲、店面、廠房與大型空間的冷房需求、系統選型、配管風管、室外機配置與後續維護方式。可先提供平面圖、現場照片與使用需求，依現場條件評估適合的商用空調方案。
          </p>

          {/* Hero CTA */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3 max-w-sm mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "commercial_ac", cta_position: "hero_line" }}
              className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>LINE 傳平面圖諮詢</span>
            </CTAButton>
            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "commercial_ac", cta_position: "hero_phone" }}
              className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>立即電話諮詢</span>
            </CTAButton>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            主要服務與可詢問區域：高雄市各區・屏東縣各鄉鎮
          </p>
        </div>
      </section>

      {/* Scope Distinction */}
      <section className="py-10 bg-slate-950 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">一般住宅與小型空間</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                分離式冷氣、吊隱式冷氣、汰舊換新、住宅坪數噸數規劃 →{" "}
                <Link href="/services/ac-installation/" className="text-sky-400 hover:underline">
                  冷氣安裝服務頁
                </Link>
              </p>
            </div>
            <div className="rounded-xl border border-sky-900/40 bg-sky-950/10 px-5 py-4">
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">商用空調工程（本頁）</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                辦公大樓、餐飲店面、廠房工業、VRF／VRV 多聯式、冰水主機、維護合約
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 二、商用需求快速選擇區 */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">商用需求快速選擇</h2>
            <p className="text-base sm:text-lg text-slate-200 mt-2 leading-[1.8]">
              針對不同商業場域與系統配置，提供對應的空調規劃重點，點擊以查看細節。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0"></span>
                    {card.title}
                  </h3>
                  <p className="text-sm sm:text-base text-sky-300 font-medium mb-4">{card.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {card.scenarios.map((scene, sIdx) => (
                      <li key={sIdx} className="text-base sm:text-lg text-slate-200 flex items-start gap-2 leading-[1.8]">
                        <span className="text-sky-500 shrink-0 font-medium">•</span>
                        <span>{scene}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={card.href}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-bold rounded-xl flex items-center justify-center gap-1 text-base sm:text-lg min-h-[56px] border border-slate-700 transition-colors mt-auto"
                >
                  <span>查看規劃重點</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TrustSection — 信任背書 */}
      <TrustSection />

      {/* 三、商用空調規劃前需要確認什麼 */}
      <section className="py-20 bg-slate-900/20 border-t border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white">商用空調規劃前需要確認什麼</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              商用工程相較一般家用冷氣更為繁複，以下是評估與設計時需考量的重要項目：
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "空間坪數與使用型態",
              "營業時間與尖峰人流",
              "現有設備與用電容量",
              "室外機或主機放置位置",
              "風管 / 冷媒管 / 冰水管路徑",
              "排水與維修動線",
              "是否需要分區控制或長期保養"
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 border border-sky-500/20">
                  {idx + 1}
                </span>
                <span className="text-xs sm:text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PriceFactorsSection — 為何需要現場評估 */}
      <PriceFactorsSection
        title="商用空調工程為什麼需要依現場條件評估？"
        subtitle="商用空調會受到空間大小、使用型態、主機位置、管線與電力條件影響。先了解現場條件，才能提出較合適的規劃方向與估價方式。"
        factors={[
          {
            name: "空間熱負荷與使用型態",
            description: "依空間坪數、樓高、隔間、使用人數、設備熱源與日照條件，評估需要的冷房能力與系統配置。"
          },
          {
            name: "管線路徑與電力條件",
            description: "冷媒管、排水、電源與控制線配置會影響施工方式；現場配電容量與維修動線也需要一併確認。"
          },
          {
            name: "主機位置、散熱與維護空間",
            description: "室外機或主機的位置、通風散熱條件、排水坡度與後續維修可達性，都會影響整體規劃。"
          }
        ]}
      />

      {/* 四、商用空調規劃流程 */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-white">商用空調規劃流程</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              我們提供從需求諮詢、初步方案說明到安裝試運轉的作業流程。
            </p>
          </div>
          <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
            {[
              { title: "LINE / 電話描述需求", desc: "可先經由 LINE 或電話與我們取得聯絡，描述您所遇到的冷氣空調規劃或維護需求。" },
              { title: "提供平面圖、照片與現況設備", desc: "可先傳送空間格局平面圖、現場配置照片與既有空調設備照片以加速評估。" },
              { title: "初步判斷系統類型", desc: "技師依提供的圖面與熱源資料進行初步系統分析，並說明可能的選型方向。" },
              { title: "必要時現場確認", desc: "因應商用主機配置、吊裝與電力條件之複雜度，必要時派技師至現場實地勘查。" },
              { title: "說明系統選型與施工條件", desc: "提供完整的系統配置方案，並依系統規模、設備型式與施工條件說明費用項目。" },
              { title: "安裝試運轉或維護保養安排", desc: "由持有相關證照之技師依計畫進行施工安裝、冷媒管路鋪設及最終試運轉，或開始保養巡檢。" }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-sky-500 text-sky-400 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 相關商用服務區塊 */}
      <section className="py-16 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-base sm:text-lg font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              延伸閱讀
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-4">
              延伸閱讀：商用空調服務與系統評估
            </h2>
            <p className="text-lg sm:text-xl text-slate-200 mt-3 max-w-3xl mx-auto leading-[1.8]">
              不同商用場域的空調需求會受到空間用途、人流、設備熱源、配管條件與維護動線影響；建議先依場域與系統類型了解評估方向，實際規劃仍需依現場條件確認。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 辦公與餐飲零售 */}
            <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-xl hover:border-slate-800 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">場域空調規劃</h3>
              <ul className="space-y-2 text-lg sm:text-xl font-semibold">
                <li>
                  <Link href="/services/commercial-ac/office-ac/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>辦公室空調規劃</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/services/commercial-ac/restaurant-retail/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>餐飲零售空調</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* 工廠與多聯系統 */}
            <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-xl hover:border-slate-800 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">廠辦與多聯式系統</h3>
              <ul className="space-y-2 text-lg sm:text-xl font-semibold">
                <li>
                  <Link href="/services/commercial-ac/factory-ac/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>工廠廠辦空調</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/services/commercial-ac/vrf-vrv/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>VRF / VRV 多聯式</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* 冰水與維護合約 */}
            <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-xl hover:border-slate-800 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">大型主機與維護</h3>
              <ul className="space-y-2 text-lg sm:text-xl font-semibold">
                <li>
                  <Link href="/services/commercial-ac/chiller-system/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>冰水主機系統</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/services/commercial-ac/maintenance-contract/" className="py-2.5 flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <span>維護合約</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 五、FAQ 區塊 */}
      <section className="py-20 bg-slate-900/20 border-t border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-white">常見問題 FAQ</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              針對商用空調工程常見的使用者疑惑，提供專業保守的解答說明。
            </p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(item.id)}
                  className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-slate-900/60 transition-colors"
                >
                  <span className="text-sm sm:text-base font-semibold text-white">{item.question}</span>
                  <span className="text-slate-400 shrink-0">
                    {openFaqId === item.id ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </button>
                {openFaqId === item.id && (
                  <div className="p-5 pt-0 border-t border-slate-800 bg-slate-900/20">
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-4 whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 六、LINE 複製式諮詢表單 */}
      <section
        id="contact-section"
        className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm
            heading="商用空調諮詢"
            subheading="填寫後一鍵複製到 LINE，讓我們更快了解您的商用空調需求。"
            messagePlaceholder="例如：辦公室約 100 坪，目前使用分離式，想了解是否適合改為多聯式，方便聯絡時間為平日下午。"
            formLocation="commercial_ac_service_page"
            defaultService="commercial-ac-office"
            serviceOptions={[
              { id: "commercial-ac-office",      name: "辦公室空調規劃" },
              { id: "commercial-ac-restaurant",  name: "餐飲店面空調" },
              { id: "commercial-ac-factory",     name: "廠房空調改善" },
              { id: "commercial-ac-vrf",         name: "VRF/VRV 多聯式系統" },
              { id: "commercial-ac-chiller",     name: "冰水主機 / 商用主機" },
              { id: "commercial-ac-maintenance", name: "維護保養合約" },
              { id: "commercial-ac-other",       name: "其他商用空調需求" },
            ]}
          />
          {/* 電話 CTA 同區塊顯示 */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 mb-3">或直接撥打電話諮詢專案評估</p>
            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "commercial_ac", cta_position: "form_phone" }}
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
      <section className="py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">主要服務與可詢問區域</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-sky-400 mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                高雄市各區
              </h3>
              <p className="text-base sm:text-lg text-slate-200 leading-[1.8]">
                三民、左營、楠梓、鼓山、苓雅、前鎮、小港、鳳山、仁武、大寮、岡山、橋頭、路竹、燕巢等區域。
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-sky-400 mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                屏東縣市各鄉鎮
              </h3>
              <p className="text-base sm:text-lg text-slate-200 leading-[1.8]">
                屏東市、潮州、東港、萬丹、長治、麟洛、內埔、九如、里港、恆春、車城等區域。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 七、底部強 CTA */}
      <section className="py-20 bg-slate-950 border-t border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-[20%] w-[60%] h-[100%] rounded-full bg-blue-950/10 blur-[100px] pointer-events-none"></div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            正在規劃商用空調？先把平面圖或現場照片傳給我們評估
          </h2>
          <p className="text-base sm:text-lg text-slate-200 leading-[1.8] max-w-xl mx-auto mb-8">
            協助評估冷房容量、主機擺放、分區控制以及氣流分配，必要時安排技師進行現場確認，並依施工與系統條件說明報價。
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-md mx-auto">
            <CTAButton
              href={siteConfig.lineUrl}
              external
              trackEventName="line_click"
              trackParams={{ service_type: "commercial_ac", cta_position: "bottom_line" }}
              className="w-full sm:flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base sm:text-lg min-h-[56px] shadow-md transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>LINE 傳平面圖諮詢</span>
            </CTAButton>
            <CTAButton
              href={siteConfig.phone1Link}
              trackEventName="phone_click"
              trackParams={{ service_type: "commercial_ac", cta_position: "bottom_phone" }}
              className="w-full sm:flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-base sm:text-lg min-h-[56px] transition-all"
            >
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>立即電話諮詢</span>
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Internal Navigation Links */}
      <section className="py-8 bg-slate-950 border-t border-slate-900 text-center space-y-4">
        <span className="text-base text-slate-200 font-bold block">商用空調相關頁面：</span>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-base sm:text-lg font-semibold">
          <Link href="/services/chiller-maintenance/" className="text-sky-400 hover:underline py-2 px-1">冰水主機保養維護 &rarr;</Link>
          <Link href="/cases/" className="text-sky-400 hover:underline py-2 px-1">工程實績 &rarr;</Link>
          <Link href="/about/" className="text-sky-400 hover:underline py-2 px-1">技師資格與憑證 &rarr;</Link>
          <Link href="/contact/" className="text-sky-400 hover:underline py-2 px-1">預約現場估價 &rarr;</Link>
        </div>
      </section>
    </main>
  );
}
