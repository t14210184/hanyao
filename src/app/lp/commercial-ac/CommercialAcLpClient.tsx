"use client";

import React, { useState, useEffect } from "react";
import LandingHero from "@/components/LandingHero";
import PriceFactorsSection from "@/components/PriceFactorsSection";
import FAQAccordion from "@/components/FAQAccordion";
import ContactForm from "@/components/ContactForm";
import FinalCTA from "@/components/FinalCTA";
import TrustSection from "@/components/TrustSection";
import ProcessSection from "@/components/ProcessSection";
import CTAButton from "@/components/CTAButton";
import { trackEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

const fieldCards = [
  {
    title: "工廠 / 廠辦",
    pain: "產線製程散熱量大、設備溫濕度控制嚴格，主機若故障將面臨重大損失風險。",
    solution: "規劃防爆氣冷式主機、精密恆溫恆濕控制與排氣補風平衡工程。",
    cta: "預約工廠場勘",
    ctaLine: "LINE 傳圖初步判斷"
  },
  {
    title: "餐廳 / 店面",
    pain: "廚房熱氣與油煙四散，用餐區溫度分布不均，空氣不流通、異味沉悶。",
    solution: "高靜壓分離式空調搭配全熱交換器，排煙與補風連鎖控制設計。",
    cta: "預約店面場勘",
    ctaLine: "LINE 傳圖初步判斷"
  },
  {
    title: "辦公室",
    pain: "空間間隔經常變動，單一主機無法分區溫控，造成能源浪費與局部悶熱。",
    solution: "採用變頻多聯式 VRV 系統，多房間獨立集控，結合新風引進工程。",
    cta: "預約辦公室場勘",
    ctaLine: "LINE 傳圖初步判斷"
  },
  {
    title: "醫療 / 特特殊空間",
    pain: "診所或照護空間對落塵、落菌數與氣流迴圈方向要求極高，普通冷氣無法滿足。",
    solution: "規劃防菌防霉風管、HEPA過濾機組、微正壓與恆溫氣流流向設計。",
    cta: "預約醫療場勘",
    ctaLine: "LINE 傳圖初步判斷"
  },
  {
    title: "展場 / 大型空間",
    pain: "挑高空間冷房速度慢，人潮湧入瞬間悶熱，大型冷風散熱與電費負擔沉重。",
    solution: "採用高效氣冷/水冷式冰水主機，搭配噴嘴送風大風量管路規劃。",
    cta: "預約展場場勘",
    ctaLine: "LINE 傳圖初步判斷"
  },
  {
    title: "長期維護合約",
    pain: "商用大主機長期未保養耗電高、壽命縮短，突發停機無優先排班搶修服務。",
    solution: "提供每季/半年定期巡檢、耗材預防性汰換、緊急故障優先派車處理。",
    cta: "諮詢維護合約",
    ctaLine: "LINE 諮詢初步評估"
  }
];

const systemCards = [
  {
    name: "中央空調",
    fit: "大型商場、辦公大樓、綜合醫院",
    check: "水冷/風冷機組冷卻塔散熱效能、水管管路結垢與主閥門控制狀態。",
    maintain: "定期風管清潔、風車電機潤滑保養及各分箱自動閥功能檢測。"
  },
  {
    name: "冰水主機",
    fit: "精密工業大廠、半導體廠房、大型醫療院所",
    check: "壓縮機運轉電流、冷媒進出壓力、蒸發器與冷凝器出入水溫差。",
    maintain: "熱交換器銅管物理通管清洗、冷凍油更換與乾燥過濾器定期汰換。"
  },
  {
    name: "氣冷式冰水主機",
    fit: "無安裝冷卻水塔空間或水源受限制之工廠與大型店面",
    check: "冷凝器散熱鰭片髒污堵塞度、風扇馬達運作電流與冷媒壓力平衡。",
    maintain: "定期化學藥劑高壓沖洗冷凝器、電氣控制箱接點清潔與螺絲緊固。"
  },
  {
    name: "VRV / 多聯式空調",
    fit: "旅館、診所、中小型辦公室等多隔間分區控制場景",
    check: "冷媒多向分配器通訊訊號、電子膨脹閥動作開度、通訊控制回路線路。",
    maintain: "室內機濾網高壓除霉清洗、冷凝水管路疏通與運轉參數出風溫度檢測。"
  },
  {
    name: "商用空調保養",
    fit: "各類型中小型公司行號、補習班、連鎖店面之商用主機",
    check: "熱交換器鰭片霉味與污泥積累、出風量與送風扇運轉震動狀況。",
    maintain: "現場高壓化學藥劑深層清洗鰭片與水盤、鼓風輪去污及排水高壓疏通。"
  },
  {
    name: "年度維護合約",
    fit: "追求穩定營運、避免停機損失之企業、機房與金融機構",
    check: "依契約約定每季或半年派持證技師現場完整巡檢，建立設備運轉日誌。",
    maintain: "電容器防護汰換、冷媒洩漏查檢、馬達運轉電流比對，降低無預警故障率。"
  }
];

const priceFactors = [
  {
    name: "空間熱負荷與噸數計算",
    description: "依現場坪數、熱源、製程機器與燈光發熱量、人員密度及玻璃西曬折射，進行空調總冷凍噸數負荷計算，這決定了空調主機的容量規模。"
  },
  {
    name: "配管路徑、用電條件與維護動線",
    description: "冰水管或冷媒銅管的敷設長度與複雜度，是否涉及高空懸掛作業、需申請道路路權架設大型吊車，以及現場配電盤容量、維護動線是否安全通暢。"
  },
  {
    name: "管線配置與排水散熱條件",
    description: "商用空調管路隱蔽施工、排水斜度要求，以及室外主機的通風散熱條件等，皆會影響配管與支架工期。"
  }
];

const faqItems = [
  {
    id: "comm-faq-1",
    question: "商用空調工程在電話中可以報價嗎？為什麼一定要去現場場勘？",
    answer: "商用空調工程需先了解現場條件，不建議只用電話直接報價。因為商用工程涉及設備冷凍噸位精算、冷媒或冰水管路架設路徑、配電盤容量以及與現場消防/裝潢天花板空間的避讓衝突。實地查勘後提供明細報價，方能確保價格精確，無現場隨意加價糾紛。"
  },
  {
    id: "comm-faq-2",
    question: "可以先 LINE 傳平面圖或設備銘牌照片進行初步估算嗎？",
    answer: "可以！您可以先 LINE 傳平面圖、現場照片與設備銘牌做初步判斷。非常歡迎您將室內格局圖（CAD 或 PDF）、舊機規格銘牌照、預估安裝空間照等透過官方 LINE 傳送給我們。工程師可先在線上做初步負荷計算與方案規劃，提供概估方向，必要時再安排現場場勘後提供建議。"
  },
  {
    id: "comm-faq-3",
    question: "公司行號或工廠廠辦施工，可以配合非營業時間施作嗎？",
    answer: "可以。為確保不影響您的企業日間辦公、產線運作或店面營業，我們可配合排定在夜間、週末或假日等非營業時段，進行主機吊裝、打洞配管與大型穿牆施工作業，以不干擾您的營運為首要目標。"
  },
  {
    id: "comm-faq-4",
    question: "什麼是商用空調年度維護合約？對企業有何實質好處？",
    answer: "年度維護合約是透過每季或半年的定期巡檢、耗材與電容預防性汰換、冷媒管路氣密檢測，提前在小故障檢驗前進行排障（例如發現風扇馬達電流異常、電容膨脹、冷媒微漏等）。這能降低無預警故障停機率，維護主能效，有效節省企業電費。"
  },
  {
    id: "comm-faq-5",
    question: "焓耀空調的商用施工人員具備哪些資質證明？",
    answer: "我們為經濟部冷凍空調業登記合規企業（字號：經冷字第 1120002883 號，冷凍空調工程業丙等）、台灣區冷凍空調工程工業同業公會會員，施作師傅持有冷凍空調裝修乙級技術士證照。工程施工嚴格遵守工安防護與國家工程規範，確保商用客群委託大型工程的安全性與專業合規。"
  }
];

export default function CommercialAcLpClient() {
  const [currentArea, setCurrentArea] = useState<"all" | "kaohsiung" | "pingtung">("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const areaParam = params.get("area");
    if (areaParam === "kaohsiung" || areaParam === "pingtung") {
      setCurrentArea(areaParam);
    }

    const handleAreaChangeCustom = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newArea = customEvent.detail;
      if (newArea === "kaohsiung" || newArea === "pingtung") {
        setCurrentArea(newArea);
      } else if (newArea === "all") {
        setCurrentArea("all");
      }
    };

    window.addEventListener("areaChanged", handleAreaChangeCustom);
    return () => window.removeEventListener("areaChanged", handleAreaChangeCustom);
  }, []);

  const getAreaName = () => {
    if (currentArea === "kaohsiung") return "高雄";
    if (currentArea === "pingtung") return "屏東";
    return "高雄 / 屏東";
  };

  const areaName = getAreaName();
  const pageTitle = `焓耀空調工程｜${areaName}商用空調工程、中央空調與冰水主機維修保養`;
  const pageDescription = `焓耀空調工程提供${areaName}商用空調工程、中央空調、冰水主機、VRV 多聯式空調、商用空調保養與年度維護合約。可 LINE 傳平面圖與設備照片，初步判斷後安排場勘。`;

  useEffect(() => {
    document.title = pageTitle;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute("content", pageDescription);
    }
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", `https://www.xusen.pro/lp/commercial-ac/?area=${currentArea}`);
    }
  }, [pageTitle, pageDescription, currentArea]);

  const handlePhoneClick = (ctaPosition: string) => {
    trackEvent("phone_click", {
      service_type: "commercial_ac",
      area: currentArea,
      landing_page_type: "google_ads",
      cta_position: ctaPosition,
      lead_method: "phone",
      keyword_intent: "commercial_ac"
    });
  };

  const handleLineClick = (ctaPosition: string) => {
    trackEvent("line_click", {
      service_type: "commercial_ac",
      area: currentArea,
      landing_page_type: "google_ads",
      cta_position: ctaPosition,
      lead_method: "line",
      keyword_intent: "commercial_ac",
      link_type: "line"
    });
  };

  const handleAppointmentClick = () => {
    // Action tracking placeholder
  };

  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Landing Hero */}
      <LandingHero
        title={`${areaName}商用空調工程｜中央空調、冰水主機、VRV 多聯式規劃維護`}
        subtitle="焓耀空調工程提供辦公大樓、工廠廠辦、餐廳店面與醫療照護空間空調設計施工。持證技師團隊，具備冷凍空調業登記資質，專業到府場勘與透明估價。"
        phoneCtaText="撥打商用工程諮詢"
        lineCtaText="LINE 傳平面圖與照片"
        appointmentCtaText="預約商用空調場勘"
        trackPrefix="commercial"
        serviceType="commercial_ac"
        phoneEventName="phone_click"
        lineEventName="line_click"
        extraParams={{
          landing_page_type: "google_ads",
          keyword_intent: "commercial_ac",
          area: currentArea
        }}
        onPhoneClick={() => handlePhoneClick("lp_hero")}
        onLineClick={() => handleLineClick("lp_hero")}
        onAppointmentClick={() => handleAppointmentClick()}
      />

      {/* 場域卡片 */}
      <section className="py-16 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              專精各類型商用場域
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
              量身打造最合適的空間空氣規劃
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              不同商業空間對冷房速度、新鮮空氣換氣率與溫濕度控制有完全不同的指標要求。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fieldCards.map((field, i) => (
              <div
                key={i}
                className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all duration-300 shadow-md group"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 tracking-wide group-hover:text-sky-400 transition-colors">
                    {field.title}
                  </h3>
                  <div className="space-y-3 mb-6">
                    <div>
                      <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider block mb-1">常見痛點</span>
                      <p className="text-sm text-slate-400 leading-relaxed">{field.pain}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-855">
                      <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">焓耀可協助的方向</span>
                      <p className="text-sm text-slate-350 leading-relaxed">{field.solution}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  {/* Primary Button: Booking */}
                  <CTAButton
                    href="#contact-section"
                    onClick={() => handleAppointmentClick()}
                    className="w-full text-center py-2.5 bg-sky-505 hover:bg-sky-400 text-white font-semibold rounded-xl border border-sky-500 hover:border-sky-400 transition-colors text-sm block"
                  >
                    {field.cta}
                  </CTAButton>

                  {/* Secondary Link: LINE */}
                  <CTAButton
                    href={siteConfig.lineUrl}
                    external
                    trackEventName="line_click"
                    trackParams={{
                      service_type: "commercial_ac",
                      area: currentArea,
                      landing_page_type: "google_ads",
                      cta_position: `field_card_${field.title}_line`,
                      lead_method: "line",
                      keyword_intent: "commercial_ac"
                    }}
                    onClick={() => handleLineClick(`field_card_${field.title}_line`)}
                    className="w-full text-center py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-800 transition-colors text-sm block"
                  >
                    {field.ctaLine}
                  </CTAButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 系統卡片 */}
      <section className="py-16 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-sky-505 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              商用空調系統專長
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
              專精中央空調、冰水主機與 VRV 系統規劃維護
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              焓耀持照技師團隊具備大型主機檢修與配管實務，維護高效率能效運轉。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemCards.map((sys, i) => (
              <div
                key={i}
                className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-colors shadow-md"
              >
                <div>
                  <h3 className="text-base font-bold text-white border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-sky-400 rounded-full shrink-0"></span>
                    {sys.name}
                  </h3>
                  <div className="space-y-3 text-xs leading-relaxed mb-4">
                    <div>
                      <span className="text-slate-500 font-semibold block">適合場域：</span>
                      <span className="text-slate-300">{sys.fit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">評估重點：</span>
                      <p className="text-slate-400">{sys.check}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">維護重點：</span>
                      <p className="text-slate-400">{sys.maintain}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust credentials */}
      <TrustSection />

      {/* Price factors */}
      <PriceFactorsSection
        title="為什麼商用空調工程需要詳細的現場評估？"
        subtitle="商用大系統涉及複雜的管路、電力配線與建物荷載。我們堅持實地查勘，不建議以電話直接報死價。"
        factors={priceFactors}
      />

      {/* Process steps */}
      <ProcessSection />

      {/* FAQ Section */}
      <section className="py-16 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              商用空調工程常見問題解答
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              為您解答關於商用場勘流程、配合非營業時間施工以及維護合約等工程疑問。
            </p>
          </div>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* Booking Form */}
      <section id="contact-section" className="py-16 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              預約商用空調現場場勘評估
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              商用空調工程需先了解現場條件，不建議只用電話直接報價。您可以先 LINE 傳平面圖、現場照片與設備銘牌做初步判斷，必要時約定時間安排現場場勘後再提供建議。
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA
        serviceType="commercial_ac"
        phoneText="撥打商用工程諮詢"
        lineText="LINE 傳平面圖與照片"
        onPhoneClick={() => handlePhoneClick("final_cta_section")}
        onLineClick={() => handleLineClick("final_cta_section")}
      />
    </main>
  );
}
