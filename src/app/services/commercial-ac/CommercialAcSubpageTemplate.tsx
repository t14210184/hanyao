"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import CTAButton from "@/components/CTAButton";
import JsonLd from "@/components/JsonLd";
import { CommercialSubpageContent } from "./subpageData";

interface CommercialAcSubpageTemplateProps {
  data: CommercialSubpageContent;
}

export default function CommercialAcSubpageTemplate({ data }: CommercialAcSubpageTemplateProps) {
  // FAQ 展開狀態
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // 1. Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: `${siteConfig.domain}/` },
      { "@type": "ListItem", position: 2, name: "服務項目", item: `${siteConfig.domain}/services/` },
      { "@type": "ListItem", position: 3, name: "商用空調工程", item: `${siteConfig.domain}/services/commercial-ac/` },
      { "@type": "ListItem", position: 4, name: data.subjectName, item: data.canonical },
    ],
  };

  // 2. WebPage Schema
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.title,
    description: data.description,
    url: data.canonical,
    breadcrumb: { "@id": `${data.canonical}#breadcrumb` },
  };

  // 3. Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: data.serviceType,
    name: data.title,
    description: data.description,
    url: data.canonical,
    provider: {
      "@type": "HVACBusiness",
      name: siteConfig.brandName,
      url: siteConfig.domain,
      telephone: siteConfig.phone1,
      address: {
        "@type": "PostalAddress",
        addressLocality: "屏東市",
        addressRegion: "屏東縣",
        addressCountry: "TW",
        streetAddress: siteConfig.companyAddress,
      },
      areaServed: [
        { "@type": "City", name: "高雄市" },
        { "@type": "AdministrativeArea", name: "屏東縣" },
      ],
    },
    areaServed: [
      { "@type": "City", name: "高雄市" },
      { "@type": "AdministrativeArea", name: "屏東縣" },
    ],
  };

  // 4. FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Schemas — metadata by page.tsx export const metadata */}
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={pageSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      <main className="flex-1 flex flex-col pt-16 bg-slate-950 text-slate-100">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-blue-950/15 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[40%] h-[80%] rounded-full bg-sky-950/10 blur-[100px] pointer-events-none"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Breadcrumb Nav */}
            <nav className="text-xs text-slate-500 mb-6 flex flex-wrap justify-center items-center gap-2">
              <Link href="/" className="hover:text-sky-400 transition-colors">
                首頁
              </Link>
              <span>/</span>
              <Link href="/services/" className="hover:text-sky-400 transition-colors">
                服務項目
              </Link>
              <span>/</span>
              <Link href="/services/commercial-ac/" className="hover:text-sky-400 transition-colors">
                商用空調工程
              </Link>
              <span>/</span>
              <span className="text-slate-300 font-medium">{data.subjectName}</span>
            </nav>

            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              {data.serviceType}
            </span>

            {/* Single H1 */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              {data.h1}
            </h1>

            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              {data.intro}
            </p>

            {/* Hero CTA (首屏 LINE + 電話 CTA) */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3 max-w-sm mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: data.slug, cta_position: "hero_line" }}
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
                trackParams={{ service_type: data.slug, cta_position: "hero_phone" }}
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

        {/* Scope Info & Pain Points */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              常見規劃痛點與改善方向
            </h2>
            <div className="space-y-4">
              {data.painPoints.map((point, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    !
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planning Items */}
        <section className="py-16 bg-slate-900/20 border-t border-b border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              空調規劃重點
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.planningItems.map((item, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mid-page LINE CTA (中段 LINE CTA) */}
        <section className="py-12 bg-slate-950 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              可先 LINE 描述需求、提供平面圖或現場照片，技師將依現場條件評估說明。
            </p>
            <div className="max-w-xs mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: data.slug, cta_position: "mid_line" }}
                className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>LINE 諮詢空調規劃</span>
              </CTAButton>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-16 bg-slate-900/20 border-t border-b border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              服務評估與施工作業流程
            </h2>
            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
              {data.processSteps.map((step, idx) => (
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

        {/* FAQ Block */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              常見問題 FAQ
            </h2>
            <div className="space-y-4">
              {data.faq.map((item) => (
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

        {/* Related Pages Recommendation (其他相關子頁推薦) */}
        <section className="py-12 bg-slate-900/10 border-t border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs text-slate-500 block mb-4">其他相關空調規劃主題：</span>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm">
              {data.relatedPages.map((page, idx) => (
                <Link key={idx} href={page.href} className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1">
                  {page.label} &rarr;
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Block (底部 LINE + 電話 CTA) */}
        <section className="py-16 bg-slate-950 border-t border-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-[20%] w-[60%] h-[100%] rounded-full bg-blue-950/10 blur-[100px] pointer-events-none"></div>
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              {data.ctaTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto mb-8">
              {data.ctaDescription}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3 max-w-sm mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ service_type: data.slug, cta_position: "bottom_line" }}
                className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>加 LINE 傳照評估</span>
              </CTAButton>

              <CTAButton
                href={siteConfig.phone1Link}
                trackEventName="phone_click"
                trackParams={{ service_type: data.slug, cta_position: "bottom_phone" }}
                className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>撥打商用工程諮詢</span>
              </CTAButton>
            </div>
          </div>
        </section>

        {/* Back Link to Parent Category (回到 /services/commercial-ac/ 的連結) */}
        <section className="py-8 bg-slate-950 border-t border-slate-900 text-center">
          <Link
            href="/services/commercial-ac/"
            className="text-xs text-slate-500 hover:text-sky-400 transition-colors inline-flex items-center gap-1"
          >
            &larr; 回到商用空調工程主頁
          </Link>
        </section>
      </main>
    </>
  );
}
