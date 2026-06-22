"use client";

import React, { useState, useEffect } from "react";
import { areasData } from "@/data/areas";
interface AreaSelectorProps {
  onAreaChange: (areaId: string) => void;
}

export default function AreaSelector({ onAreaChange }: AreaSelectorProps) {
  const [selectedArea, setSelectedArea] = useState<string>("all");

  // Synchronize with URL parameter and custom window event
  useEffect(() => {
    // 1. Initial check of URL parameters
    const params = new URLSearchParams(window.location.search);
    const areaParam = params.get("area");
    if (areaParam && areasData[areaParam]) {
      setSelectedArea(areaParam);
      onAreaChange(areaParam);
    }

    // 2. Listen to custom event fired by public/scripts/geo.js
    const handleAreaChangeCustom = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newArea = customEvent.detail;
      if (newArea && areasData[newArea]) {
        setSelectedArea(newArea);
        onAreaChange(newArea);
      }
    };

    window.addEventListener("areaChanged", handleAreaChangeCustom);
    return () => window.removeEventListener("areaChanged", handleAreaChangeCustom);
  }, [onAreaChange]);

  const handleSelect = (areaId: string) => {
    setSelectedArea(areaId);
    onAreaChange(areaId);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 flex gap-2 w-full max-w-lg shadow-inner">
        {Object.values(areasData).map((area) => (
          <button
            key={area.id}
            onClick={() => handleSelect(area.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 ${
              selectedArea === area.id
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.02]"
                : "text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            {area.name}
          </button>
        ))}
      </div>

      {/* Dynamic Area Description Display */}
      <div className="mt-8 max-w-3xl w-full bg-slate-900/30 backdrop-blur-sm p-6 rounded-2xl border border-slate-850 shadow-md animate-fadeIn">
        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {areasData[selectedArea]?.headline}
        </h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          {areasData[selectedArea]?.description}
        </p>
        
        {/* District list preview */}
        <div className="mt-4 pt-4 border-t border-slate-850/60">
          <span className="text-xs font-semibold text-slate-500 block mb-2">服務行政區域：</span>
          <div className="flex flex-wrap gap-2">
            {areasData[selectedArea]?.districts.map((district) => (
              <span 
                key={district} 
                className="text-xs bg-slate-900/80 text-slate-300 py-1 px-2.5 rounded border border-slate-800"
              >
                {district}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
