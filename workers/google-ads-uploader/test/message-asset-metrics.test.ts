import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  collectMessageAssetMetrics,
  ensureMessageAssetMetricsTable,
  projectMessageAssetMetricRows,
  readMessageAssetMetrics,
  type MessageAssetMetricRow,
} from "../src/message-asset-metrics.ts";
import type { UploaderEnv } from "../src/types.ts";
import { GOOGLE_OAUTH_TOKEN_URL } from "../src/types.ts";

class FakeStatement {
  sql: string;
  args: unknown[] = [];
  state: FakeState;

  constructor(sql: string, state: FakeState) {
    this.sql = sql;
    this.state = state;
  }

  bind(...args: unknown[]) {
    this.args = args;
    return this;
  }

  async first<T>() {
    if (this.sql.includes("sqlite_master")) {
      return { count: 2 } as T;
    }
    if (this.sql.includes("pragma_table_info")) {
      return { count: 3 } as T;
    }
    if (this.sql.includes("message_asset_metrics_collector_state")) {
      return {
        customer_id: "4801404246",
        last_attempt_at: this.state.lastAttemptAt,
        last_success_at: this.state.lastSuccessAt,
        last_nonempty_at: null,
        last_failure_code: null,
        last_row_count: this.state.lastRowCount,
      } as T;
    }
    throw new Error("UNEXPECTED_FIRST_QUERY");
  }

  async run() {
    if (this.sql.includes("message_asset_metrics_collector_state")) {
      this.state.lastAttemptAt = String(this.args[1]);
      this.state.lastSuccessAt = this.args[2] ? String(this.args[2]) : this.state.lastSuccessAt;
      this.state.lastRowCount = this.args[5] == null ? null : Number(this.args[5]);
    }
    return { success: true, meta: { changes: 1 }, results: [] };
  }
}

interface FakeState {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastRowCount: number | null;
  batches: number;
  projected: unknown[][];
}

const fakeDb = (state: FakeState): D1Database =>
  ({
    prepare(sql: string) {
      return new FakeStatement(sql, state);
    },
    async batch(statements: FakeStatement[]) {
      state.batches += 1;
      for (const statement of statements) {
        if (statement.sql.includes("INSERT INTO message_asset_metrics_daily")) {
          state.projected.push(statement.args);
        }
      }
      return statements.map(() => ({
        success: true,
        meta: { changes: 1 },
        results: [],
      }));
    },
  }) as unknown as D1Database;

const baseEnv = (state: FakeState): UploaderEnv =>
  ({
    ATTRIBUTION_DB: fakeDb(state),
    GOOGLE_ADS_ACCOUNT_ID: "4801404246",
    MESSAGE_ASSET_METRICS_ENABLED: "false",
  }) as UploaderEnv;

const metricRow = (): MessageAssetMetricRow => ({
  metricDate: "2026-09-20",
  customerId: "4801404246",
  campaignId: "123",
  campaignName: "冷氣維修",
  assetId: "999",
  assetResourceName: "customers/4801404246/assets/999",
  campaignAssetResourceName:
    "customers/4801404246/campaignAssets/123~999~BUSINESS_MESSAGE",
  assetStatus: "ENABLED",
  primaryStatus: "ELIGIBLE",
  primaryStatusReasons: [],
  impressions: 20,
  interactions: 3,
  clicks: 2,
  conversions: 1,
  allConversions: 1,
  costMicros: 1200000,
  messageChats: 1,
  messageImpressions: 8,
  messageChatRate: 0.125,
});

const serviceAccountJson = (): string => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return JSON.stringify({
    type: "service_account",
    private_key: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    client_email: "message-metrics-test@example.invalid",
    token_uri: GOOGLE_OAUTH_TOKEN_URL,
  });
};

test("HQ04 metrics lane is fully inert while disarmed", async () => {
  const state: FakeState = {
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastRowCount: null,
    batches: 0,
    projected: [],
  };
  const env = baseEnv(state);
  const result = await collectMessageAssetMetrics(env, {
    now: new Date("2026-09-20T00:00:00.000Z"),
    fetchImpl: async () => {
      throw new Error("FETCH_MUST_NOT_RUN");
    },
  });

  assert.deepEqual(result, {
    state: "DISABLED",
    rowsRead: 0,
    rowsWritten: 0,
    failureCode: null,
  });
  assert.equal(state.batches, 0);
  assert.equal(state.projected.length, 0);
});

