import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";
import FAQAccordion from "@/components/FAQAccordion";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "服務項目｜高雄屏東冷氣安裝、維修、清洗保養與商用空調工程｜焓耀空調工程",
  description: "焓耀空調工程提供高雄、屏東冷氣安裝、冷氣維修、冷氣清洗保養、商用空調工程、冰水主機與全熱交換器規劃服務。可透過 LINE 傳照片或需求，先確認適合的服務方向。",
  alternates: {
    canonical: "https://www.xusen.pro/services/",
  },
  openGraph: {
    title: "服務項目｜高雄屏東冷氣安裝、維修、清洗保養與商用空調工程｜焓耀空調工程",
    description: "焓耀空調工程提供高雄、屏東冷氣安裝、冷氣維修、冷氣清洗保養、商用空調工程、冰水主機與全熱交換器規劃服務。可透過 LINE 傳照片或需求，先確認適合的服務方向。",
    url: "https://www.xusen.pro/services/",
    type: "website",
    siteName: "焓耀空調工程",
    locale: "zh_TW",
  }
};

export default function ServicesOverviewPage() {
  const faqItems = [
    {
      id: "services-faq-1",
      question: "不知道冷氣問題要選哪個服務怎麼辦？",
      answer: "可以先參考頁面上的「如果不知道該選哪項服務，先看這裡」需求分流指引。若仍不確定，建議直接透過官方 LINE 傳送冷氣機型、現場照片或異常症狀（如故障代碼、滴水位置等），由技師為您初步評估與分析。"
    },
    {
      id: "services-faq-2",
      question: "冷氣不冷一定是缺冷媒嗎？",
      answer: "不一定。冷氣不冷的常見原因包括過濾網與熱交換鰭片積塵嚴重導致風量受阻、排水管堵塞引起自我防護跳機、壓縮機啟動電容故障、或是控制基板異常等。冷媒外漏只是其中一種可能，必須經過技師以儀器檢測壓力才能確定，不建議在未查明漏點前直接盲目補充冷媒。"
    },
    {
      id: "services-faq-3",
      question: "冷氣安裝前需要準備什麼資料？",
      answer: "為協助我們更精準規劃，建議您可以先提供：安裝空間的坪數與用途（如西曬、挑高、頂樓等熱源特徵）、希望安裝的冷氣類型（分離式、吊隱式或窗型）、室內機與室外機預定安裝位置的照片，若有裝潢平面圖也歡迎提供，以便我們進行精確噸數與管線路徑的規劃。"
    },
    {
      id: "services-faq-4",
      question: "冷氣清洗與冷氣維修有什麼不同？",
      answer: "冷氣清洗保養主要針對運轉正常但有異味、積塵、風量變小或因髒污阻塞引起輕微滴水之冷氣，進行深層高壓水槍藥劑清潔與消毒；冷氣維修則是針對冷氣完全無法運轉、控制系統故障、壓縮機不啟動、或是管路漏冷媒等機械或電路異常進行故障排除與零件更換。"
    },
    {
      id: "services-faq-5",
      question: "商用空調和家用冷氣規劃差在哪？",
      answer: "家用空調主要考量單一房間的靜音與溫控舒適度；商用空調（如店面、辦公室、廠房）則需評估空間高度、營業發熱源、高人流量、換氣（新風）需求、管線動線長度、長期運轉的省電效能（如 VRV 多聯變頻系統）以及日後維修保養的動線便利性。"
    },
    {
      id: "services-faq-6",
      question: "冰水主機或中央空調可以先諮詢嗎？",
      answer: "可以。不論是商辦大樓、廠房或是大型公共空間，我們的技術團隊皆可針對冰水主機系統（水冷式、氣冷式）提供初步線上諮詢。您可先提供機型照片、現場狀況與異常描述，由焓耀空調工程協助初步判斷後續處理方向。"
    },
    {
      id: "services-faq-7",
      question: "高雄屏東哪些區域可以服務？",
      answer: "我們主要服務高雄市（如三民、左營、鼓山、苓雅、前鎮、鳳山、仁武、楠梓、鳥松、大寮、岡山等區）與屏東縣（如屏東市、萬丹、長治、九如、內埔、潮州、東港等鄉鎮）。部分區域需依實際距離、施工條件與排程確認。"
    },
    {
      id: "services-faq-8",
      question: "可以先透過 LINE 傳照片詢問嗎？",
      answer: "非常歡迎。我們強烈建議客戶在預約前，先透過 LINE 傳送故障代碼畫面、漏水位置照片、欲安裝現場的照片或平面圖。這能讓技師在線上做第一步的專業篩選與分析，避免盲目到府產生的時間浪費，也能給您更具參考價值的初步建議。"
    },
    {
      id: "services-faq-9",
      question: "報價會依哪些條件不同？",
      answer: "空調工程的報價會依據施工難易度（如挑高、危險高空施工）、冷媒銅管長度、排水管配置方式、電源線路修改、洗孔數量、以及是否需要懸掛架等配件而有所不同。我們堅持現場評估、透明報價，取得客戶同意後才進行施作。"
    },
    {
      id: "services-faq-10",
      question: "如果正在裝潢，什麼時候找空調工程比較適合？",
      answer: "建議在裝潢的「設計階段」或「木工/水電進場前」就讓空調技師參與討論。因為不論是分離式冷氣的冷媒管路預埋、吊隱式冷氣的機體吊裝與風口位置規劃，還是全熱交換器的風管動線配置，都需要在木工封天花板前完成定位與配管，提早規劃能避免後續修改裝潢的昂貴成本。"
    }
  ];

  const hvacBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "name": "焓耀空調工程",
    "url": "https://www.xusen.pro",
    "telephone": `+886-${siteConfig.phone1.replace(/-/g, "")}`,
    "email": siteConfig.email,
    "priceRange": "$$",
    "description": "焓耀空調工程提供高雄與屏東地區變頻冷氣安裝、冷氣維修檢修、冷氣清洗保養、商用多聯變頻空調、冰水主機與中央空調系統及全熱交換器通風工程規劃服務。",
    "knowsAbout": [
      "冷氣安裝",
      "冷氣維修",
      "冷氣清洗保養",
      "商用空調工程",
      "冷凍空調工程"
    ],
    "areaServed": [
      {
        "@type": "AdministrativeArea",
        "name": "高雄市"
      },
      {
        "@type": "AdministrativeArea",
        "name": "屏東縣"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "高雄市與屏東縣",
      "addressCountry": "TW"
    }
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "服務項目",
    "description": "焓耀空調工程提供高雄、屏東冷氣安裝、冷氣維修、冷氣清洗保養、商用空調工程、冰水主機與全熱交換器規劃服務。可透過 LINE 傳照片或需求，先確認適合的服務方向。",
    "url": "https://www.xusen.pro/services/",
    "about": {
      "@type": "Thing",
      "name": "空調與冷氣工程服務"
    },
    "image": [
      "https://www.xusen.pro/images/credentials/company-registration-redacted.webp",
      "https://www.xusen.pro/images/credentials/technician-certificate-redacted.webp",
      "https://www.xusen.pro/images/credentials/association-membership-redacted.webp"
    ],
    "associatedMedia": [
      {
        "@type": "ImageObject",
        "contentUrl": "https://www.xusen.pro/images/credentials/company-registration-redacted.webp",
        "name": "冷凍空調業登記資料公開版",
        "description": "焓耀空調工程冷凍空調業登記資料公開版，提供冷凍空調工程業務登記參考項目。",
        "caption": "冷凍空調業登記資料"
      },
      {
        "@type": "ImageObject",
        "contentUrl": "https://www.xusen.pro/images/credentials/technician-certificate-redacted.webp",
        "name": "冷凍空調技術能力佐證文件公開版",
        "description": "冷凍空調技術能力佐證文件公開版，作為冷凍空調裝修技術能力背景參考。",
        "caption": "冷凍空調技術能力佐證"
      },
      {
        "@type": "ImageObject",
        "contentUrl": "https://www.xusen.pro/images/credentials/association-membership-redacted.webp",
        "name": "焓耀空調工程冷凍空調產業公會會員資料公開版",
        "description": "焓耀空調工程冷凍空調產業公會會員資料公開版，提供冷凍空調公會會員背景參考。",
        "caption": "產業公會會員資料"
      }
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "焓耀空調工程主要服務項目",
    "numberOfItems": 8,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "冷氣安裝",
        "url": "https://www.xusen.pro/services/ac-installation/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "冷氣維修",
        "url": "https://www.xusen.pro/services/ac-repair/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "冷氣清洗保養",
        "url": "https://www.xusen.pro/services/ac-cleaning/"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "商用空調工程",
        "url": "https://www.xusen.pro/services/commercial-ac/"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "冰水主機與中央空調",
        "url": "https://www.xusen.pro/services/chiller-maintenance/"
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "冷氣移機",
        "url": "https://www.xusen.pro/services/ac-relocation/"
      },
      {
        "@type": "ListItem",
        "position": 7,
        "name": "全熱交換器與通風規劃",
        "url": "https://www.xusen.pro/services/erv/"
      },
      {
        "@type": "ListItem",
        "position": 8,
        "name": "空調規劃諮詢",
        "url": "https://www.xusen.pro/contact/"
      }
    ]
  };

  const breadcrumbListSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首頁",
        "item": "https://www.xusen.pro"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "服務項目",
        "item": "https://www.xusen.pro/services/"
      }
    ]
  };

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  const services = [
    {
      title: "冷氣安裝",
      tag: "新裝配管",
      target: "新成屋、裝潢配管、套房、住家、店面與辦公室",
      demands: "分離式冷氣安裝、吊隱式冷氣、窗型冷氣、管線配置、排水規劃",
      howWeHelp: "依空間坪數、室外機位置、配管動線、排水條件與電源配置，協助評估合適的安裝方式與施工細節。",
      link: "/services/ac-installation/",
      ctaText: "查看安裝服務",
      isLineCta: false
    },
    {
      title: "冷氣維修",
      tag: "故障排除",
      target: "冷氣不冷、滴水、異音、跳電、故障燈號或運轉異常",
      demands: "不冷檢查、漏水處理、排水異常、冷媒系統檢查、零件故障判斷",
      howWeHelp: "先了解症狀與機型，再依現場狀況檢查原因，避免未判斷就直接更換零件或補冷媒。",
      link: "/services/ac-repair/",
      ctaText: "查看維修服務",
      isLineCta: false
    },
    {
      title: "冷氣清洗保養",
      tag: "深層清潔",
      target: "冷氣有霉味、風量變小、滴水、長時間使用或店面定期保養",
      demands: "分離式清洗、窗型清洗、吊隱式清洗、風鼓清潔、冷排與排水盤保養",
      howWeHelp: "依機型與髒污程度評估清洗方式，協助改善異味、排水、風量與室內空氣品質。",
      link: "/services/ac-cleaning/",
      ctaText: "查看清洗保養",
      isLineCta: false
    },
    {
      title: "商用空調工程",
      tag: "空間規劃",
      target: "辦公室、店面、餐飲空間、工廠、廠辦與商業場所",
      demands: "商用空調規劃、VRF/VRV、多聯式系統、箱型冷氣、空調管線與風量配置",
      howWeHelp: "依營業型態、空間熱源、人流與設備配置，協助規劃穩定且方便維護的空調方案。",
      link: "/services/commercial-ac/",
      ctaText: "查看商用空調",
      isLineCta: false
    },
    {
      title: "冰水主機與中央空調",
      tag: "大型系統",
      target: "大型商辦、廠房、醫療空間、公共空間與長時間運轉場所",
      demands: "冰水主機檢查、中央空調保養、泵浦與管路檢查、系統運轉異常判斷",
      howWeHelp: "依系統型式與現場設備條件，協助檢查主機、管路、泵浦與末端設備狀況。",
      link: "/services/chiller-maintenance/",
      ctaText: "了解中央空調",
      isLineCta: false
    },
    {
      title: "冷氣移機",
      tag: "拆裝調整",
      target: "搬家、裝修、店面調整、舊機移位或空間重新配置",
      demands: "拆機、移機、重新安裝、銅管與排水重配、室外機位置調整",
      howWeHelp: "先評估舊機狀況、銅管距離、安裝位置與排水條件，再判斷是否適合移機。",
      link: "/services/ac-relocation/",
      ctaText: "詢問移機評估",
      isLineCta: false
    },
    {
      title: "全熱交換器與通風規劃",
      tag: "新風換氣",
      target: "新成屋、裝潢住宅、辦公室、密閉空間與需要改善換氣的場所",
      demands: "全熱交換器規劃、新風系統、室內換氣、裝潢前管線配置",
      howWeHelp: "依空間配置、天花板高度、換氣需求與管線路徑，協助評估通風與空調整合方式。",
      link: "/services/erv/",
      ctaText: "了解通風規劃",
      isLineCta: false
    },
    {
      title: "空調規劃諮詢",
      tag: "全方諮詢",
      target: "不知道該裝哪種冷氣、正在裝潢、商用空間需要整體規劃的客戶",
      demands: "坪數估算、機型配置、室內外機位置、管線動線、預算與施工順序討論",
      howWeHelp: "可先透過 LINE 提供平面圖、現場照片與需求，初步判斷適合的服務方向。",
      link: "/contact/",
      ctaText: "LINE 詢問規劃",
      isLineCta: true
    }
  ];

  return (
    <>
      {/* Inject JSON-LD Schema on Server-side */}
      <JsonLd schema={hvacBusinessSchema} />
      <JsonLd schema={collectionPageSchema} />
      <JsonLd schema={itemListSchema} />
      <JsonLd schema={breadcrumbListSchema} />
      <JsonLd schema={faqPageSchema} />

      <main className="flex-1 flex flex-col pt-16 sm:pt-20">
        {/* Services Hero */}
        <section className="relative py-16 sm:py-20 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-sky-950/15 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              服務項目總覽
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              高雄屏東空調工程服務<br/>
              <span className="text-sky-400 text-lg sm:text-2xl font-bold mt-2 block">冷氣安裝、維修、清洗保養與商用空調規劃</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              焓耀空調工程提供高雄、屏東冷氣與空調工程服務，依現場空間、機型、使用需求與施工條件，協助規劃冷氣安裝、維修檢查、清洗保養、商用空調、冰水主機與全熱交換器等服務項目。
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto mt-8 relative z-20">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "general", cta_position: "services_hero" }}
                className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>LINE 快速諮詢</span>
              </CTAButton>
              <CTAButton
                href={siteConfig.phone1Link}
                trackEventName="phone_click"
                trackParams={{ service_type: "general", cta_position: "services_hero" }}
                className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
              >
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>電話詢問服務</span>
              </CTAButton>
            </div>
            
            {/* 4 Trust Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 pt-8 border-t border-slate-800/60">
              <div className="flex flex-col items-center justify-center p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                <span className="text-sky-400 font-bold text-xs sm:text-sm">高雄屏東在地服務</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                <span className="text-sky-400 font-bold text-xs sm:text-sm">依現場條件評估</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                <span className="text-sky-400 font-bold text-xs sm:text-sm">住家與商用皆可諮詢</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                <span className="text-sky-400 font-bold text-xs sm:text-sm">工程項目整合規劃</span>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((item, index) => (
                <div 
                  key={index}
                  className="bg-slate-900/35 border border-slate-850 p-6 sm:p-8 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-all duration-300 shadow-md group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                        {item.title}
                      </h2>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-850 shrink-0">
                        {item.tag}
                      </span>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-slate-400 leading-relaxed mb-8">
                      <div>
                        <strong className="text-slate-300 block mb-1">適合對象：</strong>
                        <span>{item.target}</span>
                      </div>
                      <div>
                        <strong className="text-slate-300 block mb-1">常見需求：</strong>
                        <span>{item.demands}</span>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                        <strong className="text-sky-400 block mb-1">焓耀如何協助：</strong>
                        <span className="text-slate-300">{item.howWeHelp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row gap-3 items-center">
                    <CTAButton
                      href={item.isLineCta ? siteConfig.lineUrl : item.link}
                      external={item.isLineCta}
                      className={`w-full sm:w-auto text-center py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                        item.isLineCta 
                          ? "bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-1.5" 
                          : "bg-slate-950 border border-slate-800 hover:border-slate-700 text-sky-400 hover:text-sky-350"
                      }`}
                    >
                      {item.isLineCta && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                      <span>{item.ctaText}</span>
                    </CTAButton>
                    
                    <CTAButton
                      href="/contact/"
                      className="w-full sm:w-auto text-center py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all"
                    >
                      線上預約
                    </CTAButton>
                  </div>
                </div>
              ))}
            </div>

            {/* Inquiry Advice bar */}
            <div className="mt-16 bg-slate-900/20 border border-slate-850 p-6 sm:p-8 rounded-3xl text-center max-w-3xl mx-auto space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">不確定該選哪項？傳現場照片或需求給焓耀空調工程協助判斷</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
                冷氣故障、不冷或漏水？歡迎點選下方按鈕，加我們的官方 LINE 傳送現場狀況照片、冷氣機型貼紙照片，或是直接撥打電話討論。我們的技師會在線上為您進行初步分析與排期建議。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-2">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "general", cta_position: "services_overview_inquiry" }}
                  className="w-full sm:flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>LINE 快速諮詢</span>
                </CTAButton>

                <CTAButton
                  href={siteConfig.phone1Link}
                  trackEventName="phone_click"
                  trackParams={{ service_type: "general", cta_position: "services_overview_inquiry" }}
                  className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>電話詢問服務</span>
                </CTAButton>
              </div>
            </div>
          </div>
        </section>

        {/* Demand Routing Section */}
        <section className="py-16 bg-slate-950 border-t border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
                需求導航
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
                如果不知道該選哪項服務，先看這裡
              </h2>
            </div>
            
            <div className="bg-slate-900/25 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-4">
              <ul className="space-y-4 text-sm sm:text-base text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                  <div>
                    <span className="text-white font-bold">新房、裝潢、換新機：</span>
                    建議從 <Link href="/services/ac-installation/" className="text-sky-400 hover:underline">冷氣安裝</Link> 或 <Link href="/services/commercial-ac/" className="text-sky-400 hover:underline">商用空調工程</Link> 開始。
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                  <div>
                    <span className="text-white font-bold">冷氣不冷、滴水、異音、跳電：</span>
                    建議先安排 <Link href="/services/ac-repair/" className="text-sky-400 hover:underline">冷氣維修</Link> 檢查。
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                  <div>
                    <span className="text-white font-bold">有霉味、風量變小、出風口黑點：</span>
                    多數情況可先從 <Link href="/services/ac-cleaning/" className="text-sky-400 hover:underline">冷氣清洗保養</Link> 評估。
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                  <div>
                    <span className="text-white font-bold">店面、辦公室、餐飲空間、廠房：</span>
                    建議以 <Link href="/services/commercial-ac/" className="text-sky-400 hover:underline">商用空調工程</Link> 方式整體規劃。
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs font-bold mt-0.5">5</span>
                  <div>
                    <span className="text-white font-bold">大型空調、冰水主機、中央系統：</span>
                    需依系統型式與設備現況判斷，建議至 <Link href="/services/chiller-maintenance/" className="text-sky-400 hover:underline">冰水主機與中央空調</Link>。
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs font-bold mt-0.5">6</span>
                  <div>
                    <span className="text-white font-bold">室內悶、空氣不流通：</span>
                    可評估 <Link href="/services/erv/" className="text-sky-400 hover:underline">全熱交換器與通風規劃</Link>。
                  </div>
                </li>
                <li className="flex items-start gap-3 border-t border-slate-800/80 pt-4 mt-2">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-green-950 text-green-400 flex items-center justify-center text-xs font-bold mt-0.5">!</span>
                  <div>
                    <span className="text-white font-bold">不確定問題類型：</span>
                    可透過官方{" "}
                    <CTAButton
                      href={siteConfig.lineUrl}
                      external
                      trackEventName="line_click"
                      trackParams={{ service_type: "services_index", cta_position: "services_inline_guidance" }}
                      className="text-green-400 hover:underline font-semibold"
                    >
                      LINE 傳照片、影片、故障燈號或平面圖
                    </CTAButton>{" "}
                    先行詢問。
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SEO Reinforced Section */}
        <section className="py-16 bg-slate-900/10 border-t border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
                服務理念
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
                高雄屏東空調服務，先判斷需求再規劃施工
              </h2>
            </div>
            
            <div className="text-slate-400 text-sm sm:text-base leading-relaxed space-y-6">
              <p>
                在台灣南部炎熱的氣候下，空調系統是維持生活與工作品質的關鍵設備。然而，不同的冷氣與空調問題不應以單一粗率的方式處理。焓耀空調工程堅持在施作前，與客戶溝通並判斷實際現況：
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-sky-400 rounded"></span>
                    冷氣安裝
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    評估坪數、噸數、配管、排水、室外機散熱、電源條件。
                  </p>
                </div>
                
                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-sky-400 rounded"></span>
                    冷氣維修
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    先確認症狀，不冷不一定是缺冷媒，滴水也可能與排水、髒污或安裝條件有關。
                  </p>
                </div>
                
                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-sky-400 rounded"></span>
                    冷氣清洗保養
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    重點包含濾網、冷排、風鼓、排水盤、排水管與室外機散熱。
                  </p>
                </div>
                
                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-sky-400 rounded"></span>
                    商用空調
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    重點包含使用時間、人流、設備熱源、維修動線與長期穩定性。
                  </p>
                </div>

                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl md:col-span-2">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-sky-400 rounded"></span>
                    通風與舒適度
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    若空間長時間密閉，除了冷氣噸數，也要評估換氣與空氣循環。
                  </p>
                </div>
              </div>
              
              <div className="bg-sky-950/20 border border-sky-900/30 p-5 rounded-2xl text-xs sm:text-sm text-slate-300 mt-6 text-left">
                <p className="font-bold text-sky-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  詢問資料
                </p>
                <p>
                  建議使用者提供現場照片、室內外機位置、機型、坪數、症狀與所在區域，以利初步分析。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Credentials and Trust Section */}
        <section className="py-16 bg-slate-950 border-t border-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
                服務資格參考
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
                資格文件與服務信任基礎
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
                焓耀空調工程重視空調工程的合規登記、技術能力與施工前評估。以下文件作為服務資格與專業背景參考，實際服務內容仍會依現場條件、機型與施工需求進行確認。
              </p>
            </div>

            {/* Credentials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-slate-900/35 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-all duration-300 shadow-md">
                <div>
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 mb-4 flex items-center justify-center">
                    <img 
                      src="/images/credentials/company-registration-redacted.webp"
                      alt="焓耀空調工程冷凍空調業登記資料公開版"
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">公司冷凍空調業登記資料</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                    焓耀空調工程具備冷凍空調相關業務登記資料，服務項目涵蓋冷氣安裝、維修、清洗保養與商用空調工程等需求。
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900/35 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-all duration-300 shadow-md">
                <div>
                  <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 mb-4 flex items-center justify-center">
                    <img 
                      src="/images/credentials/technician-certificate-redacted.webp"
                      alt="冷凍空調技術能力佐證文件公開版"
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">冷凍空調技術能力佐證</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                    空調工程涉及機型判斷、施工條件、安裝安全與維修檢查，焓耀空調工程以現場條件與客戶需求為基礎進行評估。
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900/35 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-all duration-300 shadow-md">
                <div>
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 mb-4 flex items-center justify-center">
                    <img 
                      src="/images/credentials/association-membership-redacted.webp"
                      alt="焓耀空調工程冷凍空調產業公會會員資料公開版"
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">產業公會會員資料</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                    焓耀空調工程保留冷凍空調相關產業會員資料，作為服務背景與產業參與的參考。
                  </p>
                </div>
              </div>
            </div>

            {/* AI GEO Summary Block */}
            <div className="mt-12 bg-slate-900/20 border border-slate-850 p-6 sm:p-8 rounded-3xl text-left max-w-4xl mx-auto space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-5 bg-sky-400 rounded"></span>
                為什麼服務資格文件重要？
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                冷氣與空調工程不只看價格，也需要確認施工者是否理解機型、管線、排水、電源、室外機散熱與後續維護條件。焓耀空調工程透過冷凍空調相關登記資料、技術能力佐證與現場評估流程，協助高雄、屏東客戶更清楚判斷適合的冷氣安裝、維修、清洗保養或商用空調服務。
              </p>
            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        <section className="py-16 bg-slate-950 border-t border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              服務地區
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
              高雄、屏東主要服務區域
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              焓耀空調工程以高雄市與屏東縣地區為主要服務範疇，提供家用與商用冷氣空調工程之規劃施工。
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-left">
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  高雄
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  三民、左營、鼓山、苓雅、前鎮、小港、鳳山、仁武、楠梓、鳥松、大寮、岡山、橋頭、路竹等。
                </p>
              </div>
              
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  屏東
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  屏東市、萬丹、長治、九如、麟洛、內埔、竹田、潮州、東港等。
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-6 leading-relaxed italic">
              註記：實際可服務時段與施工條件，請以 LINE 或電話確認。
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-slate-900/10 border-t border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
                常見問題
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
                空調冷氣常見問答 FAQ
              </h2>
            </div>
            
            <FAQAccordion items={faqItems} />
          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA 
          serviceType="general"
          phoneText="撥打專線諮詢"
          lineText="加 LINE 傳照評估"
        />
      </main>
    </>
  );
}
