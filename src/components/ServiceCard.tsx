"use client";

import React from "react";
import { ServiceItem } from "@/data/services";
import CTAButton from "./CTAButton";

interface ServiceCardProps {
  service: ServiceItem;
}

// Map service ID to custom inline SVG icons
const getServiceIcon = (id: string) => {
  switch (id) {
    case "commercial-ac":
      return (
        <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "ac-installation":
      return (
        <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
        </svg>
      );
    case "ac-cleaning":
      return (
        <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "ac-repair":
      return (
        <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "ac-relocation":
      return (
        <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case "erv":
      return (
        <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      );
    default:
      return (
        <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
};

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-700 hover:shadow-xl hover:shadow-sky-950/10 transition-all duration-300 group">
      <div>
        {/* Icon & Title */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner group-hover:scale-110 group-hover:border-sky-500/30 transition-all duration-300">
            {getServiceIcon(service.id)}
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-sky-400 transition-colors">
            {service.name}
          </h3>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider block mb-1">常見痛點</span>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              {service.painPoint}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-850/40">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">專業解決方案</span>
            <p className="text-sm text-slate-300 leading-relaxed">
              {service.solution}
            </p>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <CTAButton
        href={service.path}
        className="w-full text-center py-3 bg-slate-850 text-white font-semibold rounded-xl border border-slate-800 hover:bg-sky-500 hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-300"
      >
        {service.ctaText}
      </CTAButton>
    </div>
  );
}
