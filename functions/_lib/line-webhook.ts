import type { D1Database } from "@cloudflare/workers-types";
import {
  selectGoogleAdsAttribution,
  type AttributionSessionRow,
  type GoogleAdsAttributionSelection,
} from "./attribution.ts";
import { extractLeadTokens } from "./lead-token.ts";

export const MAX_LINE_WEBHOOK_BODY_BYTES = 128 * 1024;

export interface RawBodySuccess {
  ok: true;
  bytes: Uint8Array;
}

export interface RawBodyFailure {
  ok: false;
  code: "PAYLOAD_TOO_LARGE" | "BODY_READ_FAILED";
  status: 400 | 413;
}

export type RawBodyResult = RawBodySuccess | RawBodyFailure;

export const readRawRequestBody = async (
  request: Request,
  maxBytes = MAX_LINE_WEBHOOK_BODY_BYTES
): Promise<RawBodyResult> => {
  const contentLengthHeader = request.headers.get("Content-Length");
  const contentLength = contentLengthHeader
    ? Number(contentLengthHeader)
    : Number.NaN;

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, code: "PAYLOAD_TOO_LARGE", status: 413 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: true, bytes: new Uint8Array() };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      const chunk = result.value;
      if (!chunk) continue;
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, code: "PAYLOAD_TOO_LARGE", status: 413 };
      }
      chunks.push(chunk);
    }
  } catch {
    return { ok: false, code: "BODY_READ_FAILED", status: 400 };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
};

const decodeBase64 = (value: string): Uint8Array | null => {
  try {
    const decoded = atob(value);
    const bytes = new Uint8Array(decoded.length);
    for (let index = 0; index < decoded.length; index += 1) {
      bytes[index] = decoded.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
};

export const verifyLineSignature = async (
  rawBody: Uint8Array,
  signature: string | null,
  channelSecret: string
): Promise<boolean> => {
  if (!signature || !channelSecret) return false;
  const signatureBytes = decodeBase64(signature);
  if (!signatureBytes) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(channelSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signatureData = signatureBytes.buffer.slice(
      signatureBytes.byteOffset,
      signatureBytes.byteOffset + signatureBytes.byteLength
    ) as ArrayBuffer;
    const bodyData = rawBody.buffer.slice(
      rawBody.byteOffset,
      rawBody.byteOffset + rawBody.byteLength
    ) as ArrayBuffer;
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureData,
      bodyData
    );
  } catch {
    return false;
  }
};

export interface ParsedLineEvent {
  webhookEventId: string;
  eventType: string;
  messageType: string | null;
  messageId: string | null;
  messageText: string | null;
  lineEventTimestamp: string;
}

export interface ParsedLineWebhookPayload {
  events: ParsedLineEvent[];
}

interface ParseSuccess {
  ok: true;
  value: ParsedLineWebhookPayload;
}

interface ParseFailure {
  ok: false;
  code: "INVALID_WEBHOOK_PAYLOAD";
}

export type ParseResult = ParseSuccess | ParseFailure;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const boundedString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.length <= maxLength ? value : null;
};

const parseLineTimestamp = (value: unknown): string | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

export const parseLineWebhookPayload = (rawBody: Uint8Array): ParseResult => {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
  }

  if (!isRecord(value) || !Array.isArray(value.events)) {
    return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
  }

  const events: ParsedLineEvent[] = [];
  for (const rawEvent of value.events) {
    if (!isRecord(rawEvent)) {
      return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
    }
    const webhookEventId = boundedString(rawEvent.webhookEventId, 256);
    const eventType = boundedString(rawEvent.type, 64);
    const lineEventTimestamp = parseLineTimestamp(rawEvent.timestamp);
    if (!webhookEventId || !eventType || !lineEventTimestamp) {
      return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
    }

    let messageType: string | null = null;
    let messageId: string | null = null;
    let messageText: string | null = null;
    if ("message" in rawEvent) {
      if (!isRecord(rawEvent.message)) {
        return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
      }
      messageType = boundedString(rawEvent.message.type, 64);
      if (!messageType) {
        return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
      }
      if (rawEvent.message.id !== undefined) {
        messageId = boundedString(rawEvent.message.id, 256);
        if (!messageId) {
          return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
        }
      }
      if (eventType === "message" && messageType === "text") {
        if (typeof rawEvent.message.text !== "string") {
          return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
        }
        messageText = rawEvent.message.text;
      }
    } else if (eventType === "message") {
      return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
    }

    events.push({
      webhookEventId,
      eventType,
      messageType,
      messageId,
      messageText,
      lineEventTimestamp,
    });
  }

  return { ok: true, value: { events } };
};

export type LineMatchStatus =
  | "MATCHED_ADS"
  | "MATCHED_UNATTRIBUTED"
  | "UNMATCHED"
  | "WRONG_CHANNEL"
  | "AMBIGUOUS"
  | "IGNORED_NON_TEXT";

