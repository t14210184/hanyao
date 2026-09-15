import type { D1Database } from "@cloudflare/workers-types";
import {
  ATTRIBUTION_RETENTION_DAYS,
  hasAttributionSource,
  type NormalizedAttributionPayload,
  type NormalizedTouch,
} from "./attribution.ts";

export const ATTRIBUTION_MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
export const ATTRIBUTION_MAX_CAPTURE_AGE_MS =
  ATTRIBUTION_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export type AttributionIntegrityCode =
  | "ATTRIBUTION_CAPTURE_TIME_REQUIRED"
  | "ATTRIBUTION_CAPTURE_TIME_IN_FUTURE"
  | "ATTRIBUTION_CAPTURE_TIME_TOO_OLD"
  | "ATTRIBUTION_TOUCH_ORDER_INVALID"
  | "ATTRIBUTION_CLICK_ID_INVALID"
  | "ATTRIBUTION_CLICK_ID_ACTIVE_SESSION_CONFLICT";

export type AttributionIntegrityResult =
  | { ok: true; value: NormalizedAttributionPayload }
  | { ok: false; code: AttributionIntegrityCode; status: 400 | 409 };

const CLICK_ID_FIELDS = ["gclid", "gbraid", "wbraid"] as const;

const clickIdIsSyntacticallySafe = (value: string): boolean =>
  value.length > 0 && !/[\s\u0000-\u001f\u007f]/u.test(value);

const boundTouch = (
  touch: NormalizedTouch,
  serverReceivedAt: Date
): AttributionIntegrityResult | NormalizedTouch => {
  for (const field of CLICK_ID_FIELDS) {
    const value = touch[field];
    if (value !== null && !clickIdIsSyntacticallySafe(value)) {
      return { ok: false, code: "ATTRIBUTION_CLICK_ID_INVALID", status: 400 };
    }
  }

  if (!hasAttributionSource(touch)) return { ...touch };
  if (touch.captured_at === null) {
    return {
      ok: false,
      code: "ATTRIBUTION_CAPTURE_TIME_REQUIRED",
      status: 400,
    };
  }

  const capturedMs = Date.parse(touch.captured_at);
  const serverMs = serverReceivedAt.getTime();
  if (capturedMs > serverMs + ATTRIBUTION_MAX_FUTURE_SKEW_MS) {
    return {
      ok: false,
      code: "ATTRIBUTION_CAPTURE_TIME_IN_FUTURE",
      status: 400,
    };
  }
  if (capturedMs < serverMs - ATTRIBUTION_MAX_CAPTURE_AGE_MS) {
    return {
      ok: false,
      code: "ATTRIBUTION_CAPTURE_TIME_TOO_OLD",
      status: 400,
    };
  }

  return {
    ...touch,
    captured_at: new Date(Math.min(capturedMs, serverMs)).toISOString(),
  };
};

const isFailure = (
  value: AttributionIntegrityResult | NormalizedTouch
): value is Extract<AttributionIntegrityResult, { ok: false }> =>
  "ok" in value && value.ok === false;

const activeClickConflict = async (
  database: D1Database,
  payload: NormalizedAttributionPayload,
  serverReceivedAt: Date
): Promise<boolean> => {
  const values = [
    payload.first_touch.gclid,
    payload.last_touch.gclid,
    payload.first_touch.gbraid,
    payload.last_touch.gbraid,
    payload.first_touch.wbraid,
    payload.last_touch.wbraid,
  ] as const;
  if (values.every((value) => value === null)) return false;

  const row = await database
    .prepare(
      `SELECT session_id
         FROM attribution_sessions
        WHERE session_id<>?1 AND expires_at>?2
          AND (
            (?3 IS NOT NULL AND (first_gclid=?3 OR last_gclid=?3)) OR
            (?4 IS NOT NULL AND (first_gclid=?4 OR last_gclid=?4)) OR
            (?5 IS NOT NULL AND (first_gbraid=?5 OR last_gbraid=?5)) OR
            (?6 IS NOT NULL AND (first_gbraid=?6 OR last_gbraid=?6)) OR
            (?7 IS NOT NULL AND (first_wbraid=?7 OR last_wbraid=?7)) OR
            (?8 IS NOT NULL AND (first_wbraid=?8 OR last_wbraid=?8))
          )
        LIMIT 1`
    )
    .bind(payload.session_id, serverReceivedAt.toISOString(), ...values)
    .first<{ session_id: string }>();
  return Boolean(row);
};

export const enforceAttributionIntegrity = async (
  database: D1Database,
  payload: NormalizedAttributionPayload,
  serverReceivedAt = new Date()
): Promise<AttributionIntegrityResult> => {
  const firstTouch = boundTouch(payload.first_touch, serverReceivedAt);
  if (isFailure(firstTouch)) return firstTouch;
  const lastTouch = boundTouch(payload.last_touch, serverReceivedAt);
  if (isFailure(lastTouch)) return lastTouch;

  if (
    firstTouch.captured_at !== null &&
    lastTouch.captured_at !== null &&
    hasAttributionSource(firstTouch) &&
    hasAttributionSource(lastTouch) &&
    Date.parse(firstTouch.captured_at) > Date.parse(lastTouch.captured_at)
  ) {
    return {
      ok: false,
      code: "ATTRIBUTION_TOUCH_ORDER_INVALID",
      status: 400,
    };
  }

  const bounded: NormalizedAttributionPayload = {
    ...payload,
    first_touch: firstTouch,
    last_touch: lastTouch,
  };

  if (await activeClickConflict(database, bounded, serverReceivedAt)) {
    return {
      ok: false,
      code: "ATTRIBUTION_CLICK_ID_ACTIVE_SESSION_CONFLICT",
      status: 409,
    };
  }

  return { ok: true, value: bounded };
};
