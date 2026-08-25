import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildGenericLineMessage,
  buildLineOaMessageUrl,
  createLinePrepareRequestId,
  isMobileLineClient,
  isOfficialLineProfileUrl,
  prepareLineLead,
  type LinePreparePayload,
} from "../src/lib/line-contact.ts";
import { trackLineContactAttempt } from "../src/lib/tracking.ts";

const requestId = "11111111-1111-4111-8111-111111111111";
const token = "HY-ABCDEFG234";
const attribution = {
  schema_version: 1 as const,
  session_id: "session-line1b2a",
  stored_at: "2026-08-25T00:00:00.000Z",
  first_touch: {
    captured_at: "2026-08-25T00:00:00.000Z",
    landing_url: "https://www.xusen.pro/?gclid=TEST",
    referrer: "https://www.google.com/",
    gclid: "TEST",
    gbraid: null,
    wbraid: null,
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "line",
    utm_id: null,
    utm_term: null,
    utm_content: null,
  },
  last_touch: {
    captured_at: "2026-08-25T00:00:00.000Z",
    landing_url: "https://www.xusen.pro/?gclid=TEST",
    referrer: "https://www.google.com/",
    gclid: "TEST",
    gbraid: null,
    wbraid: null,
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "line",
    utm_id: null,
    utm_term: null,
    utm_content: null,
  },
};

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("creates UUID v4 request IDs and exact official LINE URLs", () => {
  const id = createLinePrepareRequestId();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(id, createLinePrepareRequestId());
  assert.equal(
    isOfficialLineProfileUrl("https://line.me/R/ti/p/@451vpomq"),
    true
  );
  assert.equal(isOfficialLineProfileUrl("https://example.com/line"), false);

  const message = buildGenericLineMessage(token);
  assert.ok(message);
  assert.match(message, /HY-ABCDEFG234/);
  assert.equal(buildGenericLineMessage("HY-FAKE"), null);
  const url = buildLineOaMessageUrl(message);
  assert.match(url, /^https:\/\/line\.me\/R\/oaMessage\/%40451vpomq\/\?/);
  assert.equal(url.includes("line://"), false);
  assert.equal(url.includes(encodeURIComponent(message)), true);
});

test("detects phones and iPadOS desktop mode without using viewport width", () => {
  assert.equal(
    isMobileLineClient({ userAgent: "Mozilla/5.0 (Linux; Android 14)", maxTouchPoints: 0 }),
    true
  );
  assert.equal(
    isMobileLineClient({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)", maxTouchPoints: 5 }),
    true
  );
  assert.equal(
    isMobileLineClient({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)", maxTouchPoints: 0 }),
    false
  );
  assert.equal(
    isMobileLineClient({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", maxTouchPoints: 10 }),
    false
  );
});

test("posts only request_id and attribution and validates prepared responses", async () => {
  const calls: Array<{ url: string; body: LinePreparePayload; init: RequestInit }> = [];
  const prepared = await prepareLineLead({
    requestId,
    attribution,
    endpoint: "/api/line/prepare",
    fetchImpl: async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)) as LinePreparePayload,
        init: init ?? {},
      });
      return response({ status: "prepared", lead_token: token });
    },
  });

  assert.deepEqual(prepared, { status: "prepared", lead_token: token });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/line/prepare");
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["attribution", "request_id"]);
  assert.deepEqual(calls[0].body, { request_id: requestId, attribution });
  assert.equal(String(calls[0].init.body).includes("08-7552260"), false);
  assert.equal(String(calls[0].init.body).includes("姓名"), false);
});

test("retries transient failure with the same request ID and exact attribution snapshot", async () => {
  const bodies: string[] = [];
  let attempt = 0;
  const prepared = await prepareLineLead({
    requestId,
    attribution,
    fetchImpl: async (_input, init) => {
      bodies.push(String(init?.body));
      attempt += 1;
      return attempt === 1
        ? response({ error: "temporary" }, 500)
        : response({ status: "prepared", lead_token: token });
    },
  });

  assert.deepEqual(prepared, { status: "prepared", lead_token: token });
  assert.equal(attempt, 2);
  assert.equal(bodies[0], bodies[1]);
});

test("malformed or unavailable prepare responses fail open without a fake token", async () => {
  const malformed = await prepareLineLead({
    requestId,
    attribution: null,
    fetchImpl: async () => response({ status: "prepared", lead_token: "HY-client-fake" }),
  });
  assert.equal(malformed, null);

  const notFound = await prepareLineLead({
    requestId,
    attribution: null,
    fetchImpl: async () => response({ error: "missing" }, 404),
  });
  assert.equal(notFound, null);
  assert.equal(buildGenericLineMessage(null), null);

  const timedOut = await prepareLineLead({
    requestId,
    attribution: null,
    timeoutMs: 20,
    fetchImpl: async () => new Promise<Response>(() => undefined),
  });
  assert.equal(timedOut, null);
});

test("diagnostic line_contact_attempt emits once for one link intent", () => {
  const previousWindow = (globalThis as unknown as { window?: unknown }).window;
  const values = new Map<string, string>();
  const dataLayer: Array<Record<string, unknown>> = [];
  const windowStub = {
    location: { pathname: "/services/ac-repair/" },
    dataLayer,
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  };

  (globalThis as unknown as { window?: unknown }).window = windowStub;
  try {
    trackLineContactAttempt({
      contact_method: "line_link_open",
      lead_id: token,
      event_source: "service_page",
    });
    trackLineContactAttempt({
      contact_method: "line_link_open",
      lead_id: token,
      event_source: "service_page",
    });

    assert.equal(dataLayer.length, 1);
    assert.equal(dataLayer[0].event, "line_contact_attempt");
    assert.equal(dataLayer[0].lead_id, token);
    assert.equal("phone" in dataLayer[0], false);
    assert.equal("message" in dataLayer[0], false);
  } finally {
    if (previousWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window?: unknown }).window = previousWindow;
    }
  }
});

test("source boundary removes the browser-generated LINE lead ID", () => {
  const contactForm = readFileSync("src/components/ContactForm.tsx", "utf8");
  const ctaButton = readFileSync("src/components/CTAButton.tsx", "utf8");
  assert.equal(contactForm.includes("generateLeadId"), false);
  assert.match(contactForm, /prepareLineLead/);
  assert.match(contactForm, /【詢價編號】/);
  assert.match(contactForm, /window\.location\.assign/);
  assert.match(contactForm, /DESKTOP_CROSS_DEVICE_TOKEN_HANDOFF_PENDING/);
  assert.match(ctaButton, /e\.preventDefault\(\)/);
  assert.match(ctaButton, /window\.location\.assign/);
  assert.equal(ctaButton.includes("window.open"), false);
});
