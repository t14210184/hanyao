/**
 * Safe client-side GTM dataLayer tracking helper.
 * Only runs in the browser; no-op on the server (SSR / Static Export).
 */
const ALLOWED_EVENTS = [
  "phone_click",
  "line_click",
  "line_quote_copy",
  "line_open_attempt",
  "form_start",
  "form_error",
  "sticky_cta_scroll"
];

export const trackEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window === "undefined") return;

  if (!ALLOWED_EVENTS.includes(eventName)) {
    return;
  }

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

    if (process.env.NODE_ENV === "development") {
      console.log(`[GTM dataLayer Push] ${eventName}:`, params);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("GTM trackEvent error:", err);
    }
  }
};
