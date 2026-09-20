import type { D1Database } from "@cloudflare/workers-types";
import type { GoogleAdsAttributionSelection } from "./attribution.ts";
import { extractLeadTokens } from "./lead-token.ts";
import { persistHighIntentShadowSafely } from "./high-intent-shadow.ts";
import {
  readVerifiedLeadAttributionSnapshot,
  type LeadAttributionSnapshot,
} from "./lead-attribution-snapshot.ts";

export const MAX_LINE_WEBHOOK_BODY_BYTES = 128 * 1024;
export const EXPECTED_LINE_DESTINATION = "Ua84119b8b81029fd10868116f1937d13";
export const LINE_IDENTITY_KEY_ID = "v1";
export const BUSINESS_DEDUPE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const GOOGLE_ADS_ACCOUNT_ID = "4801404246";
export const GOOGLE_ADS_CONVERSION_ACTION_ID = "7674301565";
const BUSINESS_DESTINATION_KEY = "HY_VERIFIED_LINE_CONTACT";

const base64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const deriveLineUserKey = async (
  userId: string,
  secret: string
): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(userId)
  );
  return `lu_v1_${base64Url(new Uint8Array(signature))}`;
};

const sha256Hex = async (value: string): Promise<string> => {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

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
  destination: string | null;
  sourceType: string | null;
  sourceUserId: string | null;
  isRedelivery: boolean;
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
  const destination = boundedString(value.destination, 128);

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

    let sourceType: string | null = null;
    let sourceUserId: string | null = null;
    if ("source" in rawEvent) {
      if (!isRecord(rawEvent.source)) return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
      sourceType = boundedString(rawEvent.source.type, 32);
      sourceUserId = boundedString(rawEvent.source.userId, 256);
    }
    let isRedelivery = false;
    if ("deliveryContext" in rawEvent) {
      if (!isRecord(rawEvent.deliveryContext)) return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
      if (typeof rawEvent.deliveryContext.isRedelivery === "boolean") {
        isRedelivery = rawEvent.deliveryContext.isRedelivery;
      }
    }
    let messageType: string | null = null;
    let messageId: string | null = null;
    let messageText: string | null = null;
    if ("message" in rawEvent) {
      if (!isRecord(rawEvent.message)) return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
      messageType = boundedString(rawEvent.message.type, 64);
      if (!messageType) return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
      if (rawEvent.message.id !== undefined) {
        messageId = boundedString(rawEvent.message.id, 256);
        if (!messageId) return { ok: false, code: "INVALID_WEBHOOK_PAYLOAD" };
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

    events.push({ webhookEventId, eventType, messageType, messageId, messageText,
      lineEventTimestamp, destination, sourceType, sourceUserId, isRedelivery });
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
  attributionSessionId: string | null;
  tokenExtractionCount: number;
}

interface LeadTokenLookupRow {
  lead_token: string;
  session_id: string | null;
  channel: "line" | "phone" | "form";
  status: string;
  attribution_snapshot_json: string | null;
  attribution_snapshot_hash: string | null;
  lineage_rule_version: string | null;
}

const unattributedDecision = (
  matchStatus: "UNMATCHED" | "AMBIGUOUS",
  tokenExtractionCount: number
): LineMatchDecision => ({
  matchStatus,
  recordEventType: "line_message_received_unattributed",
  leadToken: null,
  attribution: null,
  attributionSessionId: null,
  tokenExtractionCount,
});

const snapshotAttribution = (
  snapshot: LeadAttributionSnapshot
): GoogleAdsAttributionSelection | null => {
  if (!snapshot.selected_touch) return null;
  if (!snapshot.gclid && !snapshot.gbraid && !snapshot.wbraid) return null;
  return {
    attribution_touch: snapshot.selected_touch,
    gclid: snapshot.gclid,
    gbraid: snapshot.gbraid,
    wbraid: snapshot.wbraid,
  };
};

const classifyTextMessage = async (
  database: D1Database,
  text: string,
  eventAt: Date
): Promise<LineMatchDecision> => {
  const tokens = extractLeadTokens(text);
  if (tokens.length === 0) return unattributedDecision("UNMATCHED", 0);
  if (tokens.length > 1) return unattributedDecision("AMBIGUOUS", tokens.length);

  const leadToken = tokens[0];
  const lead = await database
    .prepare(
      `SELECT lead_token, session_id, channel, status,
              attribution_snapshot_json, attribution_snapshot_hash, lineage_rule_version
         FROM lead_tokens WHERE lead_token = ?1`
    )
    .bind(leadToken)
    .first<LeadTokenLookupRow>();
  if (!lead) return unattributedDecision("UNMATCHED", 1);
  if (lead.channel !== "line") {
    return { matchStatus: "WRONG_CHANNEL", recordEventType: "line_message_received_unattributed",
      leadToken, attribution: null, attributionSessionId: lead.session_id, tokenExtractionCount: 1 };
  }

  const snapshot = await readVerifiedLeadAttributionSnapshot(lead);
  if (!snapshot || !lead.session_id) {
    return { matchStatus: "MATCHED_UNATTRIBUTED", recordEventType: "line_message_received",
      leadToken, attribution: null, attributionSessionId: lead.session_id, tokenExtractionCount: 1 };
  }
  if (
    snapshot.session_expires_at === null ||
    Date.parse(snapshot.session_expires_at) <= eventAt.getTime()
  ) {
    return { matchStatus: "MATCHED_UNATTRIBUTED", recordEventType: "line_message_received",
      leadToken, attribution: null, attributionSessionId: lead.session_id, tokenExtractionCount: 1 };
  }
  const attribution = snapshotAttribution(snapshot);
  if (!attribution) {
    return { matchStatus: "MATCHED_UNATTRIBUTED", recordEventType: "line_message_received",
      leadToken, attribution: null, attributionSessionId: lead.session_id, tokenExtractionCount: 1 };
  }
  return {
    matchStatus: "MATCHED_ADS",
    recordEventType: "line_message_received",
    leadToken,
    attribution,
    attributionSessionId: lead.session_id,
    tokenExtractionCount: 1,
  };
};

interface CanonicalDeliveryConfigRow {
  projector_cutover_at: string;
  eligibility_rule_version: string;
}
interface ExistingLineEventRow {
  line_event_id: string;
  canonical_fingerprint: string | null;
}

export const processLineWebhookEvent = async (
  database: D1Database,
  event: ParsedLineEvent,
  identitySecret: string,
  now = new Date(),
  identityKeyId = LINE_IDENTITY_KEY_ID
): Promise<LineWebhookOutcome> => {
  const receivedAt = now.toISOString();
  const eventAt = new Date(event.lineEventTimestamp);
  const isTextMessage = event.eventType === "message" &&
    event.messageType === "text" && event.messageText !== null;
  const destinationMatches = event.destination === EXPECTED_LINE_DESTINATION;
  const identityKnown = event.sourceType === "user" && Boolean(event.sourceUserId);
  const lineUserKey = identityKnown
    ? await deriveLineUserKey(event.sourceUserId as string, identitySecret)
    : null;
  let decision: LineMatchDecision;
  if (!destinationMatches) {
    decision = {
      matchStatus: "WRONG_CHANNEL",
      recordEventType: "line_message_received_unattributed",
      leadToken: null,
      attribution: null,
      attributionSessionId: null,
      tokenExtractionCount: isTextMessage
        ? extractLeadTokens(event.messageText as string).length
        : 0,
    };
  } else if (isTextMessage) {
    decision = await classifyTextMessage(database, event.messageText as string, eventAt);
  } else {
    decision = {
      matchStatus: "IGNORED_NON_TEXT",
      recordEventType: event.eventType,
      leadToken: null,
      attribution: null,
      attributionSessionId: null,
      tokenExtractionCount: 0,
    };
  }
  const lineageSnapshot = decision.attribution && decision.attributionSessionId
    ? JSON.stringify({
        attribution_session_id: decision.attributionSessionId,
        attribution_touch: decision.attribution.attribution_touch,
        gclid: decision.attribution.gclid,
        gbraid: decision.attribution.gbraid,
        wbraid: decision.attribution.wbraid,
      })
    : null;
  const canonicalFingerprint = await sha256Hex(JSON.stringify({
    webhook_event_id: event.webhookEventId,
    message_id: event.messageId,
    event_type: event.eventType,
    message_type: event.messageType,
    line_event_timestamp: event.lineEventTimestamp,
    destination: event.destination,
    source_type: event.sourceType,
    lead_token: decision.leadToken,
    line_user_key: lineUserKey,
    attribution_session_id: decision.attributionSessionId,
    attribution_touch: decision.attribution?.attribution_touch ?? null,
    gclid: decision.attribution?.gclid ?? null,
    gbraid: decision.attribution?.gbraid ?? null,
    wbraid: decision.attribution?.wbraid ?? null,
  }));
  const existing = await database
    .prepare("SELECT line_event_id, canonical_fingerprint FROM line_events WHERE webhook_event_id = ?1")
    .bind(event.webhookEventId)
    .first<ExistingLineEventRow>();
  if (existing?.canonical_fingerprint) {
    if (existing.canonical_fingerprint !== canonicalFingerprint) {
      throw new Error("LINE_EVENT_CANONICAL_FINGERPRINT_MISMATCH");
    }
    await persistHighIntentShadowSafely(database, {
      lineEventId: existing.line_event_id,
      lineUserKey,
      leadToken: decision.leadToken,
      matchStatus: decision.matchStatus,
      exactAdsAttribution: decision.matchStatus === "MATCHED_ADS" && Boolean(decision.attribution),
      messageText: isTextMessage ? event.messageText : null,
      observedAt: receivedAt,
    });
    return "duplicate";
  }
  const lineEventId = existing?.line_event_id ?? crypto.randomUUID();
  const potentialBusiness = decision.matchStatus === "MATCHED_ADS" &&
    decision.tokenExtractionCount === 1 && Boolean(decision.leadToken) &&
    Boolean(decision.attribution) && Boolean(decision.attributionSessionId) &&
    destinationMatches && identityKnown && Boolean(lineUserKey);
  const canonicalConfig = potentialBusiness
    ? await database.prepare(
        "SELECT projector_cutover_at, eligibility_rule_version FROM canonical_outbox_delivery_config WHERE config_id = 1"
      ).first<CanonicalDeliveryConfigRow>()
    : null;
  if (potentialBusiness && !canonicalConfig) {
    throw new Error("CANONICAL_DELIVERY_CONFIG_MISSING");
  }
  const canonicalEligible = Boolean(canonicalConfig) &&
    eventAt.getTime() >= Date.parse(canonicalConfig!.projector_cutover_at);
  const statements = [
    database.prepare(
      `INSERT OR IGNORE INTO line_events (
        line_event_id, webhook_event_id, message_id, lead_token, event_type, match_status,
        line_event_timestamp, received_at, created_at, line_user_key, line_event_type,
        source_type, message_type, token_extraction_count, identity_state, identity_key_id,
        line_destination, business_subject_kind, business_subject_key, attribution_session_id,
        attribution_touch, gclid, gbraid, wbraid, lineage_snapshot_json,
        lineage_frozen_at, canonical_fingerprint
      ) VALUES (
        ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,
        ?20,?21,?22,?23,?24,?25,?26,?27
      )`
    ).bind(
      lineEventId, event.webhookEventId, event.messageId, decision.leadToken,
      decision.recordEventType, decision.matchStatus, event.lineEventTimestamp,
      receivedAt, receivedAt, lineUserKey, event.eventType, event.sourceType ?? "unknown",
      event.messageType, decision.tokenExtractionCount, identityKnown ? "KNOWN" : "ABSENT",
      identityKnown ? identityKeyId : null, event.destination,
      lineUserKey ? "LINE_USER_HMAC" : null, lineUserKey, decision.attributionSessionId,
      decision.attribution?.attribution_touch ?? null, decision.attribution?.gclid ?? null,
      decision.attribution?.gbraid ?? null, decision.attribution?.wbraid ?? null,
      lineageSnapshot, lineageSnapshot ? receivedAt : null, canonicalFingerprint
    ),
  ];
  if (existing && !existing.canonical_fingerprint) {
    statements.push(database.prepare(
      `UPDATE line_events SET
        line_user_key = COALESCE(line_user_key, ?1),
        line_event_type = CASE WHEN line_event_type='unknown' THEN ?2 ELSE line_event_type END,
        source_type = CASE WHEN source_type='unknown' THEN ?3 ELSE source_type END,
        message_type = COALESCE(message_type, ?4),
        token_extraction_count = CASE WHEN token_extraction_count=0 THEN ?5 ELSE token_extraction_count END,
        identity_state = CASE WHEN identity_state='LEGACY_UNKNOWN' THEN ?6 ELSE identity_state END,
        identity_key_id = COALESCE(identity_key_id, ?7),
        line_destination = COALESCE(line_destination, ?8),
        business_subject_kind = COALESCE(business_subject_kind, ?9),
        business_subject_key = COALESCE(business_subject_key, ?10),
        attribution_session_id = COALESCE(attribution_session_id, ?11),
        attribution_touch = COALESCE(attribution_touch, ?12),
        gclid = COALESCE(gclid, ?13), gbraid = COALESCE(gbraid, ?14),
        wbraid = COALESCE(wbraid, ?15),
        lineage_snapshot_json = COALESCE(lineage_snapshot_json, ?16),
        lineage_frozen_at = COALESCE(lineage_frozen_at, ?17),
        canonical_fingerprint = COALESCE(canonical_fingerprint, ?18)
       WHERE line_event_id=?19 AND webhook_event_id=?20 AND canonical_fingerprint IS NULL`
    ).bind(
      lineUserKey, event.eventType, event.sourceType ?? "unknown", event.messageType,
      decision.tokenExtractionCount, identityKnown ? "KNOWN" : "ABSENT",
      identityKnown ? identityKeyId : null, event.destination,
      lineUserKey ? "LINE_USER_HMAC" : null, lineUserKey,
      decision.attributionSessionId, decision.attribution?.attribution_touch ?? null,
      decision.attribution?.gclid ?? null, decision.attribution?.gbraid ?? null,
      decision.attribution?.wbraid ?? null, lineageSnapshot,
      lineageSnapshot ? receivedAt : null, canonicalFingerprint,
      lineEventId, event.webhookEventId
    ));
  }

  if (canonicalEligible && lineUserKey && decision.leadToken && decision.attribution &&
      decision.attributionSessionId && canonicalConfig) {
    const businessConversionId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const conversionId = crypto.randomUUID();
    const conflictId = crypto.randomUUID();
    const dedupeUntil = new Date(
      eventAt.getTime() + BUSINESS_DEDUPE_WINDOW_MS
    ).toISOString();
    statements.push(database.prepare(
      `INSERT OR IGNORE INTO token_claim_conflicts (
        conflict_id, lead_token, first_claimant_key, observed_claimant_key,
        observed_line_event_id, observed_at, reason_code, review_state, created_at
      )
      SELECT ?1, tc.lead_token, tc.claimant_key, ?2, ?3, ?4,
             'LEAD_TOKEN_CLAIMANT_MISMATCH', 'OPEN', ?4
        FROM token_claims tc
       WHERE tc.lead_token=?5 AND tc.claimant_key<>?2
         AND EXISTS (SELECT 1 FROM line_events WHERE line_event_id=?3)`
    ).bind(conflictId, lineUserKey, lineEventId, receivedAt, decision.leadToken));

    statements.push(database.prepare(
      `UPDATE business_conversion_dedupe_locks
          SET last_lineage_observed_at=?1,
              fence_version=fence_version+1,
              updated_at=?2
        WHERE subject_kind='LINE_USER_HMAC' AND subject_key=?3
          AND conversion_type='verified_line_contact' AND dedupe_until>?4
          AND NOT EXISTS (
            SELECT 1 FROM token_claims tc
             WHERE tc.lead_token=?5 AND tc.claimant_key<>?3
          )`
    ).bind(event.lineEventTimestamp, receivedAt, lineUserKey,
      event.lineEventTimestamp, decision.leadToken));
    statements.push(database.prepare(
      `INSERT OR IGNORE INTO business_conversions (
        business_conversion_id, transaction_id, conversion_type, subject_kind, subject_key,
        attribution_session_id, first_lead_token, first_line_event_id, first_webhook_event_id,
        conversion_time, dedupe_until, attribution_touch, gclid, gbraid, wbraid,
        lineage_observed_at, destination_key, conversion_action_id,
        eligibility_state, eligibility_reason, eligibility_evaluated_at,
        outcome_state, created_at, updated_at, version
      )
      SELECT ?1,?2,'verified_line_contact','LINE_USER_HMAC',?3,?4,?5,?6,?7,
             ?8,?9,?10,?11,?12,?13,?14,?15,?16,
             'ELIGIBLE',?17,?18,'PENDING',?18,?18,1
       WHERE EXISTS (SELECT 1 FROM line_events WHERE line_event_id=?6)
         AND NOT EXISTS (SELECT 1 FROM token_claims WHERE lead_token=?5)
         AND NOT EXISTS (
           SELECT 1 FROM business_conversion_dedupe_locks
            WHERE subject_kind='LINE_USER_HMAC' AND subject_key=?3
              AND conversion_type='verified_line_contact' AND dedupe_until>?8
         )`
    ).bind(
      businessConversionId, transactionId, lineUserKey,
      decision.attributionSessionId, decision.leadToken, lineEventId,
      event.webhookEventId, event.lineEventTimestamp, dedupeUntil,
      decision.attribution.attribution_touch, decision.attribution.gclid,
      decision.attribution.gbraid, decision.attribution.wbraid,
      event.lineEventTimestamp, BUSINESS_DESTINATION_KEY,
      GOOGLE_ADS_CONVERSION_ACTION_ID,
      `CANONICAL_${canonicalConfig.eligibility_rule_version}_MATCHED_ADS`,
      receivedAt
    ));

    statements.push(database.prepare(
      `INSERT INTO business_conversion_dedupe_locks (
        subject_kind, subject_key, conversion_type, active_business_conversion_id,
        dedupe_until, last_lineage_observed_at, fence_version, updated_at
      )
      SELECT 'LINE_USER_HMAC', ?1, 'verified_line_contact', business_conversion_id,
             dedupe_until, lineage_observed_at, 0, ?2
        FROM business_conversions WHERE business_conversion_id=?3
      ON CONFLICT(subject_kind, subject_key, conversion_type) DO UPDATE SET
        active_business_conversion_id=excluded.active_business_conversion_id,
        dedupe_until=excluded.dedupe_until,
        last_lineage_observed_at=excluded.last_lineage_observed_at,
        fence_version=business_conversion_dedupe_locks.fence_version+1,
        updated_at=excluded.updated_at
      WHERE business_conversion_dedupe_locks.dedupe_until<=?4`
    ).bind(lineUserKey, receivedAt, businessConversionId, event.lineEventTimestamp));
    statements.push(database.prepare(
      `INSERT OR IGNORE INTO token_claims (
        lead_token, claimant_kind, claimant_key, business_conversion_id,
        first_line_event_id, claimed_at, claim_state, created_at
      )
      SELECT ?1, 'LINE_USER_HMAC', ?2,
             COALESCE(
               (SELECT business_conversion_id FROM business_conversions
                 WHERE business_conversion_id=?3),
               (SELECT active_business_conversion_id FROM business_conversion_dedupe_locks
                 WHERE subject_kind='LINE_USER_HMAC' AND subject_key=?2
                   AND conversion_type='verified_line_contact' AND dedupe_until>?4)
             ),
             ?5, ?4, 'CLAIMED', ?6
       WHERE EXISTS (SELECT 1 FROM line_events WHERE line_event_id=?5)
         AND NOT EXISTS (SELECT 1 FROM token_claims WHERE lead_token=?1)
         AND COALESCE(
               (SELECT business_conversion_id FROM business_conversions
                 WHERE business_conversion_id=?3),
               (SELECT active_business_conversion_id FROM business_conversion_dedupe_locks
                 WHERE subject_kind='LINE_USER_HMAC' AND subject_key=?2
                   AND conversion_type='verified_line_contact' AND dedupe_until>?4)
             ) IS NOT NULL`
    ).bind(decision.leadToken, lineUserKey, businessConversionId,
      event.lineEventTimestamp, lineEventId, receivedAt));
    statements.push(database.prepare(
      `INSERT OR IGNORE INTO conversion_outbox (
        conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid, wbraid,
        attribution_touch, transaction_id, destination_key, status, retry_count,
        next_retry_at, last_error_code, created_at, sent_at, submitted_at, google_request_id,
        next_diagnostic_at, terminal_result, last_error_reason, diagnostic_status,
        diagnostic_record_count, diagnostic_error_reason, diagnostic_attempt_count, updated_at,
        business_conversion_id, snapshot_version, eligibility_rule_version,
        google_ads_account_id, google_ads_conversion_action_id, event_source,
        lease_generation, lease_owner, lease_expires_at
      )
      SELECT ?1, first_lead_token, conversion_type, conversion_time, gclid, gbraid, wbraid,
             attribution_touch, transaction_id, destination_key, 'pending', 0,
             NULL,NULL,?2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,?2,
             business_conversion_id,1,?3,?4,conversion_action_id,'MESSAGE',0,NULL,NULL
        FROM business_conversions
       WHERE business_conversion_id=?5
         AND eligibility_state='ELIGIBLE' AND outcome_state='PENDING'`
    ).bind(conversionId, receivedAt, canonicalConfig.eligibility_rule_version,
      GOOGLE_ADS_ACCOUNT_ID, businessConversionId));

    statements.push(database.prepare(
      `UPDATE lead_tokens SET status='received'
        WHERE lead_token=?1 AND status='issued'
          AND EXISTS (
            SELECT 1 FROM token_claims
             WHERE lead_token=?1 AND claimant_kind='LINE_USER_HMAC' AND claimant_key=?2
          )`
    ).bind(decision.leadToken, lineUserKey));
  }
  const results = await database.batch(statements);
  const eventInserted = Number(results[0]?.meta?.changes ?? 0) > 0;
  const stored = await database
    .prepare("SELECT line_event_id FROM line_events WHERE webhook_event_id=?1")
    .bind(event.webhookEventId)
    .first<{ line_event_id: string }>();
  if (!stored) return "duplicate";
  await persistHighIntentShadowSafely(database, {
    lineEventId: stored.line_event_id,
    lineUserKey,
    leadToken: decision.leadToken,
    matchStatus: decision.matchStatus,
    exactAdsAttribution: decision.matchStatus === "MATCHED_ADS" && Boolean(decision.attribution),
    messageText: isTextMessage ? event.messageText : null,
    observedAt: receivedAt,
  });
  if (!eventInserted || existing) return "duplicate";

  if (canonicalEligible && lineUserKey && decision.leadToken) {
    const claim = await database
      .prepare("SELECT business_conversion_id FROM token_claims WHERE lead_token=?1 AND claimant_key=?2")
      .bind(decision.leadToken, lineUserKey)
      .first<{ business_conversion_id: string }>();
    return claim ? "accepted" : "ignored";
  }
  return "ignored";
};
