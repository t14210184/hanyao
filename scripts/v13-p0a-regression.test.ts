import assert from "node:assert/strict";
import test from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type { AttributionSessionRow } from "../functions/_lib/attribution.ts";
import { createLeadAttributionSnapshot } from "../functions/_lib/lead-attribution-snapshot.ts";
import {
  EXPECTED_LINE_DESTINATION,
  processLineWebhookEvent,
  type ParsedLineEvent,
} from "../functions/_lib/line-webhook.ts";

const TOKEN = "HY-AAAAAAAAAA";
const SESSION = "p0a-session";
const ISSUED_AT = "2026-09-09T00:00:00.000Z";

const session = (gclid: string): AttributionSessionRow => ({
  session_id: SESSION,
  last_gclid: gclid,
  last_gbraid: null,
  last_wbraid: null,
  last_captured_at: "2026-09-09T00:00:00.000Z",
  first_gclid: null,
  first_gbraid: null,
  first_wbraid: null,
  first_captured_at: null,
  server_updated_at: "2026-09-09T00:00:00.000Z",
  expires_at: "2026-12-09T00:00:00.000Z",
} as AttributionSessionRow);
interface FakeState {
  lead: Record<string, unknown>;
  existing: { line_event_id: string; canonical_fingerprint: string } | null;
  attributionSessionReads: number;
  canonicalBatchCalls: number;
  shadowBatchCalls: number;
}

class FakeStatement {
  args: unknown[] = [];
  readonly sql: string;
  private readonly state: FakeState;
  constructor(sql: string, state: FakeState) {
    this.sql = sql;
    this.state = state;
  }
  bind(...args: unknown[]) {
    this.args = args;
    return this;
  }
  async first<T>() {
    if (this.sql.includes("FROM lead_tokens WHERE lead_token")) {
      return this.state.lead as T;
    }
    if (this.sql.includes("FROM attribution_sessions")) {
      this.state.attributionSessionReads += 1;
      throw new Error("P0A_REGRESSION_READ_MUTABLE_SESSION");
    }
    if (this.sql.includes("canonical_outbox_delivery_config")) {
      return {
        projector_cutover_at: "2026-10-01T00:00:00.000Z",
        eligibility_rule_version: "v1",
      } as T;
    }
    if (this.sql.includes("FROM line_events WHERE webhook_event_id")) {
      return this.state.existing as T | null;
    }
    if (this.sql.includes("SELECT line_event_id FROM line_events")) {
      return (this.state.existing
        ? { line_event_id: this.state.existing.line_event_id }
        : null) as T | null;
    }
    throw new Error(`Unexpected first(): ${this.sql}`);
  }
}

const fakeDatabase = (state: FakeState): D1Database => ({
  prepare(sql: string) {
    return new FakeStatement(sql, state);
  },
  async batch(statements: FakeStatement[]) {
    const first = statements[0];
    if (first.sql.includes("lead_signal_observations")) {
      state.shadowBatchCalls += 1;
      return statements.map((_, index) => ({
        success: true,
        meta: { changes: index === 0 ? 1 : 0 },
        results: [],
      }));
    }
    state.canonicalBatchCalls += 1;
    state.existing = {
      line_event_id: String(first.args[0]),
      canonical_fingerprint: String(first.args[26]),
    };
    return statements.map((_, index) => ({
      success: true,
      meta: { changes: index === 0 ? 1 : 0 },
      results: [],
    }));
  },
} as unknown as D1Database);
test("P0-A freezes attribution at token issuance and redelivery never rereads session", async () => {
  const frozen = await createLeadAttributionSnapshot(session("GCLID-A"), ISSUED_AT);
  const state: FakeState = {
    lead: {
      lead_token: TOKEN,
      session_id: SESSION,
      channel: "line",
      status: "issued",
      attribution_snapshot_json: frozen.json,
      attribution_snapshot_hash: frozen.hash,
      lineage_rule_version: frozen.ruleVersion,
    },
    existing: null,
    attributionSessionReads: 0,
    canonicalBatchCalls: 0,
    shadowBatchCalls: 0,
  };
  const database = fakeDatabase(state);
  const event: ParsedLineEvent = {
    webhookEventId: "evt-p0a-1",
    eventType: "message",
    messageType: "text",
    messageId: "msg-p0a-1",
    messageText: `hello ${TOKEN}`,
    lineEventTimestamp: "2026-09-10T00:00:00.000Z",
    destination: EXPECTED_LINE_DESTINATION,
    sourceType: "user",
    sourceUserId: "U-P0A-TEST",
    isRedelivery: false,
  };
  const first = await processLineWebhookEvent(database, event, "p0a-secret");
  assert.equal(first, "ignored");
  assert.equal(state.attributionSessionReads, 0);
  assert.equal(state.canonicalBatchCalls, 1);
  assert.equal(state.shadowBatchCalls, 1);
  const firstFingerprint = state.existing?.canonical_fingerprint;
  assert.ok(firstFingerprint);

  // Simulate a later mutation in attribution_sessions. The webhook path must not care.
  const mutatedLiveSession = session("GCLID-B");
  assert.equal(mutatedLiveSession.last_gclid, "GCLID-B");

  const second = await processLineWebhookEvent(
    database,
    { ...event, isRedelivery: true },
    "p0a-secret"
  );
  assert.equal(second, "duplicate");
  assert.equal(state.attributionSessionReads, 0);
  assert.equal(state.canonicalBatchCalls, 1);
  assert.equal(state.shadowBatchCalls, 2);
  assert.equal(state.existing?.canonical_fingerprint, firstFingerprint);
});
