"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import { servicesData } from "@/data/services";
import { trackEvent } from "@/lib/tracking";

// Declare global interface for window.validateContactForm if loaded from form.js
declare global {
  interface Window {
    validateContactForm?: (name: string, phone: string, service: string) => { valid: boolean; message?: string };
  }
}

export default function ContactForm() {
  const pathname = usePathname();
  const isCommercial = pathname?.includes("/lp/commercial-ac/");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area: "all",
    service: "",
    message: ""
  });

  // Automatically select commercial-ac if on the commercial page
  useEffect(() => {
    if (isCommercial) {
      setFormData((prev) => ({ ...prev, service: "commercial-ac" }));
    }
  }, [isCommercial]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // Trigger form_start on first interaction
  const handleFocus = () => {
    if (!hasStartedTyping) {
      setHasStartedTyping(true);
      trackEvent("form_start", {
        form_service: isCommercial ? "commercial_ac" : (formData.service || "none"),
        form_area: formData.area,
        landing_page_type: isCommercial ? "google_ads" : undefined
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let validationResult = { valid: true, message: "" };

    // Use global validator from form.js if available, otherwise fallback to React validation
    if (typeof window !== "undefined" && typeof window.validateContactForm === "function") {
      const result = window.validateContactForm(formData.name, formData.phone, formData.service);
      validationResult = {
        valid: result.valid,
        message: result.message || ""
      };
    } else {
      // Fallback client-side validation
      if (!formData.name.trim()) {
        validationResult = { valid: false, message: "請填寫您的聯絡姓名" };
      } else if (!formData.phone.trim()) {
        validationResult = { valid: false, message: "請填寫您的聯絡電話" };
      } else if (formData.phone.replace(/[- ]/g, "").length < 8) {
        validationResult = { valid: false, message: "請填寫正確的電話號碼格式" };
      } else if (!formData.service) {
        validationResult = { valid: false, message: "請選擇您需要的服務項目" };
      }
    }

    if (!validationResult.valid) {
      setErrors({ form: validationResult.message });
      return;
    }

    // Trigger form_submit event
    trackEvent("form_submit", {
      form_service: isCommercial ? "commercial_ac" : formData.service,
      form_area: formData.area,
      lead_method: "form",
      landing_page_type: isCommercial ? "google_ads" : undefined
    });

    // Simulate backend sending success (since it's a static site, it displays a success placeholder action)
    setIsSubmitted(true);

    // Trigger generate_lead event on success view display
    trackEvent("generate_lead", {
      lead_method: "form",
      area: formData.area,
      service_type: isCommercial ? "commercial_ac" : formData.service,
      landing_page_type: isCommercial ? "google_ads" : undefined,
      cta_position: "contact_form_submit",
      keyword_intent: isCommercial ? "commercial_ac" : undefined
    });
  };

  const handleReset = () => {
    setFormData({
      name: "",
      phone: "",
      area: "all",
      service: isCommercial ? "commercial-ac" : "",
      message: ""
    });
    setErrors({});
    setIsSubmitted(false);
    setHasStartedTyping(false);
  };

  if (isSubmitted) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 sm:p-12 rounded-3xl text-center shadow-xl max-w-xl mx-auto animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">預約估價送出成功！</h3>
        <p className="text-slate-400 mb-8 leading-relaxed">
          感謝您的預約。我們的空調技師團隊將在最短時間內，以電話或簡訊與您聯繫，確認到府場勘的最佳時間。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all"
          >
            再次填寫
          </button>
          <a
            href={siteConfig.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("line_click", { cta_position: "form_success_referral" })}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-green-950/20 transition-all"
          >
            <span>LINE 傳照片加速估價</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 p-8 sm:p-10 rounded-3xl shadow-xl max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-semibold text-slate-300">
              聯絡姓名 <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onFocus={handleFocus}
              onChange={handleChange}
              placeholder="例如：王先生"
              className="bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl py-3 px-4 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-semibold text-slate-300">
              聯絡電話 <span className="text-orange-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onFocus={handleFocus}
              onChange={handleChange}
              placeholder="例如：0931-940-133"
              className="bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl py-3 px-4 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Service Area */}
          <div className="flex flex-col gap-2">
            <label htmlFor="area" className="text-sm font-semibold text-slate-300">
              所在地區
            </label>
            <select
              id="area"
              name="area"
              value={formData.area}
              onFocus={handleFocus}
              onChange={handleChange}
              className="bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl py-3 px-4 outline-none transition-all"
            >
              <option value="all">高雄/屏東全區</option>
              <option value="kaohsiung">高雄地區</option>
              <option value="pingtung">屏東地區</option>
            </select>
          </div>

          {/* Service Item */}
          <div className="flex flex-col gap-2">
            <label htmlFor="service" className="text-sm font-semibold text-slate-300">
              需求項目 <span className="text-orange-500">*</span>
            </label>
            <select
              id="service"
              name="service"
              required
              value={formData.service}
              onFocus={handleFocus}
              onChange={handleChange}
              className="bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl py-3 px-4 outline-none transition-all"
            >
              <option value="">-- 請選擇服務項目 --</option>
              {servicesData.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-semibold text-slate-300">
            狀況描述或特殊需求 (選填)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onFocus={handleFocus}
            onChange={handleChange}
            placeholder="例如：冷氣漏水、主機發出異音、約定場勘時間、商用廠房規格..."
            className="bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl py-3 px-4 outline-none transition-all placeholder:text-slate-600 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 tracking-wide transition-all"
          >
            送出預約到府場勘
          </button>
        </div>

        {/* Note */}
        <p className="text-center text-xs text-slate-500">
          ✓ 我們保證保護您的個資安全，此資料僅限空調工程聯絡使用。
        </p>
      </form>
    </div>
  );
}
