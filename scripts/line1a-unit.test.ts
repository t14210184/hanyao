import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  selectGoogleAdsAttribution,
  type AttributionSessionRow,
} from "../functions/_lib/attribution.ts";
import {
  extractLeadTokens,
} from "../functions/_lib/lead-token.ts";
import {
  MAX_LINE_WEBHOOK_BODY_BYTES,
  parseLineWebhookPayload,
  readRawRequestBody,
  verifyLineSignature,
} from "../functions/_lib/line-webhook.ts";

const signedBody = (body: string, secret: string): string =>
  createHmac("sha256", secret).update(body).digest("base64");

const session = (overrides: Partial<AttributionSessionRow> = {}) =>
  ({
    session_id: "unit-session",
    schema_version: 1,
    first_captured_at: "2026-08-25T00:00:00.000Z",
    first_landing_path: "/",
    first_referrer_origin: "https://www.google.com",
    first_gclid: "FIRST-GCLID",
    first_gbraid: null,
    first_wbraid: null,
    first_utm_source: "google",
    first_utm_medium: "cpc",
    first_utm_campaign: null,
    first_utm_id: null,
    first_utm_term: null,
    first_utm_content: null,
    last_captured_at: "2026-08-25T00:01:00.000Z",
    last_landing_path: "/",
    last_referrer_origin: "https://www.google.com",
    last_gclid: "LAST-GCLID",
    last_gbraid: null,
    last_wbraid: null,
    last_utm_source: "google",
    last_utm_medium: "cpc",
    last_utm_campaign: null,
    last_utm_id: null,
    last_utm_term: null,
    last_utm_content: null,
    server_created_at: "2026-08-25T00:00:00.000Z",
    server_updated_at: "2026-08-25T00:01:00.000Z",
    expires_at: "2026-11-23T00:01:00.000Z",
    ...overrides,
  }) as AttributionSessionRow;

test("HY parser reuses the published alphabet and deduplicates repeated tokens", () => {
  assert.deepEqual(
    extractLeadTokens("請提供 HY-AAAAAAAAAA，重複 HY-AAAAAAAAAA。"),
    ["HY-AAAAAAAAAA"]
  );
  assert.deepEqual(
    extractLeadTokens("HY-AAAAAAAAAA HY-BBBBBBBBBB"),
    ["HY-AAAAAAAAAA", "HY-BBBBBBBBBB"]
  );
  assert.deepEqual(extractLeadTokens("xHY-AAAAAAAAAA"), []);
  assert.deepEqual(extractLeadTokens("HY-AAAAAAAAAAA"), []);
  assert.deepEqual(extractLeadTokens("HY-AAAAAAAAA0"), []);
  assert.deepEqual(extractLeadTokens("hy-AAAAAAAAAA"), []);
});

test("Google Ads attribution selects one complete touch", () => {
  assert.deepEqual(selectGoogleAdsAttribution(session()), {
    attribution_touch: "last",
    gclid: "LAST-GCLID",
    gbraid: null,
    wbraid: null,
  });
  assert.deepEqual(
    selectGoogleAdsAttribution(
      session({
        last_gclid: null,
        last_gbraid: null,
        last_wbraid: null,
      })
    ),
    {
      attribution_touch: "first",
      gclid: "FIRST-GCLID",
      gbraid: null,
      wbraid: null,
    }
  );
  assert.equal(
    selectGoogleAdsAttribution(
      session({
        first_gclid: null,
        first_gbraid: null,
        first_wbraid: null,
        last_gclid: null,
        last_gbraid: null,
        last_wbraid: null,
      })
    ),
    null
  );
});

test("LINE HMAC verification is raw-byte based and rejects tampering", async () => {
  const secret = "line1a-unit-secret";
  const raw = new TextEncoder().encode('{"events":[]}');
  const signature = signedBody('{"events":[]}', secret);
  assert.equal(await verifyLineSignature(raw, signature, secret), true);
  assert.equal(
    await verifyLineSignature(
      new TextEncoder().encode('{"events":[1]}'),
      signature,
      secret
    ),
    false
  );
  assert.equal(await verifyLineSignature(raw, null, secret), false);
  assert.equal(await verifyLineSignature(raw, "not-base64", secret), false);
});

test("signed payload parsing exposes only bounded event metadata to the processor", () => {
  const body = new TextEncoder().encode(
    JSON.stringify({
      events: [
        {
          type: "message",
          webhookEventId: "unit-event",
          timestamp: 1787616000000,
          source: { type: "user", userId: "raw-user-must-not-persist" },
          message: {
            id: "unit-message",
            type: "text",
            text: "HY-AAAAAAAAAA",
          },
        },
      ],
    })
  );
  const result = parseLineWebhookPayload(body);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.events[0].messageText, "HY-AAAAAAAAAA");
  assert.equal("source" in result.value.events[0], false);
  assert.equal("userId" in result.value.events[0], false);
});

test("raw body reader rejects actual bytes above the 128 KiB limit", async () => {
  const result = await readRawRequestBody(
    new Request("https://www.xusen.pro/api/line/webhook", {
      method: "POST",
      body: "x".repeat(MAX_LINE_WEBHOOK_BODY_BYTES + 1),
    })
  );
  assert.deepEqual(result, {
    ok: false,
    code: "PAYLOAD_TOO_LARGE",
    status: 413,
  });
});
