"use client";

import React from "react";

interface PainPoint {
  title: string;
  description: string;
}

interface PainPointCardsProps {
  title: string;
  subtitle: string;
  points: PainPoint[];
}

export default function PainPointCards({ title, subtitle, points }: PainPointCardsProps) {
  return (
    <section className="py-16 bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest px-3 py-1 bg-orange-950/45 rounded-full border border-orange-900/30">
            你是否也遇到這些狀況？
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((point, i) => (
            <div
              key={i}
              className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex flex-col hover:border-slate-800 transition-all duration-300 shadow-md group"
            >
              {/* Alert icon representing symptoms */}
              <div className="p-2.5 bg-orange-950/60 w-fit rounded-lg border border-orange-900/30 text-orange-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2 tracking-wide">
                {point.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
