"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import CTAButton from "./CTAButton";
import { trackEvent } from "@/lib/tracking";

export default function MobileStickyCTA() {
  const pathname = usePathname();
  const isCommercial = pathname?.includes("/lp/commercial-ac/");

  // Dynamic values based on current page
  const serviceType = isCommercial ? "commercial_ac" : "general";
  const phoneText = isCommercial ? "撥打商用諮詢" : "電話聯絡";
  const lineText = isCommercial ? "LINE 傳平面圖" : "加 LINE 諮詢";
  const appointmentText = isCommercial ? "預約商用場勘" : "預約到府估價";

  const handlePhoneClick = () => {
    if (isCommercial) {
      trackEvent("lp_cta_click", {
        service_type: "commercial_ac",
        area: "all",
        landing_page_type: "google_ads",
        cta_position: "mobile_sticky_bar",
        lead_method: "phone",
        keyword_intent: "commercial_ac"
      });
    }
  };

  const handleLineClick = () => {
    if (isCommercial) {
      trackEvent("lp_cta_click", {
        service_type: "commercial_ac",
        area: "all",
        landing_page_type: "google_ads",
        cta_position: "mobile_sticky_bar",
        lead_method: "line",
        keyword_intent: "commercial_ac"
      });
    }
  };

  const handleAppointmentClick = () => {
    if (isCommercial) {
      trackEvent("commercial_quote_request", {
        service_type: "commercial_ac",
        area: "all",
        landing_page_type: "google_ads",
        cta_position: "mobile_sticky_bar",
        lead_method: "form_anchor",
        keyword_intent: "commercial_ac"
      });
      trackEvent("lp_cta_click", {
        service_type: "commercial_ac",
        area: "all",
        landing_page_type: "google_ads",
        cta_position: "mobile_sticky_bar",
        lead_method: "form_anchor",
        keyword_intent: "commercial_ac"
      });
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-850 shadow-2xl py-3 px-4 flex items-center justify-between gap-3 safe-bottom">
      {/* 📞 Call CTA */}
      <CTAButton
        href={siteConfig.phone1Link}
        onClick={handlePhoneClick}
        trackEventName="phone_click"
        trackParams={{ service_type: serviceType, cta_position: "mobile_sticky_bar" }}
        className="flex-1 flex flex-col items-center justify-center bg-slate-800 text-white hover:bg-slate-700 py-2 rounded-lg font-bold border border-slate-700 text-xs gap-0.5 transition-colors"
      >
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span>{phoneText}</span>
      </CTAButton>

      {/* 💬 LINE CTA */}
      <CTAButton
        href={siteConfig.lineUrl}
        external
        onClick={handleLineClick}
        trackEventName="line_click"
        trackParams={{ service_type: serviceType, cta_position: "mobile_sticky_bar" }}
        className="flex-1 flex flex-col items-center justify-center bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-xs gap-0.5 shadow-md shadow-green-950/20 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{lineText}</span>
      </CTAButton>

      {/* 📝 Appointment CTA */}
      <CTAButton
        href="#contact-section"
        onClick={handleAppointmentClick}
        trackEventName="quote_request"
        trackParams={{ service_type: serviceType, cta_position: "mobile_sticky_bar" }}
        className="flex-1 flex flex-col items-center justify-center bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-lg font-bold text-xs gap-0.5 shadow-md shadow-orange-950/20 transition-colors"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{appointmentText}</span>
      </CTAButton>
    </div>
  );
}
