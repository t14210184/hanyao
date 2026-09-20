import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  buildDataManagerUserData,
  ensureEnhancedUserDataSchema,
  GOOGLE_DATA_MANAGER_MAX_USER_IDENTIFIERS,
  normalizeEnhancedHashedIdentifiers,
  snapshotEnhancedUserDataForConversion,
} from "../src/enhanced-user-data.ts";
import { buildDataManagerRequest } from "../src/payload.ts";
import { ingestDataManagerEvent } from "../src/provider.ts";
import type {
  ConversionOutboxRow,
  UploaderConfig,
} from "../src/types.ts";

const EMAIL_HASH = "a".repeat(64);
const PHONE_HASH = "b".repeat(64);
const LATER_HASH = "c".repeat(64);

const baseRow = (
  overrides: Partial<ConversionOutboxRow> = {}
): ConversionOutboxRow => ({
  conversion_id: "conversion-hq06",
  lead_token: "HY-HQ06TEST01",
  conversion_type: "verified_line_contact",
  event_timestamp: "2026-09-20T10:00:00.000Z",
  gclid: "gclid-hq06",
  gbraid: null,
  wbraid: null,
  attribution_touch: "last",
  transaction_id: "hq06-transaction-1",
  destination_key: "HY_VERIFIED_LINE_CONTACT",
  status: "pending",
  retry_count: 0,
  next_retry_at: null,
  last_error_code: null,
  created_at: "2026-09-20T10:00:00.000Z",
  sent_at: null,
  submitted_at: null,
  google_request_id: null,
  next_diagnostic_at: null,
  terminal_result: null,
  last_error_reason: null,
  diagnostic_status: null,
  diagnostic_record_count: null,
  diagnostic_error_reason: null,
  diagnostic_attempt_count: 0,
  updated_at: "2026-09-20T10:00:00.000Z",
  business_conversion_id: "bc-hq06",
  snapshot_version: 1,
  eligibility_rule_version: "v1",
  google_ads_account_id: "4801404246",
  google_ads_conversion_action_id: "7674301565",
  event_source: "MESSAGE",
  lease_generation: 0,
  lease_owner: null,
  lease_expires_at: null,
  ...overrides,
});

const config = (
  overrides: Partial<UploaderConfig> = {}
): UploaderConfig => ({
  googleAdsAccountId: "4801404246",
  googleAdsConversionActionId: "7674301565",
  validateOnly: true,
  enhancedUserDataEnabled: false,
  adUserDataConsentGranted: false,
  terminalRetentionDays: null,
  ...overrides,
});

class SqliteD1Statement {
  db: DatabaseSync;
  sql: string;
  args: unknown[] = [];

  constructor(db: DatabaseSync, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  bind(...args: unknown[]) {
    this.args = args;
    return this;
  }

  async first<T>() {
    return (this.db.prepare(this.sql).get(...this.args) as T | undefined) ?? null;
  }

  async all<T>() {
    return {
      success: true,
      meta: {},
      results: this.db.prepare(this.sql).all(...this.args) as T[],
    };
  }

  async run() {
    const result = this.db.prepare(this.sql).run(...this.args);
    return {
      success: true,
      meta: { changes: Number(result.changes ?? 0) },
      results: [],
    };
  }
}

const sqliteD1 = (db: DatabaseSync) =>
  ({
    prepare(sql: string) {
      return new SqliteD1Statement(db, sql);
    },
    async batch(statements: SqliteD1Statement[]) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
  }) as any;

test("HQ06 user identifiers are bounded, deduplicated, normalized and raw PII is rejected", () => {
  const candidates = [
    { type: "EMAIL_SHA256" as const, hash: EMAIL_HASH.toUpperCase() },
    { type: "EMAIL_SHA256" as const, hash: EMAIL_HASH },
    { type: "PHONE_SHA256" as const, hash: PHONE_HASH },
    { type: "EMAIL_SHA256" as const, hash: "person@example.com" },
    { type: "PHONE_SHA256" as const, hash: "0912345678" },
    ...Array.from({ length: 12 }, (_, index) => ({
      type: "EMAIL_SHA256" as const,
      hash: index.toString(16).padStart(64, "0"),
    })),
  ];

  const normalized = normalizeEnhancedHashedIdentifiers(candidates);
  assert.equal(
    normalized.length,
    GOOGLE_DATA_MANAGER_MAX_USER_IDENTIFIERS
  );
  assert.equal(normalized[0].hash, EMAIL_HASH);
  assert.equal(normalized[1].hash, PHONE_HASH);
  assert.equal(
    normalized.some((item) => /@|0912/.test(item.hash)),
    false
  );
  assert.equal(
    normalized.every((item) => /^[0-9a-f]{64}$/.test(item.hash)),
    true
  );
});

test("HQ06 D01 exact-click payload is byte-semantic compatible when feature is disabled", () => {
  const row = baseRow({
    enhanced_user_identifiers: [
      { type: "EMAIL_SHA256", hash: EMAIL_HASH },
    ],
  });

  const request = buildDataManagerRequest(row, config());
  assert.deepEqual(request, {
    destinations: [
      {
        reference: "google-ads-destination",
        loginAccount: {
          accountType: "GOOGLE_ADS",
          accountId: "4801404246",
        },
        operatingAccount: {
          accountType: "GOOGLE_ADS",
          accountId: "4801404246",
        },
        productDestinationId: "7674301565",
      },
    ],
    events: [
      {
        destinationReferences: ["google-ads-destination"],
        transactionId: "hq06-transaction-1",
        eventTimestamp: "2026-09-20T10:00:00.000Z",
        adIdentifiers: { gclid: "gclid-hq06" },
        eventSource: "MESSAGE",
      },
    ],
    validateOnly: true,
  });
});

test("HQ06 D02 consent-gated userData preserves click identity and validateOnly is provider-compatible", async () => {
  const row = baseRow({
    enhanced_user_identifiers: [
      { type: "EMAIL_SHA256", hash: EMAIL_HASH },
      { type: "PHONE_SHA256", hash: PHONE_HASH },
    ],
  });
  const request = buildDataManagerRequest(
    row,
    config({
      enhancedUserDataEnabled: true,
      adUserDataConsentGranted: true,
    })
  );

  assert.equal(request.encoding, "HEX");
  assert.deepEqual(request.events[0].adIdentifiers, {
    gclid: "gclid-hq06",
  });
  assert.deepEqual(request.events[0].userData, {
    userIdentifiers: [
      { emailAddress: EMAIL_HASH },
      { phoneNumber: PHONE_HASH },
    ],
  });
  assert.deepEqual(request.events[0].consent, {
    adUserData: "CONSENT_GRANTED",
  });
  assert.equal(request.events[0].transactionId, "hq06-transaction-1");
  assert.equal(
    request.destinations[0].productDestinationId,
    "7674301565"
  );

  let capturedBody = "";
  const result = await ingestDataManagerEvent(
    "unit-test-access-token",
    request,
    async (_input, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          requestId: null,
          warnings: [],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      );
    }
  );
  assert.equal(request.validateOnly, true);
  assert.equal(result.requestId, null);
  assert.match(capturedBody, /"userData"/);
  assert.doesNotMatch(capturedBody, /person@example\.com|0912345678/);
});