test("HQ04 due gate avoids OAuth/provider work within interval", async () => {
  const state: FakeState = {
    lastAttemptAt: "2026-09-20T00:30:00.000Z",
    lastSuccessAt: "2026-09-20T00:30:00.000Z",
    lastRowCount: 1,
    batches: 0,
    projected: [],
  };
  const env = baseEnv(state);
  env.MESSAGE_ASSET_METRICS_ENABLED = "true";
  env.MESSAGE_ASSET_METRICS_MIN_INTERVAL_MINUTES = "60";

  const result = await collectMessageAssetMetrics(env, {
    now: new Date("2026-09-20T01:00:00.000Z"),
    fetchImpl: async () => {
      throw new Error("FETCH_MUST_NOT_RUN");
    },
  });

  assert.equal(result.state, "NOT_DUE");
  assert.equal(state.batches, 0);
  assert.equal(state.projected.length, 0);
});

test("HQ04 D1 projector upserts normalized provider metrics only", async () => {
  const state: FakeState = {
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastRowCount: null,
    batches: 0,
    projected: [],
  };
  const env = baseEnv(state);
  await ensureMessageAssetMetricsTable(env);
  const written = await projectMessageAssetMetricRows(
    env,
    [metricRow()],
    "2026-09-20T01:00:00.000Z"
  );

  assert.equal(written, 1);
  assert.equal(state.projected.length, 1);
  const args = state.projected[0];
  assert.deepEqual(args.slice(0, 6), [
    "2026-09-20",
    "4801404246",
    "123",
    "999",
    "ENABLED",
    "ELIGIBLE",
  ]);
  assert.deepEqual(args.slice(6, 16), [
    20,
    3,
    2,
    1,
    1,
    1200000,
    1,
    8,
    0.125,
    "2026-09-20T01:00:00.000Z",
  ]);
});

test("HQ04 SearchStream reader includes message-native metrics without mutation", async () => {
  const payload = [
    {
      results: [
        {
          segments: { date: "2026-09-20" },
          campaign: { id: "123", name: "冷氣維修" },
          campaignAsset: {
            resourceName:
              "customers/4801404246/campaignAssets/123~999~BUSINESS_MESSAGE",
            asset: "customers/4801404246/assets/999",
            fieldType: "BUSINESS_MESSAGE",
            status: "ENABLED",
            primaryStatus: "ELIGIBLE",
            primaryStatusReasons: [],
          },
          metrics: {
            impressions: "20",
            interactions: "3",
            clicks: "2",
            conversions: "1",
            allConversions: "1",
            costMicros: "1200000",
            messageChats: "1",
            messageImpressions: "8",
            messageChatRate: "0.125",
          },
        },
      ],
    },
  ];

  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const rows = await readMessageAssetMetrics(
    "4801404246",
    "test-token",
    null,
    "2026-09-20",
    async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify(payload), { status: 200 });
    }
  );

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /googleAds:searchStream$/);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(rows[0].messageChats, 1);
  assert.equal(rows[0].messageImpressions, 8);
  assert.equal(rows[0].messageChatRate, 0.125);
});

test("HQ04 zero-row success advances the durable hourly checkpoint", async () => {
  const state: FakeState = {
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastRowCount: null,
    batches: 0,
    projected: [],
  };
  const env = baseEnv(state);
  env.MESSAGE_ASSET_METRICS_ENABLED = "true";
  env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON = serviceAccountJson();

  let providerCalls = 0;
  const fetchImpl = async (input: RequestInfo | URL): Promise<Response> => {
    providerCalls += 1;
    if (String(input) === GOOGLE_OAUTH_TOKEN_URL) {
      return new Response(JSON.stringify({ access_token: "test-token" }), { status: 200 });
    }
    return new Response("[]", { status: 200 });
  };

  const first = await collectMessageAssetMetrics(env, {
    now: new Date("2026-09-20T00:00:00.000Z"),
    fetchImpl,
  });
  assert.deepEqual(first, {
    state: "SUCCESS",
    rowsRead: 0,
    rowsWritten: 0,
    failureCode: null,
  });
  assert.equal(state.lastSuccessAt, "2026-09-20T00:00:00.000Z");
  assert.equal(state.lastRowCount, 0);

  const second = await collectMessageAssetMetrics(env, {
    now: new Date("2026-09-20T00:30:00.000Z"),
    fetchImpl,
  });
  assert.equal(second.state, "NOT_DUE");
  assert.equal(providerCalls, 2);
});
