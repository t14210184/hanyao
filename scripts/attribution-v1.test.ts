import assert from "node:assert/strict";
import test from "node:test";
import {
  ATTRIBUTION_STORAGE_KEY,
  captureAttribution,
  isAttributionExpired,
  loadAttribution,
  parseAttributionFromUrl,
  type AttributionV1,
} from "../src/lib/attribution.ts";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const cryptoSource = (sessionId: string) => ({
  randomUUID: () => sessionId,
  getRandomValues: <T extends ArrayBufferView>(array: T) => array,
});
const at = (value: string) => new Date(value);

test("parses gclid, braid identifiers, and all UTM fields without inventing values", () => {
  const touch = parseAttributionFromUrl(
    "https://www.xusen.pro/?gclid=TEST_A&gbraid=TEST_GBRAID&wbraid=TEST_WBRAID&utm_source=google&utm_medium=cpc&utm_campaign=repair&utm_id=campaign-1&utm_term=air&utm_content=text",
    "https://www.google.com/",
    "2026-08-24T00:00:00.000Z"
  );

  assert.deepEqual(touch, {
    captured_at: "2026-08-24T00:00:00.000Z",
    landing_url:
      "https://www.xusen.pro/?gclid=TEST_A&gbraid=TEST_GBRAID&wbraid=TEST_WBRAID&utm_source=google&utm_medium=cpc&utm_campaign=repair&utm_id=campaign-1&utm_term=air&utm_content=text",
    referrer: "https://www.google.com/",
    gclid: "TEST_A",
    gbraid: "TEST_GBRAID",
    wbraid: "TEST_WBRAID",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "repair",
    utm_id: "campaign-1",
    utm_term: "air",
    utm_content: "text",
  });

  assert.equal(parseAttributionFromUrl("not a URL"), null);
  assert.equal(
    parseAttributionFromUrl("https://www.xusen.pro/services/ac-repair"),
    null
  );
});

test("preserves first touch, updates last touch, and keeps untagged navigation stable", () => {
  const storage = new MemoryStorage();
  const first = captureAttribution({
    url: "https://www.xusen.pro/?gclid=TEST_A&utm_source=google&utm_medium=cpc",
    referrer: "https://www.google.com/",
    now: at("2026-08-24T00:00:00.000Z"),
    storage,
    crypto: cryptoSource("session-a") as Crypto,
  });

  assert.ok(first);
  assert.equal(first.session_id, "session-a");
  assert.equal(first.first_touch.gclid, "TEST_A");
  assert.equal(first.last_touch.gclid, "TEST_A");

  const untagged = captureAttribution({
    url: "https://www.xusen.pro/services/ac-repair",
    now: at("2026-08-24T00:01:00.000Z"),
    storage,
    crypto: cryptoSource("should-not-be-used") as Crypto,
  });
  assert.ok(untagged);
  assert.equal(untagged.session_id, "session-a");
  assert.equal(untagged.first_touch.gclid, "TEST_A");
  assert.equal(untagged.last_touch.gclid, "TEST_A");

  const second = captureAttribution({
    url: "https://www.xusen.pro/?gclid=TEST_B",
    now: at("2026-08-24T01:00:00.000Z"),
    storage,
    crypto: cryptoSource("should-not-be-used") as Crypto,
  });
  assert.ok(second);
  assert.equal(second.session_id, "session-a");
  assert.equal(second.first_touch.gclid, "TEST_A");
  assert.equal(second.last_touch.gclid, "TEST_B");
});

test("supports gbraid-only and wbraid-only landings", () => {
  const gbraidStorage = new MemoryStorage();
  const gbraidRecord = captureAttribution({
    url: "https://www.xusen.pro/?gbraid=TEST_GBRAID",
    storage: gbraidStorage,
    now: at("2026-08-24T00:00:00.000Z"),
    crypto: cryptoSource("session-g") as Crypto,
  });
  assert.ok(gbraidRecord);
  assert.equal(gbraidRecord.first_touch.gbraid, "TEST_GBRAID");
  assert.equal(gbraidRecord.first_touch.gclid, null);

  const wbraidStorage = new MemoryStorage();
  const wbraidRecord = captureAttribution({
    url: "https://www.xusen.pro/?wbraid=TEST_WBRAID",
    storage: wbraidStorage,
    now: at("2026-08-24T00:00:00.000Z"),
    crypto: cryptoSource("session-w") as Crypto,
  });
  assert.ok(wbraidRecord);
  assert.equal(wbraidRecord.first_touch.wbraid, "TEST_WBRAID");
  assert.equal(wbraidRecord.first_touch.gclid, null);
});

test("creates a source-empty record without fabricating gclid or UTM values", () => {
  const storage = new MemoryStorage();
  const record = captureAttribution({
    url: "https://www.xusen.pro/contact/",
    storage,
    now: at("2026-08-24T00:00:00.000Z"),
    crypto: cryptoSource("session-empty") as Crypto,
  });

  assert.ok(record);
  assert.equal(record.first_touch.gclid, null);
  assert.equal(record.first_touch.utm_source, null);
  assert.equal(record.last_touch.wbraid, null);
  assert.equal(record.schema_version, 1);
});

test("reinitializes after retention expiry", () => {
  const storage = new MemoryStorage();
  const first = captureAttribution({
    url: "https://www.xusen.pro/?gclid=TEST_A",
    storage,
    now: at("2026-01-01T00:00:00.000Z"),
    crypto: cryptoSource("session-old") as Crypto,
  });
  assert.ok(first);
  assert.equal(isAttributionExpired(first, at("2026-04-01T00:00:00.000Z")), true);

  const refreshed = captureAttribution({
    url: "https://www.xusen.pro/contact/",
    storage,
    now: at("2026-04-01T00:00:00.000Z"),
    crypto: cryptoSource("session-new") as Crypto,
  });
  assert.ok(refreshed);
  assert.equal(refreshed.session_id, "session-new");
  assert.equal(refreshed.first_touch.gclid, null);
});

test("malformed storage is fail-safe and rebuilt", () => {
  const storage = new MemoryStorage();
  storage.setItem(ATTRIBUTION_STORAGE_KEY, "{not-json");

  assert.doesNotThrow(() =>
    loadAttribution(storage)
  );

  const record = captureAttribution({
    url: "https://www.xusen.pro/?gclid=TEST_RECOVER",
    storage,
    now: at("2026-08-24T00:00:00.000Z"),
    crypto: cryptoSource("session-recovered") as Crypto,
  });
  assert.ok(record);
  assert.equal(record.first_touch.gclid, "TEST_RECOVER");
  assert.equal(loadAttribution(storage)?.session_id, "session-recovered");
});

test("blocked storage and SSR calls do not crash", () => {
  const blockedStorage = {
    getItem: () => {
      throw new Error("storage blocked");
    },
    setItem: () => {
      throw new Error("storage blocked");
    },
  } as unknown as Storage;

  assert.doesNotThrow(() =>
    captureAttribution({
      url: "https://www.xusen.pro/?gclid=TEST_PRIVATE",
      storage: blockedStorage,
      now: at("2026-08-24T00:00:00.000Z"),
      crypto: cryptoSource("session-private") as Crypto,
    })
  );
  assert.equal(captureAttribution(), null);
});
