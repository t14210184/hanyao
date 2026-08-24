import type { D1Database } from "@cloudflare/workers-types";
import type { AttributionSessionRow } from "./attribution";

export const LEAD_TOKEN_PREFIX = "HY-";
export const LEAD_TOKEN_LENGTH = 10;
export const LEAD_TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789_";
export const LEAD_TOKEN_MAX_ATTEMPTS = 3;

export const LEAD_CHANNELS = ["line", "phone", "form"] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];

export interface LeadTokenRequest {
  request_id: string;
  session_id: string | null;
  channel: LeadChannel;
}

export interface LeadTokenRow {
  lead_token: string;
  request_id: string;
  session_id: string | null;
  channel: LeadChannel;
  status: string;
  server_created_at: string;
}

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  code: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isLeadChannel = (value: unknown): value is LeadChannel =>
  typeof value === "string" && LEAD_CHANNELS.includes(value as LeadChannel);

export const validateLeadTokenRequest = (
  value: unknown
): ValidationResult<LeadTokenRequest> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, code: "INVALID_PAYLOAD" };
  }

  const payload = value as Record<string, unknown>;
  const allowedKeys = ["request_id", "session_id", "channel"];
  if (Object.keys(payload).some((key) => !allowedKeys.includes(key))) {
    return { ok: false, code: "UNSUPPORTED_FIELD" };
  }

  if (
    typeof payload.request_id !== "string" ||
    !UUID_PATTERN.test(payload.request_id)
  ) {
    return { ok: false, code: "INVALID_REQUEST_ID" };
  }

  if (
    payload.session_id !== null &&
    (typeof payload.session_id !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(payload.session_id))
  ) {
    return { ok: false, code: "INVALID_SESSION_ID" };
  }

  if (!isLeadChannel(payload.channel)) {
    return { ok: false, code: "INVALID_CHANNEL" };
  }

  return {
    ok: true,
    value: {
      request_id: payload.request_id,
      session_id: payload.session_id as string | null,
      channel: payload.channel,
    },
  };
};

export const generateLeadToken = (
  randomSource: Pick<Crypto, "getRandomValues"> = crypto
): string => {
  const bytes = new Uint8Array(LEAD_TOKEN_LENGTH);
  randomSource.getRandomValues(bytes);
  const characters = Array.from(
    bytes,
    (byte) => LEAD_TOKEN_ALPHABET[byte & (LEAD_TOKEN_ALPHABET.length - 1)]
  ).join("");
  return `${LEAD_TOKEN_PREFIX}${characters}`;
};

export class SessionNotFoundError extends Error {
  constructor() {
    super("SESSION_NOT_FOUND");
    this.name = "SessionNotFoundError";
  }
}

export class LeadTokenIssuanceError extends Error {
  constructor() {
    super("LEAD_TOKEN_ISSUANCE_FAILED");
    this.name = "LeadTokenIssuanceError";
  }
}

export const issueLeadToken = async (
  database: D1Database,
  request: LeadTokenRequest,
  now = new Date(),
  randomSource: Pick<Crypto, "getRandomValues"> = crypto
): Promise<LeadTokenRow> => {
  const existing = await database
    .prepare(
      "SELECT lead_token, request_id, session_id, channel, status, server_created_at FROM lead_tokens WHERE request_id = ?1"
    )
    .bind(request.request_id)
    .first<LeadTokenRow>();
  if (existing) return existing;

  if (request.session_id !== null) {
    const session = await database
      .prepare("SELECT session_id FROM attribution_sessions WHERE session_id = ?1")
      .bind(request.session_id)
      .first<Pick<AttributionSessionRow, "session_id">>();
    if (!session) throw new SessionNotFoundError();
  }

  const serverCreatedAt = now.toISOString();
  for (let attempt = 0; attempt < LEAD_TOKEN_MAX_ATTEMPTS; attempt += 1) {
    const leadToken = generateLeadToken(randomSource);
    try {
      await database
        .prepare(
          `INSERT INTO lead_tokens (
            lead_token, request_id, session_id, channel, status, server_created_at
          ) VALUES (?1, ?2, ?3, ?4, 'issued', ?5)`
        )
        .bind(
          leadToken,
          request.request_id,
          request.session_id,
          request.channel,
          serverCreatedAt
        )
        .run();

      const inserted = await database
        .prepare(
          "SELECT lead_token, request_id, session_id, channel, status, server_created_at FROM lead_tokens WHERE lead_token = ?1"
        )
        .bind(leadToken)
        .first<LeadTokenRow>();
      if (!inserted) throw new LeadTokenIssuanceError();
      return inserted;
    } catch {
      const retried = await database
        .prepare(
          "SELECT lead_token, request_id, session_id, channel, status, server_created_at FROM lead_tokens WHERE request_id = ?1"
        )
        .bind(request.request_id)
        .first<LeadTokenRow>();
      if (retried) return retried;
    }
  }

  throw new LeadTokenIssuanceError();
};
