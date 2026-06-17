"use client";

import React from "react";
import { siteConfig } from "@/data/site";
import CTAButton from "./CTAButton";

interface LandingHeroProps {
  title: string;
  subtitle: string;
  phoneCtaText: string;
  lineCtaText: string;
  appointmentCtaText: string;
  trackPrefix: string; // e.g. "installation" or "repair"
  serviceType: string;
  phoneEventName?: string;
  lineEventName?: string;
  appointmentEventName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParams?: Record<string, any>;
  onPhoneClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onLineClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onAppointmentClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export default function LandingHero({
  title,
  subtitle,
  phoneCtaText,
  lineCtaText,
  appointmentCtaText,
  trackPrefix,
  serviceType,
  phoneEventName,
  lineEventName,
  appointmentEventName,
  extraParams = {},
  onPhoneClick,
  onLineClick,
  onAppointmentClick
}: LandingHeroProps) {
  return (
    <section className="relative pt-20 pb-12 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden flex items-center justify-center min-h-[85vh] lg:min-h-[80vh]">
      {/* Decorative background glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-950/15 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-950/15 blur-[100px] pointer-events-none"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
        {/* Region Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[11px] sm:text-xs font-bold text-sky-455 tracking-wider shadow-sm mb-4">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>高雄市 • 屏東縣 在地專業空調服務</span>
        </div>

        {/* Title (H1) - responsive sizing to prevent mobile breakage */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight sm:leading-snug max-w-3xl mx-auto">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-350 leading-relaxed max-w-xl mx-auto mt-4">
          {subtitle}
        </p>

        {/* Standard LP conversion indicators */}
        <div className="mt-4 text-xs text-sky-400 font-semibold flex justify-center gap-x-4">
          <span>✓ 經濟部登記合格</span>
          <span>•</span>
          <span>✓ 乙級裝修技術士師傅</span>
          <span>•</span>
          <span>✓ 先估價才施工</span>
        </div>

        {/* Mobile-optimized stack of conversion triggers */}
        <div className="w-full max-w-md flex flex-col gap-3 pt-6 mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* 📞 Urgent/Call CTA */}
            <CTAButton
              href={siteConfig.phone1Link}
              onClick={onPhoneClick}
              trackEventName={phoneEventName || `${trackPrefix}_urgent_click`}
              trackParams={{ service_type: serviceType, cta_position: "lp_hero", ...extraParams }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 shadow-lg text-sm transition-all"
            >
              <svg className="w-4.5 h-4.5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{phoneCtaText}</span>
            </CTAButton>

            {/* 💬 LINE CTA */}
            <CTAButton
              href={siteConfig.lineUrl}
              external
              onClick={onLineClick}
              trackEventName={lineEventName || "line_click"}
              trackParams={{ service_type: serviceType, cta_position: "lp_hero", ...extraParams }}
              className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-green-950/20 text-sm transition-all"
            >
              <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{lineCtaText}</span>
            </CTAButton>
          </div>

          {/* 📝 Booking Form Anchor */}
          <CTAButton
            href="#contact-section"
            onClick={onAppointmentClick}
            trackEventName={appointmentEventName || "quote_request"}
            trackParams={{ service_type: serviceType, cta_position: "lp_hero", ...extraParams }}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 text-sm transition-all"
          >
            <svg className="w-4.5 h-4.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{appointmentCtaText}</span>
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
