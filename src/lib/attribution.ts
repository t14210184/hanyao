/**
 * Browser-only Google Ads attribution persistence.
 *
 * This module stores only anonymous ad-source context. It deliberately does
 * not emit analytics or conversion events and does not create cookies.
 */

export const ATTRIBUTION_SCHEMA_VERSION = 1 as const;
export const ATTRIBUTION_STORAGE_KEY = "hy_attribution_v1";
export const ATTRIBUTION_RETENTION_DAYS = 90;

const TOUCH_FIELDS = [
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_id",
  "utm_term",
  "utm_content",
] as const;

export interface AttributionTouch {
  captured_at: string | null;
  landing_url: string | null;
  referrer: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_id: string | null;
  utm_term: string | null;
  utm_content: string | null;
}

export interface AttributionV1 {
  schema_version: typeof ATTRIBUTION_SCHEMA_VERSION;
  session_id: string;
  stored_at: string;
  first_touch: AttributionTouch;
  last_touch: AttributionTouch;
}

export interface AttributionCaptureOptions {
  url?: string;
  referrer?: string | null;
  now?: Date;
  storage?: Storage | null;
  crypto?: Pick<Crypto, "getRandomValues"> &
    Partial<Pick<Crypto, "randomUUID">>;
  retentionDays?: number;
}

const emptyTouch = (): AttributionTouch => ({
  captured_at: null,
  landing_url: null,
  referrer: null,
  gclid: null,
  gbraid: null,
  wbraid: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_id: null,
  utm_term: null,
  utm_content: null,
});

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const hasAttributionValue = (touch: AttributionTouch): boolean =>
  TOUCH_FIELDS.some((field) => touch[field] !== null);

const isTouch = (value: unknown): value is AttributionTouch => {
  if (!value || typeof value !== "object") return false;

  const touch = value as Record<string, unknown>;
  if (
    touch.captured_at !== null &&
    typeof touch.captured_at !== "string"
  ) {
    return false;
  }
  if (touch.landing_url !== null && typeof touch.landing_url !== "string") {
    return false;
  }
  if (touch.referrer !== null && typeof touch.referrer !== "string") {
    return false;
  }

  return TOUCH_FIELDS.every(
    (field) => touch[field] === null || typeof touch[field] === "string"
  );
};

const isAttributionV1 = (value: unknown): value is AttributionV1 => {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    record.schema_version === ATTRIBUTION_SCHEMA_VERSION &&
    typeof record.session_id === "string" &&
    record.session_id.length > 0 &&
    typeof record.stored_at === "string" &&
    isTouch(record.first_touch) &&
    isTouch(record.last_touch)
  );
};

/**
 * Purely parse supported attribution parameters from a URL.
 * Returns null when the URL carries no supported attribution value.
 */
export const parseAttributionFromUrl = (
  url: string,
  referrer: string | null = null,
  capturedAt: string | null = null
): AttributionTouch | null => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const touch = emptyTouch();
  touch.captured_at = capturedAt;
  touch.landing_url = normalizeOptionalString(url);
  touch.referrer = normalizeOptionalString(referrer);

  for (const field of TOUCH_FIELDS) {
    touch[field] = normalizeOptionalString(parsedUrl.searchParams.get(field));
  }

  return hasAttributionValue(touch) ? touch : null;
};

const getBrowserStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** Load a validated V1 record without throwing on SSR, bad JSON, or blocked storage. */
export const loadAttribution = (
  storage: Storage | null | undefined = getBrowserStorage()
): AttributionV1 | null => {
  if (!storage) return null;

  try {
    const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isAttributionV1(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** Save only a validated V1 record; returns false when browser storage is unavailable. */
export const saveAttribution = (
  record: AttributionV1,
  storage: Storage | null | undefined = getBrowserStorage()
): boolean => {
  if (!storage || !isAttributionV1(record)) return false;

  try {
    storage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
};

export const isAttributionExpired = (
  record: AttributionV1,
  now: Date = new Date(),
  retentionDays: number = ATTRIBUTION_RETENTION_DAYS
): boolean => {
  const storedAt = Date.parse(record.stored_at);
  if (!Number.isFinite(storedAt)) return true;

  const retentionMs = Math.max(0, retentionDays) * 24 * 60 * 60 * 1000;
  return now.getTime() - storedAt >= retentionMs;
};

const sameAttributionSource = (
  left: AttributionTouch,
  right: AttributionTouch
): boolean => {
  if (left.landing_url !== right.landing_url || left.referrer !== right.referrer) {
    return false;
  }

  return TOUCH_FIELDS.every((field) => left[field] === right[field]);
};

const createSessionId = (
  cryptoSource:
    | (Pick<Crypto, "getRandomValues"> &
        Partial<Pick<Crypto, "randomUUID">>)
    | null
    | undefined
): string | null => {
  if (!cryptoSource) return null;

  try {
    if (typeof cryptoSource.randomUUID === "function") {
      const sessionId = cryptoSource.randomUUID();
      return typeof sessionId === "string" && sessionId.length > 0
        ? sessionId
        : null;
    }

    if (typeof cryptoSource.getRandomValues !== "function") return null;

    const bytes = new Uint8Array(16);
    cryptoSource.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  } catch {
    return null;
  }
};

const createRecord = (
  sessionId: string,
  storedAt: string,
  touch: AttributionTouch | null
): AttributionV1 => {
  const firstTouch = touch ? { ...touch } : emptyTouch();
  const lastTouch = touch ? { ...touch } : emptyTouch();

  return {
    schema_version: ATTRIBUTION_SCHEMA_VERSION,
    session_id: sessionId,
    stored_at: storedAt,
    first_touch: firstTouch,
    last_touch: lastTouch,
  };
};

/**
 * Capture the current page attribution once per meaningful source change.
 * This function never emits dataLayer/gtag events and never throws to callers.
 */
export const captureAttribution = (
  options: AttributionCaptureOptions = {}
): AttributionV1 | null => {
  if (typeof window === "undefined" && !options.url) return null;

  try {
    const now = options.now ?? new Date();
    const storedAt = now.toISOString();
    const url = options.url ?? window.location.href;
    const referrer = options.referrer ?? (
      typeof document !== "undefined" ? document.referrer : null
    );
    const storage = options.storage ?? getBrowserStorage();
    const cryptoSource = options.crypto ?? (
      typeof window !== "undefined" ? window.crypto : null
    );
    const currentTouch = parseAttributionFromUrl(url, referrer, storedAt);
    const existing = loadAttribution(storage);

    if (
      existing &&
      !isAttributionExpired(existing, now, options.retentionDays)
    ) {
      if (!currentTouch) return existing;

      const nextRecord: AttributionV1 = {
        ...existing,
        first_touch: hasAttributionValue(existing.first_touch)
          ? existing.first_touch
          : { ...currentTouch },
        last_touch: sameAttributionSource(existing.last_touch, currentTouch)
          ? existing.last_touch
          : { ...currentTouch },
        stored_at: sameAttributionSource(existing.last_touch, currentTouch)
          ? existing.stored_at
          : storedAt,
      };

      if (
        nextRecord.first_touch !== existing.first_touch ||
        nextRecord.last_touch !== existing.last_touch ||
        nextRecord.stored_at !== existing.stored_at
      ) {
        saveAttribution(nextRecord, storage);
      }
      return nextRecord;
    }

    const sessionId = createSessionId(cryptoSource);
    if (!sessionId) return null;

    const record = createRecord(sessionId, storedAt, currentTouch);
    saveAttribution(record, storage);
    return record;
  } catch {
    return null;
  }
};
