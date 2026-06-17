/**
 * Safe client-side tracking helper using GTM dataLayer
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window === "undefined") return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    // Ensure dataLayer array exists
    win.dataLayer = win.dataLayer || [];
    
    // Push event to GTM dataLayer
    win.dataLayer.push({
      event: eventName,
      ...params,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[Tracking Event] ${eventName}:`, params);
  } catch (err) {
    console.error("Tracking error:", err);
  }
};
