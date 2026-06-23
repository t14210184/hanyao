import React from "react";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import CTAButton from "@/components/CTAButton";
import FAQAccordion from "@/components/FAQAccordion";
import { SubpageContent, subpagesData } from "./subpageData";

interface AcCleaningSubpageTemplateProps {
  data: SubpageContent;
}

export default function AcCleaningSubpageTemplate({ data }: AcCleaningSubpageTemplateProps) {
  const pageTitle = data.title;
  const pageDescription = data.description;
  const canonicalUrl = data.canonicalUrl;
  const h1Text = data.h1;

  // Breadcrumbs Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首頁",
        "item": `${siteConfig.domain}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "服務項目",
        "item": `${siteConfig.domain}/services/`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "冷氣清洗保養",
        "item": `${siteConfig.domain}/services/ac-cleaning/`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": data.issueName,
        "item": canonicalUrl
      }
    ]
  };

  // WebPage Schema
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": canonicalUrl
  };

  // Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": data.serviceType,
    "provider": {
      "@type": "HVACBusiness",
      "name": siteConfig.brandName,
      "url": siteConfig.domain,
      "telephone": `+886-${siteConfig.phone1.replace(/-/g, "")}`,
      "areaServed": [
        {
          "@type": "AdministrativeArea",
          "name": "高雄市"
        },
        {
          "@type": "AdministrativeArea",
          "name": "屏東縣"
        }
      ]
    },
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
    "description": data.schemaDescription
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // Get other subpages for recommendation (filter out current slug)
  const recommendations = Object.values(subpagesData).filter(
    (item) => item.slug !== data.slug
  );

  return (
    <>
      {/* Inject JSON-LD Schema on Server Side */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="flex-1 flex flex-col pt-16">
        {/* Breadcrumb Section */}
        <div className="bg-slate-950 py-3 border-b border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex text-xs text-slate-500 space-x-2">
              <Link href="/" className="hover:text-sky-400">首頁</Link>
              <span>/</span>
              <Link href="/services/" className="hover:text-sky-400">服務項目</Link>
              <span>/</span>
              <Link href="/services/ac-cleaning/" className="hover:text-sky-400">冷氣清洗保養</Link>
              <span>/</span>
              <span className="text-slate-400 truncate">{data.issueName}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-slate-900/15 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              高雄 • 屏東專業冷氣清洗與保養
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              {h1Text}
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              {data.introText}
            </p>

            {/* Hero CTA Side-by-Side */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "ac_cleaning", cta_position: `subpage_hero_line_${data.slug}` }}
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
                trackParams={{ service_type: "ac_cleaning", cta_position: `subpage_hero_phone_${data.slug}` }}
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

        {/* Content Section */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Symptoms */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                您是否有以下保養或清潔考量？
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.symptoms.map((symptom, idx) => (
                  <div key={idx} className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs shrink-0 font-bold">
                      ✓
                    </span>
                    <p className="text-xs sm:text-sm text-slate-350 leading-relaxed">{symptom}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Possible Causes */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                冷氣清洗保養重點細節說明
              </h2>
              <div className="space-y-4">
                {data.causes.map((cause, idx) => (
                  <div key={idx} className="bg-slate-900/20 border border-slate-850/60 p-5 rounded-2xl">
                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                      {cause.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-3">{cause.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Warning / Preventative Advice */}
            <div className="mb-12 bg-slate-900/30 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                專業冷氣技師的到府施作與維護提醒
              </h2>
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed">
                {data.preventativeAdvice}
              </p>
            </div>

            {/* Mid LINE CTA */}
            <div className="mb-12 text-center p-8 bg-sky-950/20 border border-sky-900/30 rounded-2xl">
              <p className="text-xs sm:text-sm text-sky-300 font-semibold mb-4">
                需要進一步確認機型與報價？加 LINE 傳送照片為您初步評估
              </p>
              <div className="max-w-xs mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ service_type: "ac_cleaning", cta_position: `subpage_mid_line_${data.slug}` }}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>LINE 傳照片諮詢</span>
                </CTAButton>
              </div>
            </div>

            {/* LINE Preparation */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                LINE 詢問前，建議先準備以下資料：
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.lineInquiryPrep.map((prep, idx) => (
                  <li key={idx} className="bg-slate-900/35 border border-slate-850/60 p-4 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-950 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-350 leading-relaxed">{prep}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ Accordion Section */}
            <div className="mb-12 pt-8 border-t border-slate-900">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                常見問題解答 FAQ
              </h2>
              <FAQAccordion items={data.faqs} />
            </div>

            {/* Back to main page link */}
            <div className="text-center mb-12">
              <Link 
                href="/services/ac-cleaning/" 
                className="text-xs sm:text-sm text-sky-400 hover:text-sky-350 font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                &larr; 回到冷氣清洗保養主頁
              </Link>
            </div>

            {/* Other subpage recommendations */}
            <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                其他清洗保養相關主題：
              </h3>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm">
                {recommendations.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/services/ac-cleaning/${item.slug}/`}
                    className="text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>{item.issueName} &rarr;</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Bottom Strong CTA */}
        <section className="py-16 relative overflow-hidden bg-slate-900/40 border-t border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              高雄屏東在地冷氣清洗工程
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-6 tracking-tight sm:text-3xl">
              想知道您家冷氣是否需要清洗？讓專業技師為您評估
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-xl mx-auto">
              收費合理，不強迫推銷。請先加 LINE 傳送現場室內機、台數或冷氣型號照片，技師依現場實際機況提供說明。
            </p>

            {/* Bottom Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: "ac_cleaning", cta_position: `subpage_bottom_line_${data.slug}` }}
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
                trackParams={{ service_type: "ac_cleaning", cta_position: `subpage_bottom_phone_${data.slug}` }}
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
      </div>
    </>
  );
}
