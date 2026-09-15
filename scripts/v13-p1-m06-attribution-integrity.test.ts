import assert from "node:assert/strict";
import test from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  enforceAttributionIntegrity,
  ATTRIBUTION_MAX_CAPTURE_AGE_MS,
} from "../functions/_lib/attribution-integrity.ts";
import {
  validateAttributionPayload,
  type NormalizedAttributionPayload,
} from "../functions/_lib/attribution.ts";

const SERVER_NOW = new Date("2026-09-15T04:00:00.000Z");

const rawTouch = (capturedAt: string | null, gclid: string | null) => ({
  captured_at: capturedAt,
  landing_url: gclid ? `https://www.xusen.pro/?gclid=${encodeURIComponent(gclid)}` : "https://www.xusen.pro/",
  referrer: "https://www.google.com/",
  gclid,
  gbraid: null,
  wbraid: null,
  utm_source: gclid ? "google" : null,
  utm_medium: gclid ? "cpc" : null,
  utm_campaign: null,
  utm_id: null,
  utm_term: null,
  utm_content: null,
});

const payload = (
  firstCapturedAt: string | null,
  lastCapturedAt = firstCapturedAt,
  firstGclid: string | null = "GCLID-M06",
  lastGclid: string | null = firstGclid,
  sessionId = "m06-session"
): NormalizedAttributionPayload => {
  const result = validateAttributionPayload({
    schema_version: 1,
    session_id: sessionId,
    stored_at: SERVER_NOW.toISOString(),
    first_touch: rawTouch(firstCapturedAt, firstGclid),
    last_touch: rawTouch(lastCapturedAt, lastGclid),
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error(result.code);
  return result.value;
};

interface FakeState {
  conflict: boolean;
  queries: number;
  binds: unknown[][];
}

class FakeStatement {
  args: unknown[] = [];
  private readonly state: FakeState;

  constructor(state: FakeState) {
    this.state = state;
  }

  bind(...args: unknown[]) {
    this.args = args;
    this.state.binds.push(args);
    return this;
  }

  async first<T>(): Promise<T | null> {
    this.state.queries += 1;
    return (this.state.conflict ? { session_id: "other-active-session" } : null) as T | null;
  }
}

const database = (state: FakeState): D1Database => ({
  prepare() {
    return new FakeStatement(state);
  },
} as unknown as D1Database);

const freshState = (conflict = false): FakeState => ({
  conflict,
  queries: 0,
  binds: [],
});

test("M06 clamps bounded client clock skew to server received time", async () => {
  const state = freshState();
  const result = await enforceAttributionIntegrity(
    database(state),
    payload("2026-09-15T04:03:00.000Z"),
    SERVER_NOW
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.first_touch.captured_at, SERVER_NOW.toISOString());
  assert.equal(result.value.last_touch.captured_at, SERVER_NOW.toISOString());
});

test("M06 rejects timestamps beyond bounded future skew", async () => {
  const result = await enforceAttributionIntegrity(
    database(freshState()),
    payload("2026-09-15T04:05:00.001Z"),
    SERVER_NOW
  );
  assert.deepEqual(result, {
    ok: false,
    code: "ATTRIBUTION_CAPTURE_TIME_IN_FUTURE",
    status: 400,
  });
});

test("M06 rejects attribution older than the active 90-day window", async () => {
  const tooOld = new Date(
    SERVER_NOW.getTime() - ATTRIBUTION_MAX_CAPTURE_AGE_MS - 1
  ).toISOString();
  const result = await enforceAttributionIntegrity(
    database(freshState()),
    payload(tooOld),
    SERVER_NOW
  );
  assert.deepEqual(result, {
    ok: false,
    code: "ATTRIBUTION_CAPTURE_TIME_TOO_OLD",
    status: 400,
  });
});

test("M06 untimed client source degrades to unattributed instead of becoming canonical", async () => {
  const state = freshState();
  const result = await enforceAttributionIntegrity(
    database(state),
    payload(null),
    SERVER_NOW
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.first_touch.gclid, null);
  assert.equal(result.value.last_touch.gclid, null);
  assert.equal(result.value.first_touch.utm_source, null);
  assert.equal(result.value.last_touch.utm_medium, null);
  assert.equal(state.queries, 0);
});

test("M06 rejects syntactically unsafe opaque click identifiers without claiming authenticity", async () => {
  const result = await enforceAttributionIntegrity(
    database(freshState()),
    payload("2026-09-15T03:59:00.000Z", undefined, "bad click id"),
    SERVER_NOW
  );
  assert.deepEqual(result, {
    ok: false,
    code: "ATTRIBUTION_CLICK_ID_INVALID",
    status: 400,
  });
});

test("M06 rejects active click identifier reuse under another client session", async () => {
  const state = freshState(true);
  const result = await enforceAttributionIntegrity(
    database(state),
    payload("2026-09-15T03:59:00.000Z"),
    SERVER_NOW
  );
  assert.deepEqual(result, {
    ok: false,
    code: "ATTRIBUTION_CLICK_ID_ACTIVE_SESSION_CONFLICT",
    status: 409,
  });
  assert.equal(state.queries, 1);
  assert.equal(state.binds[0][0], "m06-session");
  assert.equal(state.binds[0][1], SERVER_NOW.toISOString());
});

test("M06 rejects a client payload whose first touch is later than last touch", async () => {
  const result = await enforceAttributionIntegrity(
    database(freshState()),
    payload(
      "2026-09-15T03:59:00.000Z",
      "2026-09-15T03:58:00.000Z",
      "GCLID-FIRST",
      "GCLID-LAST"
    ),
    SERVER_NOW
  );
  assert.deepEqual(result, {
    ok: false,
    code: "ATTRIBUTION_TOUCH_ORDER_INVALID",
    status: 400,
  });
});
