"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { LINE_PROFILE_URL, type LineDesktopQrHandoff } from "@/lib/line-contact";

interface LineDesktopQrDialogProps {
  handoff: LineDesktopQrHandoff;
  onClose: () => void;
}

type CopyState = "idle" | "copied" | "failed";

const copyText = async (value: string): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the browser's local copy command.
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.cssText =
      "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

export default function LineDesktopQrDialog({
  handoff,
  onClose,
}: LineDesktopQrDialogProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    const copied = await copyText(handoff.message);
    setCopyState(copied ? "copied" : "failed");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
      data-line-qr-dialog="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="line-desktop-qr-title"
        aria-describedby="line-desktop-qr-description"
        className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center text-white shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 text-left">
          <div>
            <h2 id="line-desktop-qr-title" className="text-2xl font-bold">
              使用手機 LINE 掃描
            </h2>
            <p
              id="line-desktop-qr-description"
              className="mt-2 text-sm leading-6 text-slate-300"
            >
              掃描後 LINE 訊息會帶入此詢價編號，請確認後按送出。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="關閉 LINE QR 視窗"
            className="shrink-0 rounded-lg border border-slate-600 px-3 py-2 text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
          >
            關閉
          </button>
        </div>

        <div
          className="mx-auto inline-flex rounded-2xl bg-white p-4"
          data-line-qr-value={handoff.oaMessageUrl}
        >
          <QRCodeSVG
            value={handoff.oaMessageUrl}
            size={240}
            level="M"
            marginSize={4}
            title="LINE 官方帳號詢價訊息 QR code"
          />
        </div>

        <p className="mt-5 text-lg font-semibold text-orange-300">
          詢價編號：{handoff.leadToken}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          QR 只帶入固定詢問文案與詢價編號。表單完整內容沒有上傳追蹤伺服器，
          也沒有編進 QR；掃描後可先送出編號，再於 LINE 補充需求或照片。
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-slate-600 px-4 py-3 font-semibold text-slate-100 transition-colors hover:border-slate-400"
          >
            {copyState === "copied"
              ? "已複製短訊息"
              : copyState === "failed"
                ? "複製失敗，請手動記下編號"
                : "複製短訊息"}
          </button>
          <a
            href={LINE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-500"
          >
            直接開啟 LINE 官方帳號
          </a>
        </div>
      </div>
    </div>
  );
}
