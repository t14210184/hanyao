import assert from "node:assert/strict";
import test from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  resolveLineIdentityForEvent,
  resolveLineIdentityKeyring,
  type LineIdentityKeyring,
} from "../functions/_lib/line-identity.ts";
import {
  deriveLineUserKey,
  EXPECTED_LINE_DESTINATION,
  processLineWebhookEvent,
  type ParsedLineEvent,
} from "../functions/_lib/line-webhook.ts";

const RAW_USER_ID = "U-RAW-M05-MUST-NOT-PERSIST";
const EVENT_TIME = "2026-09-15T04:00:00.000Z";
const NOW = new Date("2026-09-15T04:01:00.000Z");

const keyring = (): LineIdentityKeyring => ({
  current: { keyId: "v2", secret: "m05-current-secret" },
  previous: { keyId: "v1", secret: "m05-previous-secret" },
});

const event = (overrides: Partial<ParsedLineEvent> = {}): ParsedLineEvent => ({
  webhookEventId: "evt-m05-1",
  eventType: "message",
  messageType: "text",
  messageId: "msg-m05-1",
  messageText: "hello HY-AAAAAAAAAA",
  lineEventTimestamp: EVENT_TIME,
  destination: EXPECTED_LINE_DESTINATION,
  sourceType: "user",
  sourceUserId: RAW_USER_ID,
  isRedelivery: false,
  ...overrides,
});

interface IdentityState {
  existing: {
    line_event_id?: string;
    canonical_fingerprint?: string | null;
    line_user_key: string | null;
    business_subject_key: string | null;
    identity_key_id: string | null;
  } | null;
  claimantKey: string | null;
  activeKeys: Set<string>;
  boundArgs: unknown[][];
  insertedArgs: unknown[] | null;
}

class IdentityStatement {
  args: unknown[] = [];
  readonly sql: string;
  private readonly state: IdentityState;

  constructor(sql: string, state: IdentityState) {
    this.sql = sql;
    this.state = state;
  }

  bind(...args: unknown[]) {
    this.args = args;
    this.state.boundArgs.push(args);
    return this;
  }

  async first<T>(): Promise<T | null> {
    if (this.sql.includes("FROM line_events WHERE webhook_event_id")) {
      return this.state.existing as T | null;
    }
    if (this.sql.includes("FROM token_claims WHERE lead_token")) {
      return (this.state.claimantKey
        ? { claimant_key: this.state.claimantKey }
        : null) as T | null;
    }
    if (this.sql.includes("FROM business_conversion_dedupe_locks")) {
      const subjectKey = String(this.args[0] ?? "");
      return (this.state.activeKeys.has(subjectKey)
        ? { subject_key: subjectKey }
        : null) as T | null;
    }
    if (this.sql.includes("SELECT line_event_id FROM line_events")) {
      return (this.state.existing?.line_event_id
        ? { line_event_id: this.state.existing.line_event_id }
        : null) as T | null;
    }
    throw new Error(`M05_UNEXPECTED_QUERY:${this.sql}`);
  }
}

const identityDatabase = (state: IdentityState): D1Database => ({
  prepare(sql: string) {
    return new IdentityStatement(sql, state);
  },
  async batch(statements: IdentityStatement[]) {
    const first = statements[0];
    state.insertedArgs = [...first.args];
    state.existing = {
      line_event_id: String(first.args[0]),
      canonical_fingerprint: String(first.args[26]),
      line_user_key: first.args[9] as string | null,
      business_subject_key: first.args[18] as string | null,
      identity_key_id: first.args[15] as string | null,
    };
    return statements.map((_, index) => ({
      success: true,
      meta: { changes: index === 0 ? 1 : 0 },
      results: [],
    }));
  },
} as unknown as D1Database);

test("M05 keyring defaults the existing single secret to explicit v1", () => {
  const resolved = resolveLineIdentityKeyring({
    LINE_USER_KEY_HMAC_SECRET: "legacy-production-secret",
  });
  assert.equal(resolved?.current.keyId, "v1");
  assert.equal(resolved?.current.secret, "legacy-production-secret");
  assert.equal(resolved?.previous, null);
});

