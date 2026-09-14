import type { D1Database } from "@cloudflare/workers-types";
import type { AttributionSessionRow } from "./attribution.ts";
import {
  createLeadAttributionSnapshot,
  type StoredLeadAttributionSnapshot,
} from "./lead-attribution-snapshot.ts";

export const LEAD_TOKEN_PREFIX = "HY-";
export const LEAD_TOKEN_LENGTH = 10;
export const LEAD_TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789_";
export const LEAD_TOKEN_MAX_ATTEMPTS = 3;

export const LEAD_CHANNELS = ["line", "phone", "form"] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];

const escapeRegExp = (value: string): string =>
  value.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

export const extractLeadTokens = (text: string): string[] => {
  const pattern = new RegExp(
    "(?:^|[^A-Za-z0-9_-])(" +
      escapeRegExp(LEAD_TOKEN_PREFIX) +
      "[" +
      LEAD_TOKEN_ALPHABET +
      "]{" +
      LEAD_TOKEN_LENGTH +
      "})(?![A-Za-z0-9_-])",
    "g"
  );
  const tokens = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    if (match[1]) tokens.add(match[1]);
  }
  return [...tokens];
};

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
  attribution_snapshot_json: string | null;
  attribution_snapshot_hash: string | null;
  lineage_rule_version: string | null;
}

const LEAD_TOKEN_SELECT_COLUMNS =
  "lead_token, request_id, session_id, channel, status, server_created_at, " +
  "attribution_snapshot_json, attribution_snapshot_hash, lineage_rule_version";

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  code: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuidV4 = (value: unknown): value is string =>
  typeof value === "string" && UUID_V4_PATTERN.test(value);

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
    !isUuidV4(payload.request_id)
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

export class LeadTokenIdempotencyConflictError extends Error {
  constructor() {
    super("IDEMPOTENCY_CONFLICT");
    this.name = "LeadTokenIdempotencyConflictError";
  }
}

export class LeadTokenIssuanceError extends Error {
  constructor() {
    super("LEAD_TOKEN_ISSUANCE_FAILED");
    this.name = "LeadTokenIssuanceError";
  }
}

export const isLeadTokenIdempotencyMatch = (
  existing: Pick<LeadTokenRow, "session_id" | "channel">,
  request: Pick<LeadTokenRequest, "session_id" | "channel">
): boolean =>
  existing.channel === request.channel && existing.session_id === request.session_id;

export const issueLeadToken = async (
  database: D1Database,
  request: LeadTokenRequest,
  now = new Date(),
  randomSource: Pick<Crypto, "getRandomValues"> = crypto
): Promise<LeadTokenRow> => {
  const existing = await database
    .prepare(`SELECT ${LEAD_TOKEN_SELECT_COLUMNS} FROM lead_tokens WHERE request_id = ?1`)
    .bind(request.request_id)
    .first<LeadTokenRow>();
  if (existing) {
    if (!isLeadTokenIdempotencyMatch(existing, request)) {
      throw new LeadTokenIdempotencyConflictError();
    }
    return existing;
  }

  const serverCreatedAt = now.toISOString();
  for (let attempt = 0; attempt < LEAD_TOKEN_MAX_ATTEMPTS; attempt += 1) {
    let session: AttributionSessionRow | null = null;
    if (request.session_id !== null) {
      session = await database
        .prepare("SELECT * FROM attribution_sessions WHERE session_id = ?1")
        .bind(request.session_id)
        .first<AttributionSessionRow>();
      if (!session) throw new SessionNotFoundError();
    }

    const snapshot: StoredLeadAttributionSnapshot =
      await createLeadAttributionSnapshot(session, serverCreatedAt);
    const leadToken = generateLeadToken(randomSource);
    try {
      let result;
      if (session) {
        result = await database
          .prepare(
            `INSERT INTO lead_tokens (
              lead_token, request_id, session_id, channel, status, server_created_at,
              attribution_snapshot_json, attribution_snapshot_hash, lineage_rule_version
            )
            SELECT ?1, ?2, ?3, ?4, 'issued', ?5, ?6, ?7, ?8
              FROM attribution_sessions
             WHERE session_id = ?3 AND server_updated_at = ?9`
          )
          .bind(
            leadToken,
            request.request_id,
            request.session_id,
            request.channel,
            serverCreatedAt,
            snapshot.json,
            snapshot.hash,
            snapshot.ruleVersion,
            session.server_updated_at
          )
          .run();
        if (Number(result.meta?.changes ?? 0) === 0) continue;
      } else {
        result = await database
          .prepare(
            `INSERT INTO lead_tokens (
              lead_token, request_id, session_id, channel, status, server_created_at,
              attribution_snapshot_json, attribution_snapshot_hash, lineage_rule_version
            ) VALUES (?1, ?2, NULL, ?3, 'issued', ?4, ?5, ?6, ?7)`
          )
          .bind(
            leadToken,
            request.request_id,
            request.channel,
            serverCreatedAt,
            snapshot.json,
            snapshot.hash,
            snapshot.ruleVersion
          )
          .run();
      }

      const inserted = await database
        .prepare(`SELECT ${LEAD_TOKEN_SELECT_COLUMNS} FROM lead_tokens WHERE lead_token = ?1`)
        .bind(leadToken)
        .first<LeadTokenRow>();
      if (!inserted) throw new LeadTokenIssuanceError();
      return inserted;
    } catch {
      const retried = await database
        .prepare(`SELECT ${LEAD_TOKEN_SELECT_COLUMNS} FROM lead_tokens WHERE request_id = ?1`)
        .bind(request.request_id)
        .first<LeadTokenRow>();
      if (retried) {
        if (!isLeadTokenIdempotencyMatch(retried, request)) {
          throw new LeadTokenIdempotencyConflictError();
        }
        return retried;
      }
    }
  }

  throw new LeadTokenIssuanceError();
};
