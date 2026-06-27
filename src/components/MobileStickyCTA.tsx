"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import CTAButton from "./CTAButton";

export default function MobileStickyCTA() {
  const pathname = usePathname();
  const isCommercial = pathname?.includes("/lp/commercial-ac/");
  const [hasContactSection, setHasContactSection] = useState(false);

  // Dynamic values based on current page
  const serviceType = isCommercial ? "commercial_ac" : "general";
  const phoneText = isCommercial ? "商用電話" : "電話聯絡";
  const lineText = isCommercial ? "LINE傳圖" : "LINE諮詢";

  useEffect(() => {
    // Check if element exists in current DOM
    const contactSectionExists = !!document.getElementById("contact-section");
    setHasContactSection(contactSectionExists);
  }, [pathname]);

  const appointmentHref = hasContactSection ? "#contact-section" : "/contact/";
  const appointmentText = hasContactSection ? (isCommercial ? "預約場勘" : "預約估價") : "聯絡表單";

  const handlePhoneClick = () => {
    // No-op or custom behavior (unallowed event tracker removed)
  };

  const handleLineClick = () => {
    // No-op or custom behavior (unallowed event tracker removed)
  };

  const handleAppointmentClick = (e: React.MouseEvent) => {
    if (hasContactSection) {
      e.preventDefault();
      const element = document.getElementById("contact-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
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
        className="flex-1 flex flex-col items-center justify-center bg-slate-800 text-white hover:bg-slate-700 py-3 rounded-xl font-bold border border-slate-700 text-base sm:text-lg min-h-[64px] gap-1 transition-colors"
      >
        <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
        className="flex-1 flex flex-col items-center justify-center bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-base sm:text-lg min-h-[64px] gap-1 shadow-md shadow-green-950/20 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{lineText}</span>
      </CTAButton>
 
      {/* 📝 Appointment CTA */}
      <CTAButton
        href={appointmentHref}
        onClick={handleAppointmentClick}
        className="flex-1 flex flex-col items-center justify-center bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-bold text-base sm:text-lg min-h-[64px] gap-1 shadow-md shadow-orange-950/20 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{appointmentText}</span>
      </CTAButton>
    </div>
  );
}
