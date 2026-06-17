"use client";

import React from "react";

interface PriceFactor {
  name: string;
  description: string;
}

interface PriceFactorsSectionProps {
  title: string;
  subtitle: string;
  factors: PriceFactor[];
}

export default function PriceFactorsSection({ title, subtitle, factors }: PriceFactorsSectionProps) {
  return (
    <section className="py-16 bg-slate-900/10 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            費用與報價說明
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Factors List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {factors.map((factor, i) => (
            <div
              key={i}
              className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl flex gap-4 hover:border-slate-800 transition-colors"
            >
              {/* Checkmark style list bullet */}
              <div className="p-1.5 bg-sky-950/60 w-fit h-fit rounded-lg border border-sky-900/30 text-sky-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2 tracking-wide">
                  {factor.name}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {factor.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Transparency note */}
        <div className="mt-12 p-6 bg-slate-900/40 border border-slate-850 rounded-2xl text-center max-w-2xl mx-auto">
          <p className="text-sm text-slate-350 leading-relaxed">
            💡 <strong>焓耀透明承諾：</strong>我們堅持「到府精準場勘 → 說明施工明細 → 提供透明報價 → 取得您的同意 → 現場高規格施作」。絕不在不清楚現況的前提下以低於市價的釣魚價格攬客，更不允許現場任意加價。
          </p>
        </div>

      </div>
    </section>
  );
}