export type LineWebhookOutcome = "accepted" | "duplicate" | "ignored";

interface LineMatchDecision {
  matchStatus: LineMatchStatus;
  recordEventType: string;
  leadToken: string | null;
  attribution: GoogleAdsAttributionSelection | null;
}

interface LeadTokenLookupRow {
  lead_token: string;
  session_id: string | null;
  channel: "line" | "phone" | "form";
  status: string;
}

const unattributedDecision = (
  matchStatus: "UNMATCHED" | "AMBIGUOUS"
): LineMatchDecision => ({
  matchStatus,
  recordEventType: "line_message_received_unattributed",
  leadToken: null,
  attribution: null,
});

const classifyTextMessage = async (
  database: D1Database,
  text: string,
  now: Date
): Promise<LineMatchDecision> => {
  const tokens = extractLeadTokens(text);
  if (tokens.length === 0) return unattributedDecision("UNMATCHED");
  if (tokens.length > 1) return unattributedDecision("AMBIGUOUS");

  const leadToken = tokens[0];
  const lead = await database
    .prepare(
      "SELECT lead_token, session_id, channel, status FROM lead_tokens WHERE lead_token = ?1"
    )
    .bind(leadToken)
    .first<LeadTokenLookupRow>();
  if (!lead) return unattributedDecision("UNMATCHED");
  if (lead.channel !== "line") {
    return {
      matchStatus: "WRONG_CHANNEL",
      recordEventType: "line_message_received_unattributed",
      leadToken,
      attribution: null,
    };
  }
  if (!lead.session_id) {
    return {
      matchStatus: "MATCHED_UNATTRIBUTED",
      recordEventType: "line_message_received",
      leadToken,
      attribution: null,
    };
  }

  const session = await database
    .prepare("SELECT * FROM attribution_sessions WHERE session_id = ?1")
    .bind(lead.session_id)
    .first<AttributionSessionRow>();
  if (!session || Date.parse(session.expires_at) <= now.getTime()) {
    return {
      matchStatus: "MATCHED_UNATTRIBUTED",
      recordEventType: "line_message_received",
      leadToken,
      attribution: null,
    };
  }

  const attribution = selectGoogleAdsAttribution(session);
  if (!attribution) {
    return {
      matchStatus: "MATCHED_UNATTRIBUTED",
      recordEventType: "line_message_received",
      leadToken,
      attribution: null,
    };
  }

  return {
    matchStatus: "MATCHED_ADS",
    recordEventType: "line_message_received",
    leadToken,
    attribution,
  };
};

export const processLineWebhookEvent = async (
  database: D1Database,
  event: ParsedLineEvent,
  now = new Date()
): Promise<LineWebhookOutcome> => {
  const isTextMessage =
    event.eventType === "message" &&
    event.messageType === "text" &&
    event.messageText !== null;
  const decision = isTextMessage
    ? await classifyTextMessage(database, event.messageText as string, now)
    : {
        matchStatus: "IGNORED_NON_TEXT" as const,
        recordEventType: event.eventType,
        leadToken: null,
        attribution: null,
      };
  const receivedAt = now.toISOString();
  const statements = [
    database
      .prepare(
        "INSERT OR IGNORE INTO line_events (line_event_id, webhook_event_id, message_id, lead_token, event_type, match_status, line_event_timestamp, received_at, created_at, line_user_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL)"
      )
      .bind(
        crypto.randomUUID(),
        event.webhookEventId,
        event.messageId,
        decision.leadToken,
        decision.recordEventType,
        decision.matchStatus,
        event.lineEventTimestamp,
        receivedAt,
        receivedAt
      ),
  ];

  if (decision.matchStatus === "MATCHED_ADS" && decision.attribution) {
    statements.push(
      database
        .prepare(
          "INSERT OR IGNORE INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid, wbraid, attribution_touch, transaction_id, destination_key, status, retry_count, next_retry_at, last_error_code, created_at, sent_at) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16 WHERE changes() = 1"
        )
        .bind(
          crypto.randomUUID(),
          decision.leadToken,
          "verified_line_contact",
          event.lineEventTimestamp,
          decision.attribution.gclid,
          decision.attribution.gbraid,
          decision.attribution.wbraid,
          decision.attribution.attribution_touch,
          crypto.randomUUID(),
          "HY_VERIFIED_LINE_CONTACT",
          "pending",
          0,
          null,
          null,
          receivedAt,
          null
        ),
      database
        .prepare(
          "UPDATE lead_tokens SET status = 'received' WHERE lead_token = ?1 AND status = 'issued'"
        )
        .bind(decision.leadToken)
    );
  }

  const results = await database.batch(statements);
  const eventInserted = Number(results[0]?.meta?.changes ?? 0) > 0;
  if (!eventInserted) return "duplicate";
  return decision.matchStatus === "MATCHED_ADS" ? "accepted" : "ignored";
};
