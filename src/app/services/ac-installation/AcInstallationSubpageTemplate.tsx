"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import CTAButton from "@/components/CTAButton";
import JsonLd from "@/components/JsonLd";
import FAQAccordion from "@/components/FAQAccordion";
import { SubpageContent, subpagesData } from "./subpageData";

interface AcInstallationSubpageTemplateProps {
  data: SubpageContent;
}

export default function AcInstallationSubpageTemplate({
  data,
}: AcInstallationSubpageTemplateProps) {
  const pageTitle = data.title;
  const pageDescription = data.description;
  const canonicalUrl = data.canonicalUrl;
  const h1Text = data.h1;

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首頁",
        item: `${siteConfig.domain}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "服務項目",
        item: `${siteConfig.domain}/services/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "空調冷氣安裝",
        item: `${siteConfig.domain}/services/ac-installation/`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: data.issueName,
        item: canonicalUrl,
      },
    ],
  };

  // WebPage Schema
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
  };

  // Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: data.serviceType,
    provider: {
      "@type": "HVACBusiness",
      name: `${siteConfig.brandName}有限公司`,
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "高雄市",
      },
      {
        "@type": "AdministrativeArea",
        name: "屏東縣",
      },
    ],
    description: data.description,
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // Get other subpages for recommendations (filter out current slug)
  const recommendations = Object.values(subpagesData).filter(
    (item) => item.slug !== data.slug
  );

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph Tags */}
        <meta property="og:title" content={data.ogTitle} />
        <meta property="og:description" content={data.ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteConfig.brandName} />
        <meta property="og:locale" content="zh_TW" />
        {/* JSON-LD Schemas */}
        <JsonLd schema={pageSchema} />
        <JsonLd schema={breadcrumbSchema} />
        <JsonLd schema={serviceSchema} />
        <JsonLd schema={faqSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Breadcrumb Section */}
        <div className="bg-slate-950 py-3 border-b border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex text-xs text-slate-500 space-x-2">
              <Link href="/" className="hover:text-sky-400">
                首頁
              </Link>
              <span>/</span>
              <Link href="/services/" className="hover:text-sky-400">
                服務項目
              </Link>
              <span>/</span>
              <Link
                href="/services/ac-installation/"
                className="hover:text-sky-400"
              >
                空調冷氣安裝
              </Link>
              <span>/</span>
              <span className="text-slate-400 truncate">{data.issueName}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-slate-900/10 border-b border-slate-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-[50%] h-[100%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
              高雄 • 屏東專業空調冷氣安裝
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-6 tracking-tight leading-tight">
              {h1Text}
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              {data.intro}
            </p>

            {/* Hero CTA Side-by-Side */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{
                  service_type: "ac_installation",
                  cta_position: `subpage_hero_line_${data.slug}`,
                }}
                className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>LINE 傳照片諮詢</span>
              </CTAButton>

              <CTAButton
                href={siteConfig.phone1Link}
                trackEventName="phone_click"
                trackParams={{
                  service_type: "ac_installation",
                  cta_position: `subpage_hero_phone_${data.slug}`,
                }}
                className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <svg
                  className="w-5 h-5 text-sky-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>立即電話諮詢</span>
              </CTAButton>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Pain Points */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                您可能面臨的安裝困境
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.painPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center text-xs shrink-0 font-bold">
                      !
                    </span>
                    <p className="text-xs sm:text-sm text-slate-350 leading-relaxed">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Planning Items */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                規劃要點與注意事項
              </h2>
              <div className="space-y-4">
                {data.planningItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/20 border border-slate-850/60 p-5 rounded-2xl"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-3">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Steps */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                施工安裝標準流程
              </h2>
              <div className="space-y-4">
                {data.processSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/20 border border-slate-850/60 p-5 rounded-2xl flex items-start gap-4"
                  >
                    <span className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid LINE CTA */}
            <div className="mb-12 text-center p-8 bg-sky-950/20 border border-sky-900/30 rounded-2xl">
              <p className="text-xs sm:text-sm text-sky-300 font-semibold mb-2">
                {data.ctaTitle}
              </p>
              <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                {data.ctaDescription}
              </p>
              <div className="max-w-xs mx-auto">
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{
                    service_type: "ac_installation",
                    cta_position: `subpage_mid_line_${data.slug}`,
                  }}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>LINE 諮詢安裝規劃</span>
                </CTAButton>
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="mb-12 pt-8 border-t border-slate-900">
              <h2 className="text-lg font-bold text-white border-l-4 border-sky-500 pl-3 mb-6">
                常見問題解答 FAQ
              </h2>
              <FAQAccordion items={data.faq} />
            </div>

            {/* Back to main page link */}
            <div className="text-center mb-12">
              <Link
                href="/services/ac-installation/"
                className="text-xs sm:text-sm text-sky-400 hover:text-sky-350 font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                &larr; 回到空調冷氣安裝主頁
              </Link>
            </div>

            {/* Other subpage recommendations */}
            <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                其他安裝服務說明：
              </h3>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm">
                {recommendations.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/services/ac-installation/${item.slug}/`}
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
              施工前先說明可能費用項目，確認後再安排施作
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-6 tracking-tight sm:text-3xl">
              {data.ctaTitle}
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-xl mx-auto">
              {data.ctaDescription}
            </p>

            {/* Bottom Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{
                  service_type: "ac_installation",
                  cta_position: `subpage_bottom_line_${data.slug}`,
                }}
                className="w-full sm:flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>LINE 傳照片諮詢</span>
              </CTAButton>

              <CTAButton
                href={siteConfig.phone1Link}
                trackEventName="phone_click"
                trackParams={{
                  service_type: "ac_installation",
                  cta_position: `subpage_bottom_phone_${data.slug}`,
                }}
                className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <svg
                  className="w-5 h-5 text-sky-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>立即電話諮詢</span>
              </CTAButton>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
