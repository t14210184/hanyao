import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/data/site";
import JsonLd from "@/components/JsonLd";
import CTAButton from "@/components/CTAButton";

export const metadata: Metadata = {
  title: "隱私權政策｜焓耀空調工程",
  description: "焓耀空調工程重視客戶個人資料與網站使用隱私。本頁說明本網站在 LINE 諮詢、電話聯繫、表單填寫、網站分析與廣告成效追蹤中，如何蒐集、處理與利用相關資料。",
  alternates: {
    canonical: "https://www.xusen.pro/privacy/",
  },
  openGraph: {
    title: "隱私權政策｜焓耀空調工程",
    description: "焓耀空調工程重視客戶個人資料與網站使用隱私。本頁說明本網站在 LINE 諮詢、電話聯繫、表單填寫、網站分析與廣告成效追蹤中，如何蒐集、處理與利用相關資料。",
    url: "https://www.xusen.pro/privacy/",
    type: "website",
    siteName: "焓耀空調工程",
    locale: "zh_TW",
  },
};

export default function PrivacyPolicyPage() {
  const hvacBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "name": "焓耀空調工程",
    "url": "https://www.xusen.pro",
    "telephone": `+886-${siteConfig.phone1.replace(/-/g, "")}`,
    "email": siteConfig.email,
    "priceRange": "$$",
    "description": "焓耀空調工程提供高雄與屏東地區冷氣空調安裝、維修、清洗保養與商用空調規劃等工程服務。",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "建南路106號",
      "addressLocality": "屏東市",
      "addressRegion": "屏東縣",
      "postalCode": "900",
      "addressCountry": "TW"
    }
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "隱私權政策",
    "description": "焓耀空調工程重視客戶個人資料與網站使用隱私。本頁說明本網站在 LINE 諮詢、電話聯繫、表單填寫、網站分析與廣告成效追蹤中，如何蒐集、處理與利用相關資料。",
    "url": "https://www.xusen.pro/privacy/",
    "publisher": {
      "@type": "Organization",
      "name": "焓耀空調工程"
    }
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
        "name": "隱私權政策",
        "item": "https://www.xusen.pro/privacy/"
      }
    ]
  };

  return (
    <>
      {/* Inject JSON-LD Schema on Server-side */}
      <JsonLd schema={hvacBusinessSchema} />
      <JsonLd schema={webPageSchema} />
      <JsonLd schema={breadcrumbListSchema} />

      <main className="flex-1 flex flex-col pt-16 sm:pt-20">
        {/* Header Hero */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-[-10%] w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              LEGAL • PRIVACY
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 tracking-tight">
              隱私權政策
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              焓耀空調工程重視您的個人資料與網站使用隱私。本政策說明您使用本網站、LINE 諮詢、電話聯絡或填寫表單時，相關資料可能如何被蒐集、處理與利用。
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-invert max-w-none text-slate-350 space-y-12">
              
              {/* Section 1 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  1. 適用範圍
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  本隱私權政策適用於焓耀空調工程官方網站 https://www.xusen.pro 以及透過本網站連結進行的 LINE 諮詢、電話聯絡與線上預約流程。若您透過第三方平台與我們互動，該第三方平台可能另有其隱私權政策與資料處理規則。
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  2. 我們可能蒐集的資料
                </h2>
                <p className="text-sm sm:text-base leading-relaxed mb-3">
                  為了提供空調相關工程規劃、諮詢與售後服務，本網站與我們可能在互動過程中蒐集以下類別之個人資料：
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                  <li>您主動提供的姓名、稱呼、電話、LINE 帳號、Email</li>
                  <li>服務地址或所在區域</li>
                  <li>冷氣機型、現場照片、故障狀況、裝潢圖面或服務需求描述</li>
                  <li>透過網站自動產生的技術資料，例如 IP 位址、瀏覽器類型、裝置資訊、瀏覽頁面、點擊事件、來源媒介與 Cookie 資訊</li>
                  <li>電話或 LINE 溝通過程中您主動提供之服務需求資料</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  3. 蒐集資料的目的
                </h2>
                <p className="text-sm sm:text-base leading-relaxed mb-3">
                  我們蒐集資料主要用於提供空調技術性諮詢與工程實務，其目的如下：
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                  <li>回覆諮詢與預約聯繫</li>
                  <li>判斷冷氣安裝、維修、清洗保養、商用空調等服務需求</li>
                  <li>安排現場確認或後續服務</li>
                  <li>提供報價、施工前溝通、售後聯繫</li>
                  <li>改善網站內容、使用者體驗與廣告投放成效</li>
                  <li>防止濫用、詐騙、惡意行為或安全事件</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  4. 個人資料利用期間、地區、對象與方式
                </h2>
                <ul className="space-y-3 text-sm sm:text-base">
                  <li>
                    <strong className="text-slate-200">利用期間：</strong>
                    依蒐集目的所需期間、服務往來期間、法令或會計保存需求所需期間。
                  </li>
                  <li>
                    <strong className="text-slate-200">利用地區：</strong>
                    主要為台灣地區；若使用 Google、LINE、Cloudflare 等第三方服務，資料可能依其服務架構進行跨境處理。
                  </li>
                  <li>
                    <strong className="text-slate-200">利用對象：</strong>
                    焓耀空調工程、協助網站維運/分析/廣告/通訊服務之第三方服務提供者。
                  </li>
                  <li>
                    <strong className="text-slate-200">利用方式：</strong>
                    電話、LINE、Email、網站分析、廣告成效統計、客服聯繫與內部服務紀錄。
                  </li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  5. Cookie、網站分析與廣告追蹤
                </h2>
                <p className="text-sm sm:text-base leading-relaxed mb-4">
                  本網站可能使用 Cookie、Google Tag Manager、Google Analytics 4、Google Ads 轉換追蹤或類似技術，以了解網站流量、頁面互動、廣告成效與使用者體驗。這些工具可能會蒐集裝置資訊、瀏覽行為、點擊事件、來源媒介與粗略地理資訊等資料。
                </p>
                <p className="text-sm sm:text-base leading-relaxed mb-4">
                  您可以透過瀏覽器設定阻擋或刪除 Cookie；但部分網站功能或追蹤成效可能因此受到影響。
                </p>
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-col gap-2 text-xs sm:text-sm">
                  <p className="text-slate-350">
                    <strong className="text-slate-200">外部參考連結：</strong>
                  </p>
                  <a 
                    href="https://policies.google.com/privacy?hl=zh-TW" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sky-400 hover:underline inline-block break-all"
                  >
                    Google 隱私權政策：https://policies.google.com/privacy?hl=zh-TW
                  </a>
                  <a 
                    href="https://support.google.com/analytics/answer/7318509" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sky-400 hover:underline inline-block break-all"
                  >
                    Google Analytics 資料處理說明：https://support.google.com/analytics/answer/7318509
                  </a>
                </div>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  6. 第三方服務
                </h2>
                <p className="text-sm sm:text-base leading-relaxed mb-3">
                  為了提供完整的諮詢、部署與優化，我們使用以下第三方服務進行網站或業務輔助：
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                  <li>LINE：用於線上諮詢與傳送現場照片。</li>
                  <li>Google Analytics / Google Tag Manager：用於網站統計分析與使用者事件追蹤。</li>
                  <li>Google Ads：用於廣告成效與轉換事件追蹤。</li>
                  <li>Cloudflare / GitHub / 網站代管服務：用於網站部署、CDN 加速與安全維護。</li>
                </ul>
                <p className="text-xs sm:text-sm text-slate-450 mt-3 italic">
                  上述第三方服務可能依其隱私權政策處理資料。建議使用者可主動參考各服務平台之政策說明。
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  7. 個人資料安全
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  焓耀空調工程會採取合理的資料保護措施，避免個人資料遭未授權存取、洩漏、竄改或毀損。但網際網路傳輸無法保證百分之百安全，使用者仍應避免透過公開留言或不安全管道傳送高度敏感個人資料。
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  8. 當事人權利
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  依個人資料保護法，您可就您的個人資料向我們請求查詢、閱覽、製給複製本、補充、更正、停止蒐集/處理/利用或刪除。若您希望行使上述權利，可透過本頁所列聯絡方式與我們聯繫。
                </p>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  9. 不提供資料的影響
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  若您不提供必要聯絡資訊、服務地點或冷氣狀況描述，我們可能無法回覆您的問題、判斷服務需求、安排後續聯繫或提供較精準的初步建議。
                </p>
              </div>

              {/* Section 10 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  10. 未成年人資料
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  本網站服務主要提供一般住家、店面、辦公室與商用空調需求。若未成年人使用本網站並提供個人資料，建議由法定代理人陪同或同意。
                </p>
              </div>

              {/* Section 11 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  11. 政策更新
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  本政策可能因法令、服務內容、網站功能或第三方工具調整而更新。更新後將公布於本頁面，建議您定期查閱。
                </p>
                <p className="text-xs text-slate-500 mt-2 font-semibold">
                  上次更新日期：2026 年 6 月 23 日
                </p>
              </div>

              {/* Section 12 */}
              <div className="bg-slate-900/30 border border-slate-850 p-6 sm:p-8 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
                  <span className="w-1 h-5 bg-sky-500 rounded"></span>
                  12. 聯絡資訊
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="space-y-2">
                    <p><strong className="text-slate-200">公司名稱：</strong>焓耀空調工程有限公司</p>
                    <p><strong className="text-slate-200">聯絡電話：</strong>{siteConfig.phone1}</p>
                    <p><strong className="text-slate-200">電子信箱：</strong>{siteConfig.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong className="text-slate-200">官方 LINE：</strong>@451vpomq</p>
                    <p><strong className="text-slate-200">公司地址：</strong>{siteConfig.companyAddress}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* CTA Actions */}
            <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-lg mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "privacy_general", cta_position: "privacy_page_cta" }}
                className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>LINE 聯絡我們</span>
              </CTAButton>

              <CTAButton
                href="/services/"
                className="w-full sm:flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>查看服務項目</span>
              </CTAButton>

              <CTAButton
                href="/"
                className="w-full sm:flex-1 py-3.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-850 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <span>返回首頁 &rarr;</span>
              </CTAButton>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
