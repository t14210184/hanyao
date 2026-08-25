"use client";

import React, { useState, useEffect } from "react";
import { siteConfig } from "@/data/site";
import { servicesData } from "@/data/services";
import CTAButton from "@/components/CTAButton";
import LineDesktopQrDialog from "@/components/LineDesktopQrDialog";
import { trackEvent, trackLineContactAttempt } from "@/lib/tracking";
import {
  buildDesktopLineQrHandoff,
  buildLineOaMessageUrl,
  isMobileLineClient,
  prepareLineLead,
} from "@/lib/line-contact";

interface ServiceOption {
  id: string;
  name: string;
}

interface ContactFormProps {
  /** 表單標題，預設不顯示（首頁不備而呈現） */
  heading?: string;
  /** 表單副標，預設不顯示 */
  subheading?: string;
  /** 狀況描述 textarea 的 placeholder，預設為現有文案 */
  messagePlaceholder?: string;
  /** tracking form_location param，預設 "home_consultation_form" */
  formLocation?: string;
  /** 預設選中的服務 option id，預設 ""（不預設） */
  defaultService?: string;
  /** 自訂服務選項陣列，不傳時沿用 servicesData 全列表 */
  serviceOptions?: ServiceOption[];
}

export default function ContactForm({
  heading,
  subheading,
  messagePlaceholder = "例如：冷氣漏水、主機發出異音、約定場勘時間、商用廠房規格...",
  formLocation = "home_consultation_form",
  defaultService = "",
  serviceOptions,
}: ContactFormProps = {}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area: "all",
    service: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copyFallbackText, setCopyFallbackText] = useState<string>("");
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [lineLeadToken, setLineLeadToken] = useState<string | null>(null);
  const [linePrepareFailed, setLinePrepareFailed] = useState(false);
  const [lineQrHandoff, setLineQrHandoff] = useState<ReturnType<
    typeof buildDesktopLineQrHandoff
  >>(null);

  // Read ?service= from URL to pre-select, fallback to defaultService prop
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const preService = params.get("service");
    if (preService) {
      setFormData((prev) => ({ ...prev, service: preService }));
    } else if (defaultService) {
      setFormData((prev) => ({ ...prev, service: defaultService }));
    }
  }, [defaultService]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Trigger form_start on first interaction
    if (!hasStartedTyping) {
      setHasStartedTyping(true);
      trackEvent("form_start", {
        form_location: formLocation,
        service_type: name === "service" ? value : formData.service,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreparing) return;

    // 1. Validate required fields
    if (!formData.name.trim()) {
      setErrors({ form: "請填寫您的聯絡姓名" });
      trackEvent("form_error", {
        form_location: formLocation,
        service_type: formData.service,
        error_field: "name",
        error_message: "請填寫您的聯絡姓名",
      });
      return;
    }
    if (!formData.phone.trim()) {
      setErrors({ form: "請填寫您的聯絡電話" });
      trackEvent("form_error", {
        form_location: formLocation,
        service_type: formData.service,
        error_field: "phone",
        error_message: "請填寫您的聯絡電話",
      });
      return;
    }
    if (formData.phone.replace(/[- ]/g, "").length < 8) {
      setErrors({ form: "請填寫正確的電話號碼格式" });
      trackEvent("form_error", {
        form_location: formLocation,
        service_type: formData.service,
        error_field: "phone",
        error_message: "請填寫正確的電話號碼格式",
      });
      return;
    }
    if (!formData.service) {
      setErrors({ form: "請選擇您需要的服務項目" });
      trackEvent("form_error", {
        form_location: formLocation,
        service_type: "",
        error_field: "service",
        error_message: "請選擇您需要的服務項目",
      });
      return;
    }

    // 2. Resolve labels
    const allOptions: ServiceOption[] = serviceOptions ?? servicesData;
    const serviceLabel =
      allOptions.find((s) => s.id === formData.service)?.name ??
      formData.service;
    const areaMap: Record<string, string> = {
      all: "高雄/屏東全區",
      kaohsiung: "高雄地區",
      pingtung: "屏東地區",
    };
    const areaLabel = areaMap[formData.area] ?? formData.area;

    // Prepare only the anonymous intent and attribution. Form PII remains in
    // browser memory and is appended to the message only after preparation.
    setIsPreparing(true);
    const prepared = await prepareLineLead();
    const serverLeadToken = prepared?.lead_token ?? null;
    const isMobile = isMobileLineClient();
    const desktopHandoff = isMobile
      ? null
      : buildDesktopLineQrHandoff(serverLeadToken);

    const lineText = [
      "您好，我想諮詢焓耀空調工程：",
      ...(serverLeadToken ? [`【詢價編號】${serverLeadToken}`] : []),
      "",
      `姓名：${formData.name}`,
      `電話：${formData.phone}`,
      `所在地區：${areaLabel}`,
      `需求項目：${serviceLabel}`,
      `狀況描述：${formData.message.trim() || "（未填寫）"}`,
      "",
      "方便的聯絡時間：",
      "是否需要到府場勘：",
      "",
      "請協助回覆，謝謝。",
    ].join("\n");

    // 4. Copy to clipboard — three fallback layers
    let copySuccess = false;

    // Layer 1: Clipboard API
    if (
      typeof window !== "undefined" &&
      navigator?.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(lineText);
        copySuccess = true;
      } catch {
        // proceed to layer 2
      }
    }

    // Layer 2: textarea + execCommand
    if (!copySuccess && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = lineText;
        textarea.style.cssText =
          "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) copySuccess = true;
      } catch {
        // proceed to layer 3
      }
    }

    // Layer 3: show text on screen for manual copy
    if (!copySuccess) {
      setCopyFallbackText(lineText);
    }

    // Emit only safe diagnostic data; form PII never enters this payload.
    trackLineContactAttempt({
      contact_method: "form_copy_open_line",
      event_source: "contact_form",
    });

    setLineLeadToken(serverLeadToken);
    setLinePrepareFailed(!prepared || (!isMobile && !desktopHandoff));
    setLineQrHandoff(desktopHandoff);
    setIsPreparing(false);
    setIsSubmitted(true);

    // Mobile success uses the full local form message in the official
    // oaMessage URL. Desktop success stays on this page and shows a QR with
    // only the generic message + HY token. Any failure uses the profile URL.
    if (prepared && isMobile) {
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.assign(buildLineOaMessageUrl(lineText));
        }
      }, 1200);
    } else if (!desktopHandoff) {
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.assign(siteConfig.lineUrl);
        }
      }, 1200);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      phone: "",
      area: "all",
      service: "",
      message: "",
    });
    setErrors({});
    setIsSubmitted(false);
    setCopyFallbackText("");
    setHasStartedTyping(false);
    setIsPreparing(false);
    setLineLeadToken(null);
    setLinePrepareFailed(false);
    setLineQrHandoff(null);
  };

  // ── Success / redirect screen ──────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <>
        {lineQrHandoff && (
          <LineDesktopQrDialog
            handoff={lineQrHandoff}
            onClose={() => setLineQrHandoff(null)}
          />
        )}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 sm:p-12 rounded-3xl text-center shadow-xl max-w-xl mx-auto">
        {/* Icon */}
        <div className="w-16 h-16 bg-green-950 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          {lineQrHandoff
            ? "請使用手機 LINE 掃描"
            : lineLeadToken
              ? "正在準備 LINE 訊息"
              : "正在開啟 LINE 官方帳號"}
        </h3>
        <p className="text-slate-200 text-lg sm:text-xl mb-3 leading-relaxed font-medium">
          {linePrepareFailed
            ? "準備訊息暫時無法完成，將開啟 LINE 官方帳號頁面…"
            : lineQrHandoff
              ? "QR 只帶入詢價編號，表單完整內容仍保留在本機。"
              : "正在為您開啟 LINE 訊息視窗…"}
        </p>
        <p className="text-slate-300 text-base sm:text-lg mb-6 leading-relaxed">
          {lineLeadToken
            ? `詢價編號：${lineLeadToken}。請確認訊息內容後按「送出」。`
            : "請在 LINE 中貼上剛才複製的內容，確認後按「送出」。"}
        </p>

        {/* Fallback: show text if clipboard failed */}
        {copyFallbackText && (
          <div className="mt-2 mb-6 text-left">
            <p className="text-base sm:text-lg text-orange-400 mb-3 flex items-center gap-2 font-bold">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              剪貼簿複製失敗，請手動複製以下內容後貼到 LINE：
            </p>
            <textarea
              readOnly
              value={copyFallbackText}
              rows={8}
              className="w-full bg-slate-950 border border-slate-600 text-slate-200 rounded-xl p-4 text-base sm:text-lg resize-none focus:outline-none min-h-[200px] leading-relaxed"
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}

        <button
          onClick={handleReset}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all"
        >
          重新填寫
        </button>
        </div>
      </>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 p-8 sm:p-10 rounded-3xl shadow-xl max-w-2xl mx-auto">
      {/* Optional heading / subheading — only rendered when props are passed */}
      {heading && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white">{heading}</h2>
          {subheading && (
            <p className="text-sm text-slate-400 mt-2">{subheading}</p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name */}
          <div className="flex flex-col gap-3">
            <label htmlFor="name" className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
              聯絡姓名 <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="例如：王先生"
              className="bg-slate-950 border border-slate-600 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-white rounded-xl py-4 px-5 outline-none transition-all placeholder:text-slate-400 text-lg sm:text-xl min-h-[64px] w-full font-medium"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-3">
            <label htmlFor="phone" className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
              聯絡電話 <span className="text-orange-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="例如：08-7552260"
              className="bg-slate-950 border border-slate-600 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-white rounded-xl py-4 px-5 outline-none transition-all placeholder:text-slate-400 text-lg sm:text-xl min-h-[64px] w-full font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Area */}
          <div className="flex flex-col gap-3">
            <label htmlFor="area" className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
              所在地區
            </label>
            <select
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="bg-slate-950 border border-slate-600 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-white rounded-xl py-4 px-5 outline-none transition-all text-lg sm:text-xl min-h-[64px] w-full font-medium"
            >
              <option value="all">高雄/屏東全區</option>
              <option value="kaohsiung">高雄地區</option>
              <option value="pingtung">屏東地區</option>
            </select>
          </div>

          {/* Service */}
          <div className="flex flex-col gap-3">
            <label htmlFor="service" className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
              需求項目 <span className="text-orange-500">*</span>
            </label>
            <select
              id="service"
              name="service"
              required
              value={formData.service}
              onChange={handleChange}
              className="bg-slate-950 border border-slate-600 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-white rounded-xl py-4 px-5 outline-none transition-all text-lg sm:text-xl min-h-[64px] w-full font-medium"
            >
              <option value="">-- 請選擇服務項目 --</option>
              {(serviceOptions ?? servicesData).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-3">
          <label htmlFor="message" className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
            狀況描述或特殊需求 (選填)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            placeholder={messagePlaceholder}
            className="bg-slate-950 border border-slate-600 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-white rounded-xl py-4 px-5 outline-none transition-all placeholder:text-slate-400 text-lg sm:text-xl min-h-[180px] w-full font-medium leading-[1.8] resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            id="contact-form-submit"
            disabled={isPreparing}
            className="w-full min-h-[72px] bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-wait active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 tracking-wide transition-all flex items-center justify-center gap-3 text-xl sm:text-2xl px-6 py-4"
          >
            <svg
              className="w-6 h-6 sm:w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {isPreparing ? "正在準備 LINE…" : "複製諮詢內容並開啟 LINE"}
          </button>
        </div>

        {/* Note */}
        <div className="text-slate-200 text-base sm:text-lg leading-[1.8] space-y-4 bg-slate-950/60 p-5 sm:p-7 rounded-2xl border border-slate-800 shadow-inner">
          <p className="font-bold text-white text-lg sm:text-2xl border-b border-slate-800 pb-2 mb-3">【LINE 聯絡流程說明】</p>
          <div className="space-y-4 text-slate-200">
            <p className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="shrink-0 font-bold text-white">📱 手機瀏覽：</span>
              <span>手機瀏覽且已安裝 LINE 時，送出後會複製諮詢內容並嘗試開啟 LINE，您可直接貼上傳送。</span>
            </p>
            <p className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="shrink-0 font-bold text-white">💻 電腦瀏覽：</span>
              <span>電腦瀏覽時，送出後會在本頁顯示本機 QR。掃描只會帶入詢價編號，表單完整內容不會上傳或編進 QR；請在手機 LINE 確認後送出，再補充需求或照片。</span>
            </p>
          </div>
          <div className="pt-3 text-center md:hidden border-t border-slate-900">
            <span className="text-sm sm:text-base text-slate-300 font-semibold">※ 提示：建議使用手機瀏覽本站以獲得最順暢的 LINE 諮詢體驗。</span>
          </div>
          {/* 電腦瀏覽時的按鈕 */}
          <div
            className="hidden md:flex flex-col items-center gap-3 pt-4 border-t border-slate-900"
            data-line-desktop-state="DESKTOP_QR_HANDOFF_READY_LINE1B2B"
          >
            <span className="text-sm sm:text-base font-bold text-slate-200">電腦瀏覽加 LINE：</span>
            <div className="flex gap-4 items-center">
              <CTAButton
                href={siteConfig.lineUrl}
                external
                trackEventName="line_click"
                trackParams={{ cta_position: "contact_form_desktop_helper" }}
                dataLineStage="DESKTOP_QR_HANDOFF_LINE1B2B"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-green-700 hover:bg-green-600 text-white text-base sm:text-lg font-bold rounded-xl min-h-[56px] transition-colors shadow"
              >
                使用手機 LINE 掃描
              </CTAButton>
              <span className="text-sm text-slate-300">
                （LINE 官方帳號 ID: <strong className="text-white font-bold">@451vpomq</strong>，加好友後貼上諮詢內容傳送）
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
