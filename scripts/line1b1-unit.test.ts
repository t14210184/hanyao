import assert from "node:assert/strict";
import test from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  isLeadTokenIdempotencyMatch,
  issueLeadToken,
  LeadTokenIdempotencyConflictError,
  type LeadTokenRow,
} from "../functions/_lib/lead-token.ts";
import { validateLinePreparePayload } from "../functions/_lib/line-prepare.ts";
import { readJsonBody } from "../functions/_lib/http.ts";

const uuid = "11111111-1111-4111-8111-111111111111";

const touch = (clickField: "gclid" | "gbraid" | "wbraid", value: string) => ({
  captured_at: "2026-08-25T00:00:00.000Z",
  landing_url: `https://www.xusen.pro/?${clickField}=${value}`,
  referrer: "https://www.google.com/",
  gclid: clickField === "gclid" ? value : null,
  gbraid: clickField === "gbraid" ? value : null,
  wbraid: clickField === "wbraid" ? value : null,
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "line",
  utm_id: null,
  utm_term: null,
  utm_content: null,
});

const attribution = (sessionId: string, clickField: "gclid" | "gbraid" | "wbraid", value: string) => {
  const selectedTouch = touch(clickField, value);
  return {
    schema_version: 1,
    session_id: sessionId,
    stored_at: "2026-08-25T00:00:00.000Z",
    first_touch: selectedTouch,
    last_touch: selectedTouch,
  };
};

test("LINE prepare validation accepts attributed and unattributed contracts", () => {
  for (const [field, value] of [
    ["gclid", "G-UNIT"],
    ["gbraid", "GB-UNIT"],
    ["wbraid", "WB-UNIT"],
  ] as const) {
    const result = validateLinePreparePayload({
      request_id: uuid,
      attribution: attribution(`session-${field}`, field, value),
    });
    assert.equal(result.ok, true, field);
  }

  assert.deepEqual(
    validateLinePreparePayload({ request_id: uuid, attribution: null }),
    { ok: true, value: { request_id: uuid, attribution: null } }
  );
});

test("LINE prepare validation is strict and rejects PII or invalid attribution", () => {
  const valid = attribution("session-strict", "gclid", "G-STRICT");
  assert.deepEqual(
    validateLinePreparePayload({
      request_id: uuid,
      attribution: null,
      phone: "08-7552260",
    }),
    { ok: false, code: "UNSUPPORTED_FIELD" }
  );
  assert.deepEqual(
    validateLinePreparePayload({
      request_id: uuid,
      attribution: { ...valid, message: "must not be accepted" },
    }),
    { ok: false, code: "UNSUPPORTED_FIELD" }
  );
  assert.deepEqual(
    validateLinePreparePayload({
      request_id: uuid,
      attribution: { ...valid, session_id: "' OR 1=1 --" },
    }),
    { ok: false, code: "INVALID_SESSION_ID" }
  );
  assert.deepEqual(
    validateLinePreparePayload({ request_id: "not-v4", attribution: null }),
    { ok: false, code: "INVALID_REQUEST_ID" }
  );
});

test("LINE prepare body reader requires application/json while allowing charset", async () => {
  const missing = await readJsonBody(
    new Request("https://www.xusen.pro/api/line/prepare", {
      method: "POST",
      body: "{}",
    })
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.response.status, 415);

  const wrong = await readJsonBody(
    new Request("https://www.xusen.pro/api/line/prepare", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "{}",
    })
  );
  assert.equal(wrong.ok, false);
  if (!wrong.ok) assert.equal(wrong.response.status, 415);

  const valid = await readJsonBody(
    new Request("https://www.xusen.pro/api/line/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: "{}",
    })
  );
  assert.deepEqual(valid, { ok: true, value: {} });
});

const fakeDatabase = (sessionIds: string[]): D1Database => {
  const availableSessions = new Set(sessionIds);
  let lead: LeadTokenRow | null = null;

  const database = {
    prepare(sql: string) {
      let parameters: unknown[] = [];
      const statement = {
        bind(...values: unknown[]) {
          parameters = values;
          return statement;
        },
        async first<T>() {
          if (sql.includes("FROM lead_tokens WHERE request_id")) {
            return (lead?.request_id === parameters[0] ? lead : null) as T | null;
          }
          if (sql.includes("FROM attribution_sessions")) {
            return (availableSessions.has(String(parameters[0]))
              ? { session_id: parameters[0] }
              : null) as T | null;
          }
          if (sql.includes("FROM lead_tokens WHERE lead_token")) {
            return (lead?.lead_token === parameters[0] ? lead : null) as T | null;
          }
          throw new Error(`Unexpected fake D1 first query: ${sql}`);
        },
        async run() {
          if (!sql.includes("INSERT INTO lead_tokens")) {
            throw new Error(`Unexpected fake D1 run query: ${sql}`);
          }
          if (lead) throw new Error("UNIQUE_REQUEST_ID");
          lead = {
            lead_token: String(parameters[0]),
            request_id: String(parameters[1]),
            session_id: parameters[2] as string | null,
            channel: parameters[3] as LeadTokenRow["channel"],
            status: "issued",
            server_created_at: String(parameters[4]),
          };
          return { success: true, meta: { changes: 1 } };
        },
      };
      return statement;
    },
  };

  return database as unknown as D1Database;
};

const predictableRandom = {
  getRandomValues(bytes: Uint8Array) {
    bytes.fill(0);
    return bytes;
  },
} as Pick<Crypto, "getRandomValues">;

test("lead-token idempotency requires the same session and channel", async () => {
  assert.equal(
    isLeadTokenIdempotencyMatch(
      { session_id: "session-A", channel: "line" },
      { session_id: "session-A", channel: "line" }
    ),
    true
  );
  assert.equal(
    isLeadTokenIdempotencyMatch(
      { session_id: "session-A", channel: "line" },
      { session_id: "session-B", channel: "line" }
    ),
    false
  );
  assert.equal(
    isLeadTokenIdempotencyMatch(
      { session_id: null, channel: "phone" },
      { session_id: null, channel: "line" }
    ),
    false
  );

  const database = fakeDatabase(["session-A", "session-B"]);
  const first = await issueLeadToken(
    database,
    { request_id: uuid, session_id: "session-A", channel: "line" },
    new Date("2026-08-25T00:00:00.000Z"),
    predictableRandom
  );
  const retry = await issueLeadToken(database, {
    request_id: uuid,
    session_id: "session-A",
    channel: "line",
  });
  assert.equal(retry.lead_token, first.lead_token);

  await assert.rejects(
    issueLeadToken(database, {
      request_id: uuid,
      session_id: "session-B",
      channel: "line",
    }),
    (error: unknown) => error instanceof LeadTokenIdempotencyConflictError
  );
  await assert.rejects(
    issueLeadToken(database, {
      request_id: uuid,
      session_id: "session-A",
      channel: "phone",
    }),
    (error: unknown) => error instanceof LeadTokenIdempotencyConflictError
  );
});
