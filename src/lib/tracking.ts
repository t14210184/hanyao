/**
 * Safe client-side GTM dataLayer tracking helper.
 * Only runs in the browser; no-op on the server (SSR / Static Export).
 */

// 30 秒防重複觸發機制
const DEDUPE_WINDOW_MS = 30000; // 30 seconds
const memoryDedupe = new Map<string, number>();

const checkAndSetDedupe = (key: string, eventName: string): boolean => {
  if (typeof window === "undefined") return true;

  const now = Date.now();
  const isBlocked = (lastTime: number | null): boolean => {
    if (lastTime !== null && now - lastTime < DEDUPE_WINDOW_MS) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Dedupe Blocked] ${eventName} was sent less than 30s ago.`);
      }
      return false;
    }
    return true;
  };

  try {
    const lastTimeStr = window.sessionStorage?.getItem(key);
    const lastTime = lastTimeStr ? Number.parseInt(lastTimeStr, 10) : null;
    if (!isBlocked(lastTime !== null && !Number.isNaN(lastTime) ? lastTime : null)) {
      return false;
    }
    try {
      window.sessionStorage?.setItem(key, now.toString());
    } catch {
      const memoryLastTime = memoryDedupe.get(key) ?? null;
      if (!isBlocked(memoryLastTime)) return false;
    }
    memoryDedupe.set(key, now);
    return true;
  } catch {
    const memoryLastTime = memoryDedupe.get(key) ?? null;
    if (!isBlocked(memoryLastTime)) return false;
    memoryDedupe.set(key, now);
    return true;
  }
};

// 2. pushSafeDataLayerEvent
// 安全發送 dataLayer event，確保無敏感個資洩漏
export const pushSafeDataLayerEvent = (
  eventName: string,
  payload: Record<string, unknown>
) => {
  if (typeof window === "undefined") return;

  try {
    const win = window as Window & {
      dataLayer?: Array<Record<string, unknown>>;
    };

    win.dataLayer = win.dataLayer || [];

    // dataLayer 只允許送 lead_id、contact_channel、contact_method、page_path、event_source、timestamp 這類非敏感資料。
    const safePayload: Record<string, unknown> = {
      event: eventName,
      contact_channel: payload.contact_channel,
      contact_method: payload.contact_method,
      page_path: payload.page_path || window.location.pathname,
      event_source: payload.event_source || "unknown",
      timestamp: Date.now(),
    };

    if (payload.lead_id !== undefined) {
      safePayload.lead_id = payload.lead_id;
    }

    win.dataLayer.push(safePayload);

    if (process.env.NODE_ENV === "development") {
      console.log(`[GTM dataLayer Push] ${eventName}:`, safePayload);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("GTM pushSafeDataLayerEvent error:", err);
    }
  }
};

// 3. trackLineContactAttempt
export interface LineContactOptions {
  contact_method: "line_link_open" | "form_copy_open_line";
  lead_id?: string;
  event_source?:
    | "header_cta"
    | "sticky_cta"
    | "hero_cta"
    | "service_page"
    | "footer_cta"
    | "contact_page"
    | "contact_form"
    | "unknown";
  page_path?: string;
}

export const trackLineContactAttempt = (options: LineContactOptions) => {
  const allowedSources = [
    "header_cta",
    "sticky_cta",
    "hero_cta",
    "service_page",
    "footer_cta",
    "contact_page",
    "contact_form",
    "unknown"
  ];
  const event_source = allowedSources.includes(options.event_source || "")
    ? options.event_source
    : "unknown";

  // Use separate dedupe keys for link opens and form submissions to prevent cross-blocking
  const dedupeKey = options.contact_method === "form_copy_open_line"
    ? "hy_tracking_last_form_copy_open_line"
    : "hy_tracking_last_line_link_open";

  // Dedupe logic
  if (!checkAndSetDedupe(dedupeKey, `line_contact_attempt (${options.contact_method})`)) {
    return;
  }

  pushSafeDataLayerEvent("line_contact_attempt", {
    contact_channel: "line",
    contact_method: options.contact_method,
    lead_id: options.lead_id,
    page_path: options.page_path,
    event_source: event_source,
  });
};

// 4. trackPhoneClickAttempt
export interface PhoneClickOptions {
  event_source?:
    | "header_cta"
    | "sticky_cta"
    | "hero_cta"
    | "service_page"
    | "footer_cta"
    | "contact_page"
    | "contact_form"
    | "unknown";
  page_path?: string;
}

export const trackPhoneClickAttempt = (options: PhoneClickOptions) => {
  const allowedSources = [
    "header_cta",
    "sticky_cta",
    "hero_cta",
    "service_page",
    "footer_cta",
    "contact_page",
    "contact_form",
    "unknown"
  ];
  const event_source = allowedSources.includes(options.event_source || "")
    ? options.event_source
    : "unknown";

  // Dedupe logic
  if (!checkAndSetDedupe("hy_tracking_last_phone_click_attempt", "phone_click_attempt")) {
    return;
  }

  pushSafeDataLayerEvent("phone_click_attempt", {
    contact_channel: "phone",
    contact_method: "tel_click",
    page_path: options.page_path,
    event_source: event_source,
  });
};

// 舊事件相容與對應層，以防 GA4 舊報表斷裂，但防止重複送 Google Ads
const ALLOWED_LEGACY_EVENTS = ["form_start", "form_error", "sticky_cta_scroll"];

export const trackEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window === "undefined") return;

  const resolveSource = (pos?: unknown): "header_cta" | "sticky_cta" | "hero_cta" | "service_page" | "footer_cta" | "contact_page" | "contact_form" | "unknown" => {
    if (!pos || typeof pos !== "string") return "unknown";
    const p = pos.toLowerCase();
    if (p.includes("header")) return "header_cta";
    if (p.includes("sticky") || p.includes("bar")) return "sticky_cta";
    if (p.includes("hero")) return "hero_cta";
    if (p.includes("form") || p.includes("quote")) return "contact_form"; // 這裡其實是表單複製
    if (p.includes("footer")) return "footer_cta";
    if (p.includes("contact")) return "contact_page";
    if (
      p.includes("service") ||
      p.includes("guide") ||
      p.includes("area") ||
      p.includes("cases") ||
      p.includes("faq")
    ) {
      return "service_page";
    }
    return "unknown";
  };

  // 當舊程式碼調用 line_click / line_open_attempt 時，自動轉發至 trackLineContactAttempt
  if (eventName === "line_click" || eventName === "line_open_attempt") {
    const pos = params.cta_position || params.cta_location || params.form_location;
    trackLineContactAttempt({
      contact_method: "line_link_open",
      event_source: resolveSource(pos),
    });
  } 
  // 當舊程式碼調用 phone_click 時，自動轉發至 trackPhoneClickAttempt
  else if (eventName === "phone_click") {
    const pos = params.cta_position || params.cta_location;
    trackPhoneClickAttempt({
      event_source: resolveSource(pos),
    });
  } 
  // 舊事件 line_quote_copy 將由表單自行觸發新事件，在此忽略以防重複計算
  else if (eventName === "line_quote_copy") {
    if (process.env.NODE_ENV === "development") {
      console.log("[Legacy Event line_quote_copy ignored in favor of line_contact_attempt]");
    }
  } 
  // 其他分析事件（form_start, form_error, sticky_cta_scroll）維持舊 dataLayer 管道以防斷裂
  else if (ALLOWED_LEGACY_EVENTS.includes(eventName)) {
    try {
      const win = window as Window & {
        dataLayer?: Array<Record<string, unknown>>;
      };
      win.dataLayer = win.dataLayer || [];
      win.dataLayer.push({
        event: eventName,
        page_path: window.location.pathname,
        ...params,
      });
    } catch {
      // safe fallback
    }
  }
};
