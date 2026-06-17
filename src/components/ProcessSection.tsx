"use client";

import React from "react";

export default function ProcessSection() {
  const steps = [
    {
      step: "01",
      title: "線上諮詢或電話聯絡",
      description: "透過電話直撥或加 LINE 傳照片，由師傅為您進行初步診斷、回答疑問並初步估算需求。"
    },
    {
      step: "02",
      title: "現場精準評估場勘",
      description: "約定時間指派技師到府。確認空間大小、配管路線、排水高低差、散熱風向與最佳主機定位。"
    },
    {
      step: "03",
      title: "提供透明報價明細",
      description: "開立明列材料品牌、施工工法與各分項金額的透明估價單，確認雙方共識、決不惡意追加項目。"
    },
    {
      step: "04",
      title: "高標準施工與完工測試",
      description: "由持證技師進行標準工法安裝或檢修。嚴謹實施管路抽真空、冷媒壓力檢測、排水測試與運轉效能確校。"
    },
    {
      step: "05",
      title: "現場清理與保固交付",
      description: "整理施工現場，恢復環境整潔。向您講解操作注意事項，並交付正式工程保固憑證與說明。"
    }
  ];

  return (
    <section className="py-20 bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-950/50 rounded-full border border-sky-900/30">
            精細標準化作業流程
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight sm:text-4xl">
            從初步諮詢到售後保固的五大步驟
          </h2>
          <p className="text-lg text-slate-400 mt-4 leading-relaxed">
            我們堅持以標準化的工程流程對待每一位客戶，確保施工品質與溝通體驗符合最高標準。
          </p>
        </div>

        {/* Horizontal Timeline on Desktop / Vertical on Mobile */}
        <div className="relative">
          {/* Connecting line on desktop */}
          <div className="hidden lg:block absolute top-[45px] left-[10%] right-[10%] h-[1px] bg-slate-800 z-0"></div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 relative z-10">
            {steps.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center lg:items-start text-center lg:text-left group">
                {/* Step badge */}
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-lg font-bold text-sky-400 mb-6 shadow-lg group-hover:border-sky-500/50 group-hover:shadow-sky-500/10 transition-all duration-300">
                  {item.step}
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide group-hover:text-sky-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-450 leading-relaxed max-w-sm lg:max-w-none">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
