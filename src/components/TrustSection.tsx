"use client";

import React from "react";

export default function TrustSection() {
  const trustPoints = [
    {
      title: "經濟部冷凍空調業登記",
      subtitle: "經冷字第 1120002883 號",
      description: "焓耀空調工程具備經濟部冷凍空調業登記證書，登記字號經冷字第 1120002883 號，營業範圍為 E602011 冷凍空調工程業。",
      icon: (
        <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "冷凍空調工程同業公會會員",
      subtitle: "台灣區冷凍空調工程同業公會",
      description: "具備台灣區冷凍空調工程工業同業公會會員證書，依空調工程專業規範執行服務。",
      icon: (
        <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "乙級冷凍空調裝修技術士",
      subtitle: "乙級冷凍空調裝修技術士證照",
      description: "具備乙級冷凍空調裝修技術士證照，協助冷氣安裝、維修檢修、清洗保養與商用空調工程判斷。",
      icon: (
        <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0-6L3 9m9 5l9-5" />
        </svg>
      )
    },
    {
      title: "現場評估後規劃",
      subtitle: "價格透明拒絕低價話術",
      description: "依現場坪數、管線、排水、散熱與用電條件提供建議，不以低價話術亂報價。",
      icon: (
        <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-20 bg-slate-900/10 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            合法專業與信任背書
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight sm:text-4xl">
            為什麼高屏地區的客戶選擇委託我們？
          </h2>
          <p className="text-lg text-slate-400 mt-4 leading-relaxed">
            焓耀空調秉持政府核可資質、公會認證及專業證照技術，為您提供高品質、透明可靠的空調工程服務。
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustPoints.map((point, i) => (
            <div 
              key={i} 
              className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex flex-col hover:border-slate-700 transition-all duration-300 shadow-md"
            >
              <div className="p-3 bg-slate-950/80 w-fit rounded-xl border border-slate-800 mb-6">
                {point.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-1 tracking-wide">
                {point.title}
              </h3>
              <span className="text-xs font-semibold text-sky-400 mb-3 block">
                {point.subtitle}
              </span>
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
