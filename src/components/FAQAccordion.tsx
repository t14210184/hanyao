"use client";

import React, { useState } from "react";
import { FAQItem } from "@/data/faqs";

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 rounded-2xl overflow-hidden transition-all duration-300"
          >
            {/* Header / Question Button */}
            <button
              onClick={() => toggle(item.id)}
              className="w-full py-5 px-6 flex items-center justify-between gap-4 text-left font-semibold text-white hover:text-sky-400 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-base sm:text-lg pr-4">{item.question}</span>
              <span className="shrink-0 p-1 bg-slate-950/80 rounded-lg border border-slate-800 text-sky-400">
                <svg
                  className={`w-5 h-5 transform transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {/* Answer body */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[500px] opacity-100 border-t border-slate-850/60" : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <div className="p-6 text-sm sm:text-base text-slate-400 leading-relaxed bg-slate-950/20">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