test("M05 keyring fails closed on incomplete or ambiguous rotation config", () => {
  assert.throws(
    () => resolveLineIdentityKeyring({
      LINE_USER_KEY_HMAC_SECRET: "current",
      LINE_USER_KEY_HMAC_PREVIOUS_KEY_ID: "v1",
    }),
    /LINE_IDENTITY_PREVIOUS_KEY_INCOMPLETE/
  );
  assert.throws(
    () => resolveLineIdentityKeyring({
      LINE_USER_KEY_HMAC_SECRET: "same-secret",
      LINE_USER_KEY_HMAC_KEY_ID: "v2",
      LINE_USER_KEY_HMAC_PREVIOUS_KEY_ID: "v1",
      LINE_USER_KEY_HMAC_PREVIOUS_SECRET: "same-secret",
    }),
    /LINE_IDENTITY_SECRET_REUSED/
  );
});

test("M05 active dedupe preserves the previous pseudonymous customer identity", async () => {
  const keys = keyring();
  const previousKey = await deriveLineUserKey(RAW_USER_ID, keys.previous!.secret);
  const state: IdentityState = {
    existing: null,
    claimantKey: null,
    activeKeys: new Set([previousKey]),
    boundArgs: [],
    insertedArgs: null,
  };
  const resolved = await resolveLineIdentityForEvent(
    identityDatabase(state),
    event(),
    keys
  );
  assert.equal(resolved.keyId, "v1");
  assert.equal(resolved.lineUserKey, previousKey);
  assert.equal(resolved.source, "ACTIVE_DEDUPE");
  assert.equal(
    state.boundArgs.flat().some((value) => value === RAW_USER_ID),
    false
  );
});

test("M05 token claimant continuity outranks a fresh current-key identity", async () => {
  const keys = keyring();
  const previousKey = await deriveLineUserKey(RAW_USER_ID, keys.previous!.secret);
  const state: IdentityState = {
    existing: null,
    claimantKey: previousKey,
    activeKeys: new Set(),
    boundArgs: [],
    insertedArgs: null,
  };
  const resolved = await resolveLineIdentityForEvent(
    identityDatabase(state),
    event(),
    keys
  );
  assert.equal(resolved.keyId, "v1");
  assert.equal(resolved.source, "TOKEN_CLAIM");
});

test("M05 conflicting current and previous identity evidence fails closed", async () => {
  const keys = keyring();
  const currentKey = await deriveLineUserKey(RAW_USER_ID, keys.current.secret);
  const previousKey = await deriveLineUserKey(RAW_USER_ID, keys.previous!.secret);
  const state: IdentityState = {
    existing: null,
    claimantKey: currentKey,
    activeKeys: new Set([previousKey]),
    boundArgs: [],
    insertedArgs: null,
  };
  await assert.rejects(
    resolveLineIdentityForEvent(identityDatabase(state), event(), keys),
    /LINE_IDENTITY_ROTATION_AMBIGUOUS/
  );
});

test("M05 redelivery after rotation reuses the previous key and fingerprint", async () => {
  const keys = keyring();
  const state: IdentityState = {
    existing: null,
    claimantKey: null,
    activeKeys: new Set(),
    boundArgs: [],
    insertedArgs: null,
  };
  const database = identityDatabase(state);
  const original = event({
    eventType: "follow",
    messageType: null,
    messageId: null,
    messageText: null,
  });

  const first = await processLineWebhookEvent(
    database,
    original,
    keys.previous!.secret,
    NOW,
    keys.previous!.keyId
  );
  assert.equal(first, "ignored");
  assert.equal(state.existing?.identity_key_id, "v1");
  assert.equal(
    state.insertedArgs?.some((value) => value === RAW_USER_ID),
    false
  );

  const resolved = await resolveLineIdentityForEvent(
    database,
    { ...original, isRedelivery: true },
    keys
  );
  assert.equal(resolved.keyId, "v1");
  assert.equal(resolved.source, "EXISTING_EVENT");

  const second = await processLineWebhookEvent(
    database,
    { ...original, isRedelivery: true },
    resolved.secret,
    NOW,
    resolved.keyId
  );
  assert.equal(second, "duplicate");
});
