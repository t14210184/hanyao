"use client";

import { loadAttribution, type AttributionV1 } from "./attribution.ts";

export const LINE_PREPARE_ENDPOINT = "/api/line/prepare";
export const LINE_PROFILE_URL = "https://line.me/R/ti/p/@451vpomq";
export const LINE_OA_MESSAGE_BASE_URL =
  "https://line.me/R/oaMessage/%40451vpomq/?";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEAD_TOKEN_PATTERN = /^HY-[A-Z2-9_]{10}$/;
const DEFAULT_PREPARE_TIMEOUT_MS = 2800;
const MAX_PREPARE_ATTEMPTS = 2;

export interface LinePreparePayload {
  request_id: string;
  attribution: AttributionV1 | null;
}

export interface PreparedLineLead {
  status: "prepared";
  lead_token: string;
}

export interface PrepareLineLeadOptions {
  requestId?: string;
  attribution?: AttributionV1 | null;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const isUuidV4 = (value: unknown): value is string =>
  typeof value === "string" && UUID_V4_PATTERN.test(value);

const isLeadToken = (value: unknown): value is string =>
  typeof value === "string" && LEAD_TOKEN_PATTERN.test(value);

const randomUuidV4 = (): string => {
  const cryptoSource =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  try {
    if (cryptoSource && typeof cryptoSource.randomUUID === "function") {
      const randomUuid = cryptoSource.randomUUID();
      if (isUuidV4(randomUuid)) return randomUuid;
    }
  } catch {
    // Fall through to getRandomValues or the format-preserving fallback.
  }

  const bytes = new Uint8Array(16);
  try {
    if (cryptoSource && typeof cryptoSource.getRandomValues === "function") {
      cryptoSource.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
  } catch {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

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
};

/** Create a new browser intent identifier. Retries must reuse this value. */
export const createLinePrepareRequestId = (): string => randomUuidV4();

/** Read the C1A record without writing storage or emitting analytics. */
export const getLineAttributionSnapshot = (): AttributionV1 | null =>
  loadAttribution();

export const isMobileLineClient = (
  navigatorSource?: Pick<Navigator, "userAgent" | "maxTouchPoints">
): boolean => {
  const source =
    navigatorSource ??
    (typeof navigator !== "undefined" ? navigator : undefined);
  if (!source) return false;

  const userAgent = source.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent)) return true;

  // iPadOS desktop mode reports Macintosh, but keeps touch points.
  return /Macintosh/i.test(userAgent) && source.maxTouchPoints > 1;
};

export const isOfficialLineProfileUrl = (href: string | undefined): boolean => {
  if (!href) return false;

  try {
    const url = new URL(href);
    const path = url.pathname.replace(/\/+$/, "");
    return (
      url.hostname.toLowerCase() === "line.me" &&
      path === "/R/ti/p/@451vpomq"
    );
  } catch {
    return false;
  }
};

/** Build LINE's official mobile message URL without a custom-scheme redirect. */
export const buildLineOaMessageUrl = (message: string): string =>
  `${LINE_OA_MESSAGE_BASE_URL}${encodeURIComponent(message)}`;

/** Generic CTA text contains only a server-issued lead token and fixed copy. */
export const buildGenericLineMessage = (
  leadToken: string | null | undefined
): string | null => {
  if (!isLeadToken(leadToken)) return null;

  return [
    "您好，我想透過網站諮詢焓耀空調工程。",
    `【詢價編號】${leadToken}`,
    "請協助回覆，謝謝。",
  ].join("\n");
};

export interface LineDesktopQrHandoff {
  leadToken: string;
  message: string;
  oaMessageUrl: string;
}

/** Build the minimal cross-device payload used by every desktop LINE intent. */
export const buildDesktopLineQrHandoff = (
  leadToken: string | null | undefined
): LineDesktopQrHandoff | null => {
  const message = buildGenericLineMessage(leadToken);
  if (!message || !isLeadToken(leadToken)) return null;

  return {
    leadToken,
    message,
    oaMessageUrl: buildLineOaMessageUrl(message),
  };
};

const isRetryableStatus = (status: number): boolean =>
  status === 408 || status === 429 || status >= 500;

/**
 * Prepare one LINE intent. The exact JSON body is reused for the one optional
 * retry, so request ID and attribution cannot drift between attempts.
 */
export const prepareLineLead = async (
  options: PrepareLineLeadOptions = {}
): Promise<PreparedLineLead | null> => {
  const requestId = options.requestId ?? createLinePrepareRequestId();
  if (!isUuidV4(requestId)) return null;

  const attribution =
    options.attribution === undefined
      ? getLineAttributionSnapshot()
      : options.attribution;
  const payload: LinePreparePayload = {
    request_id: requestId,
    attribution: attribution ?? null,
  };
  const body = JSON.stringify(payload);
  const endpoint = options.endpoint ?? LINE_PREPARE_ENDPOINT;
  const configuredTimeout = options.timeoutMs ?? DEFAULT_PREPARE_TIMEOUT_MS;
  const totalTimeoutMs = Math.min(Math.max(1, configuredTimeout), 3000);
  const deadline = Date.now() + totalTimeoutMs;
  const fetchImpl =
    options.fetchImpl ??
    (typeof globalThis !== "undefined" && typeof globalThis.fetch === "function"
      ? globalThis.fetch.bind(globalThis)
      : null);

  if (!fetchImpl) return null;

  for (let attempt = 0; attempt < MAX_PREPARE_ATTEMPTS; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;

    try {
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      const result = await (async () => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller?.abort();
              reject(new Error("LINE_PREPARE_TIMEOUT"));
            }, remaining);
          });
          const request = fetchImpl(endpoint, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body,
            signal: controller?.signal,
          }).then(async (response) => {
            if (!response.ok) return { response, value: null as unknown };
            try {
              return { response, value: await response.json() };
            } catch {
              return { response, value: null as unknown };
            }
          });
          return await Promise.race([request, timeout]);
        } finally {
          if (timer) clearTimeout(timer);
          controller?.abort();
        }
      })();
      if (!result.response.ok) {
        if (attempt === 0 && isRetryableStatus(result.response.status)) continue;
        return null;
      }

      const value = result.value;
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const record = value as Record<string, unknown>;
      if (
        Object.keys(record).length !== 2 ||
        record.status !== "prepared" ||
        !isLeadToken(record.lead_token)
      ) {
        return null;
      }

      return {
        status: "prepared",
        lead_token: record.lead_token,
      };
    } catch {
      if (attempt === 0) continue;
      return null;
    }
  }

  return null;
};
