"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { footerLinks } from "@/data/navigation";
import CTAButton from "./CTAButton";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
              <svg
                className="w-6 h-6 text-sky-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {siteConfig.brandName}
            </Link>
            <p className="text-base text-slate-300 leading-relaxed">
              專業空調工程服務團隊。從家用變頻冷氣到大型工廠、醫院、商用空間多聯變頻冷氣規劃與維修，提供全方位空調解決方案。
            </p>
            <div className="flex flex-col gap-1.5 text-sm text-slate-300 mt-2">
              <span>✓ 台灣區冷凍空調工程工業同業公會會員</span>
              <span>✓ 乙級冷凍空調裝修技術士師傅團隊</span>
              <span>✓ 絕不強推不必要工項，收費透明</span>
            </div>
          </div>

          {/* Service Links */}
          <div>
            <h3 className="text-white font-bold text-base tracking-wider uppercase mb-4">服務項目</h3>
            <ul className="space-y-2.5 text-base text-slate-300">
              {footerLinks.services.map((item) => (
                <li key={item.name}>
                  <Link href={item.path} className="hover:text-white transition-colors py-1 inline-block">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Guide Links */}
          <div>
            <h3 className="text-white font-bold text-base tracking-wider uppercase mb-4">冷氣知識庫</h3>
            <ul className="space-y-2.5 text-base text-slate-300">
              {footerLinks.guides.map((item) => (
                <li key={item.name}>
                  <Link href={item.path} className="hover:text-white transition-colors py-1 inline-block">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-bold text-base tracking-wider uppercase mb-4">相關資訊</h3>
            <ul className="space-y-2.5 text-base text-slate-300">
              {footerLinks.support.map((item) => (
                <li key={item.name}>
                  <Link href={item.path} className="hover:text-white transition-colors py-1 inline-block">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Area Links */}
          <div>
            <h3 className="text-white font-bold text-base tracking-wider uppercase mb-4">服務地區</h3>
            <ul className="space-y-2.5 text-base text-slate-300">
              <li>
                <Link href="/areas/kaohsiung/" className="hover:text-white transition-colors py-1 inline-block">
                  高雄空調冷氣服務
                </Link>
              </li>
              <li>
                <Link href="/areas/pingtung/" className="hover:text-white transition-colors py-1 inline-block">
                  屏東空調冷氣服務
                </Link>
              </li>
              <li>
                <Link href="/areas/kaohsiung-ac-repair/" className="hover:text-white transition-colors py-1 inline-block">
                  高雄冷氣維修
                </Link>
              </li>
              <li>
                <Link href="/areas/pingtung-ac-installation/" className="hover:text-white transition-colors py-1 inline-block">
                  屏東冷氣安裝
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-base tracking-wider uppercase">聯絡諮詢</h3>
            <ul className="space-y-3 text-base text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="flex flex-col">
                  <CTAButton
                    href={siteConfig.phone1Link}
                    trackEventName="phone_click"
                    trackParams={{ cta_position: "footer_info" }}
                    className="hover:text-white font-semibold transition-colors"
                  >
                    {siteConfig.phone1}
                  </CTAButton>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <CTAButton
                  href={siteConfig.lineUrl}
                  external
                  trackEventName="line_click"
                  trackParams={{ cta_position: "footer_info" }}
                  className="text-green-500 hover:text-green-400 font-semibold transition-colors"
                >
                  加 LINE 免費線上評估
                </CTAButton>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex flex-col gap-0.5 text-slate-400">
                  <span className="font-semibold text-slate-300">高屏全區在地服務</span>
                  <span>高雄：前金、三民、鼓山、鳳山、左營等區</span>
                  <span>屏東：屏東市、萬丹、長治、潮州等地區</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-900 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy/" className="hover:text-slate-400">隱私條款</Link>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">本網站所標記之商用品牌案例均為工程方向定位，無任何商業授權關聯</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
