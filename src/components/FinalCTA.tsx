"use client";

import React from "react";
import { siteConfig } from "@/data/site";
import CTAButton from "./CTAButton";

interface FinalCTAProps {
  serviceType?: string;
  phoneText?: string;
  lineText?: string;
  onPhoneClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onLineClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export default function FinalCTA({
  serviceType = "general",
  phoneText = "撥打電話討論",
  lineText = "加 LINE 傳照評估",
  onPhoneClick,
  onLineClick
}: FinalCTAProps) {
  return (
    <section className="py-20 relative overflow-hidden bg-slate-900/40 border-t border-slate-900">
      {/* Background visual effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] rounded-full bg-sky-950/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-[50%] -right-[20%] w-[80%] h-[150%] rounded-full bg-blue-950/10 blur-[120px] pointer-events-none"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
          現場免費到府場勘與估價
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-6 tracking-tight sm:text-4xl">
          還在煩惱空調冷氣問題？立刻聯絡我們免費場勘
        </h2>
        <p className="text-lg text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
          不論是冷氣突然漏水不冷，還是公司廠房需要規劃多聯變頻系統，焓耀技師團隊一通電話或 LINE 傳照片，立刻為您提供初步評估與精準場勘。
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
          {/* 📞 Phone */}
          <CTAButton
            href={siteConfig.phone1Link}
            onClick={onPhoneClick}
            trackEventName="phone_click"
            trackParams={{ service_type: serviceType, cta_position: "final_cta_section" }}
            className="w-full sm:flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{phoneText}</span>
          </CTAButton>

          {/* 💬 LINE */}
          <CTAButton
            href={siteConfig.lineUrl}
            external
            onClick={onLineClick}
            trackEventName="line_click"
            trackParams={{ service_type: serviceType, cta_position: "final_cta_section" }}
            className="w-full sm:flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-950/20 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{lineText}</span>
          </CTAButton>
        </div>

        {/* Region notice */}
        <div className="mt-8 text-xs text-slate-500 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <span>✓ 高雄市各區快速派車</span>
          <span>•</span>
          <span>✓ 屏東縣市免費場勘估價</span>
          <span>•</span>
          <span>✓ 透明報價同意後施工</span>
        </div>
      </div>
    </section>
  );
}