test("HQ06 missing ad-user-data consent omits userData without breaking canonical click lane", () => {
  const row = baseRow({
    enhanced_user_identifiers: [
      { type: "EMAIL_SHA256", hash: EMAIL_HASH },
    ],
  });

  const request = buildDataManagerRequest(
    row,
    config({
      enhancedUserDataEnabled: true,
      adUserDataConsentGranted: false,
    })
  );

  assert.equal(request.events[0].userData, undefined);
  assert.equal(request.events[0].consent, undefined);
  assert.equal(request.encoding, undefined);
  assert.deepEqual(request.events[0].adIdentifiers, {
    gclid: "gclid-hq06",
  });
});

test("HQ06 snapshot freezes identifiers at first claim time and excludes later PII hashes", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE line_events (
      line_event_id TEXT PRIMARY KEY NOT NULL
    );
    CREATE TABLE business_conversions (
      business_conversion_id TEXT PRIMARY KEY NOT NULL,
      subject_kind TEXT NOT NULL,
      subject_key TEXT
    );
    INSERT INTO line_events(line_event_id) VALUES ('le-email'), ('le-phone');
    INSERT INTO business_conversions(
      business_conversion_id, subject_kind, subject_key
    ) VALUES (
      'bc-hq06', 'LINE_USER_HMAC', 'lu_v1_hq06'
    );
  `);

  const d1 = sqliteD1(db);
  await ensureEnhancedUserDataSchema(d1);

  db.prepare(`
    INSERT INTO lead_user_identifiers (
      identifier_id, line_user_key, identifier_type, identifier_hash,
      source_line_event_id, first_seen_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    "id-email",
    "lu_v1_hq06",
    "EMAIL_SHA256",
    EMAIL_HASH,
    "le-email",
    "2026-09-20T09:00:00.000Z",
    "2026-09-20T09:00:00.000Z"
  );

  const first = await snapshotEnhancedUserDataForConversion(
    d1,
    "bc-hq06",
    "2026-09-20T10:00:00.000Z"
  );
  assert.deepEqual(first, [
    { type: "EMAIL_SHA256", hash: EMAIL_HASH },
  ]);

  db.prepare(`
    INSERT INTO lead_user_identifiers (
      identifier_id, line_user_key, identifier_type, identifier_hash,
      source_line_event_id, first_seen_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    "id-phone",
    "lu_v1_hq06",
    "PHONE_SHA256",
    LATER_HASH,
    "le-phone",
    "2026-09-20T11:00:00.000Z",
    "2026-09-20T11:00:00.000Z"
  );

  const second = await snapshotEnhancedUserDataForConversion(
    d1,
    "bc-hq06",
    "2026-09-20T12:00:00.000Z"
  );
  assert.deepEqual(second, first);
});

test("HQ06 helper omits empty or invalid userData", () => {
  assert.equal(buildDataManagerUserData([]), null);
  assert.equal(
    buildDataManagerUserData([
      { type: "EMAIL_SHA256", hash: "raw@example.com" },
    ]),
    null
  );
});
