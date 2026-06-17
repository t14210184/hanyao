"use client";

import React from "react";
import { CaseItem } from "@/data/cases";

interface CaseCardProps {
  item: CaseItem;
}

export default function CaseCard({ item }: CaseCardProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Category & Location */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="text-xs font-semibold text-sky-400 bg-sky-950/50 py-1 px-2.5 rounded-full border border-sky-900/30">
            {item.category}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {item.location}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {item.description}
        </p>
      </div>

      {/* Specifications Badges */}
      <div className="pt-4 border-t border-slate-850/60">
        <span className="text-xs font-semibold text-slate-500 block mb-2">配置規格：</span>
        <div className="flex flex-col gap-1.5">
          {item.specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0"></span>
              <span>{spec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
