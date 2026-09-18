import assert from "node:assert/strict";
import test from "node:test";
import {
  ATTRIBUTION_SCHEMA_VERSION,
  getSafeAttributionAnalyticsDimensions,
  type AttributionV1,
} from "../src/lib/attribution.ts";

const record = (
  overrides: Partial<AttributionV1["last_touch"]> = {}
): AttributionV1 => ({
  schema_version: ATTRIBUTION_SCHEMA_VERSION,
  session_id: "session-secret-must-not-leak",
  stored_at: "2026-09-18T08:30:00.000Z",
  first_touch: {
    captured_at: "2026-09-18T08:29:00.000Z",
    landing_url: "https://www.xusen.pro/",
    referrer: "https://google.com",
    gclid: "first-gclid-secret",
    gbraid: null,
    wbraid: null,
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "repair",
    utm_id: "111111111",
    utm_term: "冷氣維修",
    utm_content: null,
  },
  last_touch: {
    captured_at: "2026-09-18T08:30:00.000Z",
    landing_url: "https://www.xusen.pro/services/ac-repair/",
    referrer: "https://google.com",
    gclid: "last-gclid-secret",
    gbraid: "gbraid-secret",
    wbraid: "wbraid-secret",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "repair-search",
    utm_id: "222222222",
    utm_term: "冷氣漏水",
    utm_content: "rsa-a",
    ...overrides,
  },
});

test("WP01 exposes only pathname and verified numeric UTM campaign identity", () => {
  assert.deepEqual(getSafeAttributionAnalyticsDimensions(record()), {
    landing_path: "/services/ac-repair/",
    campaign_id: "222222222",
  });
});

test("WP01 never derives campaign identity from click IDs or arbitrary campaign labels", () => {
  const dims = getSafeAttributionAnalyticsDimensions(
    record({ utm_id: "repair-search-campaign" })
  );
  assert.deepEqual(dims, {
    landing_path: "/services/ac-repair/",
  });
  assert.equal("gclid" in dims, false);
  assert.equal("gbraid" in dims, false);
  assert.equal("wbraid" in dims, false);
  assert.equal("session_id" in dims, false);
  assert.equal("utm_campaign" in dims, false);
});

test("WP01 strips query and fragment from diagnostic landing path", () => {
  assert.deepEqual(
    getSafeAttributionAnalyticsDimensions(
      record({
        landing_url:
          "https://www.xusen.pro/services/ac-repair/?gclid=secret#section",
      })
    ),
    {
      landing_path: "/services/ac-repair/",
      campaign_id: "222222222",
    }
  );
});

test("WP01 returns no attribution dimensions without a usable attribution record", () => {
  assert.deepEqual(getSafeAttributionAnalyticsDimensions(null), {});
});

test("WP01 falls back to first touch when last touch has no attribution source", () => {
  const value = record({
    captured_at: null,
    landing_url: null,
    referrer: null,
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

  assert.deepEqual(getSafeAttributionAnalyticsDimensions(value), {
    landing_path: "/",
    campaign_id: "111111111",
  });
});
