import type { AttributionV1 } from "./attribution";

export const ATTRIBUTION_SESSION_ENDPOINT = "/api/attribution/v1/session";
export const LEAD_TOKEN_ENDPOINT = "/api/attribution/v1/lead-token";

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type LeadChannel = "line" | "phone" | "form";

export interface ServerAttributionPayload {
  schema_version: 1;
  session_id: string;
  stored_at: string;
  first_touch: AttributionV1["first_touch"];
  last_touch: AttributionV1["last_touch"];
}

export interface ServerSyncResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown> | null;
}

export interface LeadTokenResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown> | null;
}

const resolveFetch = (fetcher?: FetchLike): FetchLike | null => {
  if (fetcher) return fetcher;
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return null;
  }
  return window.fetch.bind(window);
};

const readJsonResponse = async (
  response: Response
): Promise<Record<string, unknown> | null> => {
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};
/** Build a strict allowlisted payload; no arbitrary client object is serialized. */
export const buildServerAttributionPayload = (
  record: AttributionV1
): ServerAttributionPayload => ({
  schema_version: 1,
  session_id: record.session_id,
  stored_at: record.stored_at,
  first_touch: { ...record.first_touch },
  last_touch: { ...record.last_touch },
});

/**
 * Optional C1B1 sync helper. It is intentionally not called by the C1A
 * bootstrap while consent integration is pending.
 */
export const syncAttributionToServer = async (
  record: AttributionV1,
  fetcher?: FetchLike
): Promise<ServerSyncResult> => {
  const requestFetch = resolveFetch(fetcher);
  if (!requestFetch) return { ok: false, status: 0, body: null };

  try {
    const response = await requestFetch(ATTRIBUTION_SESSION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildServerAttributionPayload(record)),
    });
    return {
      ok: response.ok,
      status: response.status,
      body: await readJsonResponse(response),
    };
  } catch {
    return { ok: false, status: 0, body: null };
  }
};

export const createLeadRequestId = (): string => {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
    throw new Error("CRYPTO_RANDOM_UUID_UNAVAILABLE");
  }
  return crypto.randomUUID();
};

export const issueLeadToken = async (
  channel: LeadChannel,
  sessionId: string | null,
  requestId = createLeadRequestId(),
  fetcher?: FetchLike
): Promise<LeadTokenResult> => {
  const requestFetch = resolveFetch(fetcher);
  if (!requestFetch) return { ok: false, status: 0, body: null };

  try {
    const response = await requestFetch(LEAD_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        session_id: sessionId,
        channel,
      }),
    });
    return {
      ok: response.ok,
      status: response.status,
      body: await readJsonResponse(response),
    };
  } catch {
    return { ok: false, status: 0, body: null };
  }
};
