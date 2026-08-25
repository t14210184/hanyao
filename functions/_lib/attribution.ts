import type { D1Database } from "@cloudflare/workers-types";

export const ATTRIBUTION_SCHEMA_VERSION = 1 as const;
export const ATTRIBUTION_RETENTION_DAYS = 90;

const MAX_SESSION_ID_LENGTH = 128;
const MAX_ATTRIBUTION_VALUE_LENGTH = 512;
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

export interface ClientTouchInput {
  captured_at?: unknown;
  landing_url?: unknown;
  referrer?: unknown;
  [key: string]: unknown;
}

export interface NormalizedTouch {
  captured_at: string | null;
  landing_path: string | null;
  referrer_origin: string | null;
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

export interface NormalizedAttributionPayload {
  schema_version: typeof ATTRIBUTION_SCHEMA_VERSION;
  session_id: string;
  first_touch: NormalizedTouch;
  last_touch: NormalizedTouch;
}

export interface AttributionSessionRow {
  session_id: string;
  schema_version: number;
  first_captured_at: string | null;
  first_landing_path: string | null;
  first_referrer_origin: string | null;
  first_gclid: string | null;
  first_gbraid: string | null;
  first_wbraid: string | null;
  first_utm_source: string | null;
  first_utm_medium: string | null;
  first_utm_campaign: string | null;
  first_utm_id: string | null;
  first_utm_term: string | null;
  first_utm_content: string | null;
  last_captured_at: string | null;
  last_landing_path: string | null;
  last_referrer_origin: string | null;
  last_gclid: string | null;
  last_gbraid: string | null;
  last_wbraid: string | null;
  last_utm_source: string | null;
  last_utm_medium: string | null;
  last_utm_campaign: string | null;
  last_utm_id: string | null;
  last_utm_term: string | null;
  last_utm_content: string | null;
  server_created_at: string;
  server_updated_at: string;
  expires_at: string;
}

export interface GoogleAdsAttributionSelection {
  attribution_touch: "last" | "first";
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
}

const googleClickIdentifiers = (
  session: AttributionSessionRow,
  touch: "first" | "last"
): GoogleAdsAttributionSelection => {
  if (touch === "first") {
    return {
      attribution_touch: touch,
      gclid: session.first_gclid,
      gbraid: session.first_gbraid,
      wbraid: session.first_wbraid,
    };
  }
  return {
    attribution_touch: touch,
    gclid: session.last_gclid,
    gbraid: session.last_gbraid,
    wbraid: session.last_wbraid,
  };
};

const hasGoogleClickIdentifier = (
  selection: GoogleAdsAttributionSelection
): boolean =>
  Boolean(selection.gclid || selection.gbraid || selection.wbraid);

export const selectGoogleAdsAttribution = (
  session: AttributionSessionRow
): GoogleAdsAttributionSelection | null => {
  const lastTouch = googleClickIdentifiers(session, "last");
  if (hasGoogleClickIdentifier(lastTouch)) return lastTouch;

  const firstTouch = googleClickIdentifiers(session, "first");
  if (hasGoogleClickIdentifier(firstTouch)) return firstTouch;

  return null;
};

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  code: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const emptyTouch = (): NormalizedTouch => ({
  captured_at: null,
  landing_path: null,
  referrer_origin: null,
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[]
): boolean => Object.keys(value).every((key) => allowedKeys.includes(key));

const normalizeNullableString = (
  value: unknown,
  maxLength = MAX_ATTRIBUTION_VALUE_LENGTH
): ValidationResult<string | null> => {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, code: "INVALID_FIELD_TYPE" };

  const normalized = value.trim();
  if (normalized.length === 0) return { ok: true, value: null };
  if (normalized.length > maxLength) {
    return { ok: false, code: "FIELD_TOO_LONG" };
  }
  return { ok: true, value: normalized };
};

const normalizeCapturedAt = (value: unknown): ValidationResult<string | null> => {
  const normalized = normalizeNullableString(value, 80);
  if (!normalized.ok || normalized.value === null) return normalized;

  const timestamp = Date.parse(normalized.value);
  if (!Number.isFinite(timestamp)) return { ok: false, code: "INVALID_TIMESTAMP" };
  return { ok: true, value: new Date(timestamp).toISOString() };
};

const normalizeUrlPart = (
  value: unknown,
  part: "pathname" | "origin"
): ValidationResult<string | null> => {
  const normalized = normalizeNullableString(value, 4096);
  if (!normalized.ok || normalized.value === null) return normalized;

  try {
    const parsed = new URL(normalized.value);
    return {
      ok: true,
      value: part === "pathname" ? parsed.pathname || "/" : parsed.origin,
    };
  } catch {
    return { ok: false, code: "INVALID_URL" };
  }
};

export const hasAttributionSource = (touch: NormalizedTouch): boolean =>
  TOUCH_FIELDS.some((field) => touch[field] !== null);

const sourceColumnsAreNull = (prefix: "first" | "last"): string =>
  TOUCH_FIELDS.map((field) => `${prefix}_${field} IS NULL`).join(" AND ");

const FIRST_SOURCE_COLUMNS_EMPTY_SQL = sourceColumnsAreNull("first");
const LAST_SOURCE_COLUMNS_EMPTY_SQL = sourceColumnsAreNull("last");

export const ATTRIBUTION_CLEANUP_BATCH_SIZE = 25;
export const ATTRIBUTION_CLEANUP_SAMPLE_MODULUS = 16;

export const validateAttributionTouch = (
  value: unknown
): ValidationResult<NormalizedTouch> => {
  if (!isRecord(value)) return { ok: false, code: "INVALID_TOUCH" };

  const allowedKeys = ["captured_at", "landing_url", "referrer", ...TOUCH_FIELDS];
  if (!hasOnlyKeys(value, allowedKeys)) {
    return { ok: false, code: "UNSUPPORTED_FIELD" };
  }

  const touch = emptyTouch();
  const capturedAt = normalizeCapturedAt(value.captured_at);
  if (!capturedAt.ok) return capturedAt;
  touch.captured_at = capturedAt.value;

  const landingPath = normalizeUrlPart(value.landing_url, "pathname");
  if (!landingPath.ok) return landingPath;
  touch.landing_path = landingPath.value;

  const referrerOrigin = normalizeUrlPart(value.referrer, "origin");
  if (!referrerOrigin.ok) return referrerOrigin;
  touch.referrer_origin = referrerOrigin.value;

  for (const field of TOUCH_FIELDS) {
    const fieldValue = normalizeNullableString(value[field]);
    if (!fieldValue.ok) return fieldValue;
    touch[field] = fieldValue.value;
  }

  return { ok: true, value: touch };
};

export const validateAttributionPayload = (
  value: unknown
): ValidationResult<NormalizedAttributionPayload> => {
  if (!isRecord(value)) return { ok: false, code: "INVALID_PAYLOAD" };

  const allowedKeys = [
    "schema_version",
    "session_id",
    "stored_at",
    "first_touch",
    "last_touch",
  ];
  if (!hasOnlyKeys(value, allowedKeys)) {
    return { ok: false, code: "UNSUPPORTED_FIELD" };
  }

  if (value.schema_version !== ATTRIBUTION_SCHEMA_VERSION) {
    return { ok: false, code: "UNSUPPORTED_SCHEMA_VERSION" };
  }

  if (
    typeof value.session_id !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(value.session_id) ||
    value.session_id.length > MAX_SESSION_ID_LENGTH
  ) {
    return { ok: false, code: "INVALID_SESSION_ID" };
  }

  if (value.stored_at !== undefined) {
    const storedAt = normalizeCapturedAt(value.stored_at);
    if (!storedAt.ok) return storedAt;
  }

  const firstTouch = validateAttributionTouch(value.first_touch);
  if (!firstTouch.ok) return firstTouch;
  const lastTouch = validateAttributionTouch(value.last_touch);
  if (!lastTouch.ok) return lastTouch;

  return {
    ok: true,
    value: {
      schema_version: ATTRIBUTION_SCHEMA_VERSION,
      session_id: value.session_id,
      first_touch: firstTouch.value,
      last_touch: lastTouch.value,
    },
  };
};

const touchColumns = (touch: NormalizedTouch): (string | null)[] => [
  touch.captured_at,
  touch.landing_path,
  touch.referrer_origin,
  touch.gclid,
  touch.gbraid,
  touch.wbraid,
  touch.utm_source,
  touch.utm_medium,
  touch.utm_campaign,
  touch.utm_id,
  touch.utm_term,
  touch.utm_content,
];

export const upsertAttributionSession = async (
  database: D1Database,
  payload: NormalizedAttributionPayload,
  now = new Date()
): Promise<AttributionSessionRow> => {
  const serverNow = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + ATTRIBUTION_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await database
    .prepare(
      `INSERT OR IGNORE INTO attribution_sessions (
        session_id, schema_version,
        first_captured_at, first_landing_path, first_referrer_origin,
        first_gclid, first_gbraid, first_wbraid,
        first_utm_source, first_utm_medium, first_utm_campaign,
        first_utm_id, first_utm_term, first_utm_content,
        last_captured_at, last_landing_path, last_referrer_origin,
        last_gclid, last_gbraid, last_wbraid,
        last_utm_source, last_utm_medium, last_utm_campaign,
        last_utm_id, last_utm_term, last_utm_content,
        server_created_at, server_updated_at, expires_at
      ) VALUES (
        ?1, ?2,
        ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14,
        ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26,
        ?27, ?28, ?29
      )`
    )
    .bind(
      payload.session_id,
      payload.schema_version,
      ...touchColumns(payload.first_touch),
      ...touchColumns(payload.last_touch),
      serverNow,
      serverNow,
      expiresAt
    )
    .run();

  if (hasAttributionSource(payload.first_touch)) {
    await database
      .prepare(
        `UPDATE attribution_sessions SET
          first_captured_at = ?1, first_landing_path = ?2, first_referrer_origin = ?3,
          first_gclid = ?4, first_gbraid = ?5, first_wbraid = ?6,
          first_utm_source = ?7, first_utm_medium = ?8, first_utm_campaign = ?9,
          first_utm_id = ?10, first_utm_term = ?11, first_utm_content = ?12
        WHERE session_id = ?13 AND ${FIRST_SOURCE_COLUMNS_EMPTY_SQL}`
      )
      .bind(...touchColumns(payload.first_touch), payload.session_id)
      .run();
  }

  if (hasAttributionSource(payload.last_touch)) {
    const incomingCapturedAt = payload.last_touch.captured_at;
    await database
      .prepare(
        `UPDATE attribution_sessions SET
          schema_version = ?1,
          last_captured_at = ?2, last_landing_path = ?3, last_referrer_origin = ?4,
          last_gclid = ?5, last_gbraid = ?6, last_wbraid = ?7,
          last_utm_source = ?8, last_utm_medium = ?9, last_utm_campaign = ?10,
          last_utm_id = ?11, last_utm_term = ?12, last_utm_content = ?13,
          server_updated_at = ?14, expires_at = ?15
        WHERE session_id = ?16 AND (
          (${LAST_SOURCE_COLUMNS_EMPTY_SQL})
          OR (?17 IS NOT NULL AND (last_captured_at IS NULL OR last_captured_at < ?17))
        )`
      )
      .bind(
        payload.schema_version,
        ...touchColumns(payload.last_touch),
        serverNow,
        expiresAt,
        payload.session_id,
        incomingCapturedAt
      )
      .run();
  } else {
    await database
      .prepare(
        `UPDATE attribution_sessions
         SET schema_version = ?1, server_updated_at = ?2, expires_at = ?3
         WHERE session_id = ?4`
      )
      .bind(payload.schema_version, serverNow, expiresAt, payload.session_id)
      .run();
  }

  const updated = await database
    .prepare("SELECT * FROM attribution_sessions WHERE session_id = ?1")
    .bind(payload.session_id)
    .first<AttributionSessionRow>();
  if (!updated) throw new Error("ATTRIBUTION_UPDATE_READBACK_FAILED");
  return updated;
};

const stableCleanupSample = (value: string): number =>
  Array.from(value).reduce(
    (sum, character) => (sum + character.codePointAt(0)!) % ATTRIBUTION_CLEANUP_SAMPLE_MODULUS,
    0
  );

export const shouldRunOpportunisticCleanup = (sampleKey: string): boolean =>
  stableCleanupSample(sampleKey) === 0;

export const cleanupExpiredAttribution = async (
  database: D1Database,
  serverNow = new Date(),
  batchSize = ATTRIBUTION_CLEANUP_BATCH_SIZE
): Promise<number> => {
  const boundedBatchSize = Math.max(1, Math.min(batchSize, 100));
  const result = await database
    .prepare(
      `DELETE FROM attribution_sessions
       WHERE session_id IN (
         SELECT session_id FROM attribution_sessions
         WHERE expires_at <= ?1
         ORDER BY expires_at, session_id
         LIMIT ?2
       )`
    )
    .bind(serverNow.toISOString(), boundedBatchSize)
    .run();
  return result.meta?.changes ?? 0;
};

export const opportunisticCleanupExpiredAttribution = async (
  database: D1Database,
  sampleKey: string,
  serverNow = new Date()
): Promise<number> => {
  if (!shouldRunOpportunisticCleanup(sampleKey)) return 0;
  try {
    return await cleanupExpiredAttribution(database, serverNow);
  } catch {
    return 0;
  }
};
