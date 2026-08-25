import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import {
  validateAttributionPayload,
} from "../functions/_lib/attribution.ts";
import {
  generateLeadToken,
  LEAD_TOKEN_ALPHABET,
  validateLeadTokenRequest,
} from "../functions/_lib/lead-token.ts";
import {
  buildServerAttributionPayload,
  issueLeadToken,
  syncAttributionToServer,
} from "../src/lib/attribution-server.ts";
import { enforceAbuseControl } from "../functions/_lib/abuse-control.ts";
import type { AttributionV1 } from "../src/lib/attribution.ts";

const uuid = "11111111-1111-4111-8111-111111111111";

const validAttributionPayload = () => ({
  schema_version: 1,
  session_id: "session-A",
  stored_at: "2026-08-24T00:00:00.000Z",
  first_touch: {
    captured_at: "2026-08-24T00:00:00.000Z",
    landing_url:
      "https://www.xusen.pro/?gclid=G1&utm_source=google&utm_medium=cpc",
    referrer: "https://www.google.com/search?q=air-conditioning",
    gclid: "G1",
    gbraid: null,
    wbraid: null,
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "repair",
    utm_id: null,
    utm_term: null,
    utm_content: null,
  },
  last_touch: {
    captured_at: "2026-08-24T01:00:00.000Z",
    landing_url: "https://www.xusen.pro/services/ac-repair/",
    referrer: "https://www.google.com/",
    gclid: "G2",
    gbraid: null,
    wbraid: null,
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "repair",
    utm_id: null,
    utm_term: null,
    utm_content: null,
  },
});

test("server attribution validation allowlists fields and minimizes URLs", () => {
  const result = validateAttributionPayload(validAttributionPayload());
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.first_touch.landing_path, "/");
  assert.equal(result.value.first_touch.referrer_origin, "https://www.google.com");
  assert.equal(result.value.last_touch.landing_path, "/services/ac-repair/");
  assert.equal("landing_url" in result.value.first_touch, false);

  const withPii = validateAttributionPayload({
    ...validAttributionPayload(),
    phone: "08-7552260",
  });
  assert.deepEqual(withPii, { ok: false, code: "UNSUPPORTED_FIELD" });

  const injection = validateAttributionPayload({
    ...validAttributionPayload(),
    session_id: "' OR 1=1 --",
  });
  assert.deepEqual(injection, { ok: false, code: "INVALID_SESSION_ID" });
});

test("lead token request validation rejects invalid channels, PII, and injection-shaped IDs", () => {
  assert.equal(
    validateLeadTokenRequest({
      request_id: uuid,
      session_id: "session-A",
      channel: "line",
    }).ok,
    true
  );
  assert.deepEqual(
    validateLeadTokenRequest({
      request_id: uuid,
      session_id: null,
      channel: "telegram",
    }),
    { ok: false, code: "INVALID_CHANNEL" }
  );
  assert.deepEqual(
    validateLeadTokenRequest({
      request_id: uuid,
      session_id: null,
      channel: "line",
      phone: "08-7552260",
    }),
    { ok: false, code: "UNSUPPORTED_FIELD" }
  );
  assert.deepEqual(
    validateLeadTokenRequest({
      request_id: uuid,
      session_id: "' OR 1=1 --",
      channel: "line",
    }),
    { ok: false, code: "INVALID_SESSION_ID" }
  );
});

test("lead tokens use the documented human-readable format and have no duplicates in a local sample", () => {
  const tokens = Array.from({ length: 500 }, () => generateLeadToken(webcrypto));
  assert.equal(new Set(tokens).size, tokens.length);
  for (const token of tokens) {
    assert.match(token, /^HY-[A-Z2-9_]{10}$/);
    assert.equal(token.slice(3).split("").every((char) => LEAD_TOKEN_ALPHABET.includes(char)), true);
    assert.equal(token.includes("0"), false);
    assert.equal(token.includes("O"), false);
    assert.equal(token.includes("1"), false);
    assert.equal(token.includes("I"), false);
    assert.equal(token.includes("L"), false);
  }
});

test("client server helpers serialize only the C1B1 contract and are opt-in", async () => {
  const record = {
    schema_version: 1,
    session_id: "session-A",
    stored_at: "2026-08-24T00:00:00.000Z",
    first_touch: {
      captured_at: "2026-08-24T00:00:00.000Z",
      landing_url: "https://www.xusen.pro/?gclid=G1",
      referrer: null,
      gclid: "G1",
      gbraid: null,
      wbraid: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_id: null,
      utm_term: null,
      utm_content: null,
    },
    last_touch: {
      captured_at: "2026-08-24T00:00:00.000Z",
      landing_url: "https://www.xusen.pro/?gclid=G1",
      referrer: null,
      gclid: "G1",
      gbraid: null,
      wbraid: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_id: null,
      utm_term: null,
      utm_content: null,
    },
    unexpected: "must-not-serialize",
  } as unknown as AttributionV1;

  const payload = buildServerAttributionPayload(record);
  assert.equal("unexpected" in payload, false);
  assert.equal(payload.session_id, "session-A");

  let syncCalls = 0;
  const fetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
    syncCalls += 1;
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    assert.equal(body.session_id, "session-A");
    assert.equal("phone" in body, false);
    return new Response(JSON.stringify({ session_id: "session-A" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  assert.equal(syncCalls, 0);
  const syncResult = await syncAttributionToServer(record, fetcher);
  assert.equal(syncResult.ok, true);
  assert.equal(syncCalls, 1);

  const leadResult = await issueLeadToken("phone", "session-A", uuid, fetcher);
  assert.equal(leadResult.ok, true);
  assert.equal(syncCalls, 2);
});

test("abuse control fails open only when the deferred binding is absent or unavailable", async () => {
  const request = new Request("https://www.xusen.pro/api/attribution/v1/session");
  assert.deepEqual(await enforceAbuseControl(request), {
    allowed: true,
    mode: "fail-open",
    reason: "REMOTE_BINDING_DEFERRED",
  });

  const limited = await enforceAbuseControl(request, {
    limit: async () => ({ success: false }),
  });
  assert.deepEqual(limited, {
    allowed: false,
    mode: "fail-closed",
    reason: "RATE_LIMITED",
  });

  assert.deepEqual(
    await enforceAbuseControl(request, { limit: async () => ({ success: true }) }),
    { allowed: true, mode: "binding", reason: "ALLOWED" }
  );

  const bindingError = await enforceAbuseControl(request, {
    limit: async () => {
      throw new Error("unavailable");
    },
  });
  assert.deepEqual(bindingError, {
    allowed: true,
    mode: "fail-open",
    reason: "BINDING_ERROR_FAIL_OPEN",
  });
});
