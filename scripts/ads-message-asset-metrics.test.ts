import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildMessageAssetMetricsQuery,
  normalizeMessageAssetMetricRows,
  readMessageAssetMetrics,
} from "./ads-message-asset-metrics.ts";

const payload = [
  {
    results: [
      {
        segments: { date: "2026-09-20" },
        campaign: { id: "1234567890", name: "冷氣維修" },
        campaignAsset: {
          resourceName:
            "customers/4801404246/campaignAssets/1234567890~999~BUSINESS_MESSAGE",
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
          conversions: 1,
          allConversions: "1",
          costMicros: "1200000",
          messageChats: "1",
          messageImpressions: "8",
          messageChatRate: 0.125,
        },
      },
    ],
  },
];

test("HQ04 GAQL is BUSINESS_MESSAGE-only and read-only", async () => {
  const query = buildMessageAssetMetricsQuery("2026-09-20");
  assert.match(query, /FROM campaign_asset/);
  assert.match(query, /campaign_asset\.field_type = 'BUSINESS_MESSAGE'/);
  assert.match(query, /segments\.date = '2026-09-20'/);
  assert.match(query, /metrics\.message_chats/);
  assert.match(query, /metrics\.message_impressions/);
  assert.match(query, /metrics\.message_chat_rate/);
  assert.doesNotMatch(query, /mutate|events:ingest|UPDATE|INSERT|DELETE/i);

  const source = await readFile("scripts/ads-message-asset-metrics.ts", "utf8");
  assert.doesNotMatch(source, /googleAds:mutate|events:ingest|d1\s+execute/i);
});

test("HQ04 parser preserves provider status and message-specific metrics", () => {
  const rows = normalizeMessageAssetMetricRows(payload);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    metricDate: "2026-09-20",
    customerId: "4801404246",
    campaignId: "1234567890",
    campaignName: "冷氣維修",
    assetId: "999",
    assetResourceName: "customers/4801404246/assets/999",
    campaignAssetResourceName:
      "customers/4801404246/campaignAssets/1234567890~999~BUSINESS_MESSAGE",
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
});

test("HQ04 exact SearchStream request never mutates provider state", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const rows = await readMessageAssetMetrics(
    "token-test",
    "9401096633",
    "2026-09-20",
    fetchImpl
  );
  assert.equal(rows.length, 1);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /googleAds:searchStream$/);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(
    calls[0].init.headers["login-customer-id"],
    "9401096633"
  );
  const body = JSON.parse(calls[0].init.body);
  assert.match(body.query, /BUSINESS_MESSAGE/);
  assert.doesNotMatch(body.query, /mutate|UPDATE|INSERT|DELETE/i);
});

test("HQ04 rejects non-BUSINESS_MESSAGE drift and malformed dates", () => {
  const wrong = structuredClone(payload);
  wrong[0].results[0].campaignAsset.fieldType = "CALL";
  assert.throws(
    () => normalizeMessageAssetMetricRows(wrong),
    /MESSAGE_ASSET_FIELD_TYPE_DRIFT/
  );
  assert.throws(
    () => buildMessageAssetMetricsQuery("20-09-2026"),
    /MESSAGE_ASSET_DATE_INVALID/
  );
});

test("HQ04 provider errors are bounded and never echo response body", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        error: {
          status: "PERMISSION_DENIED",
          message: "secret-provider-detail-should-not-leak",
        },
      }),
      { status: 403 }
    );

  await assert.rejects(
    () =>
      readMessageAssetMetrics(
        "token-test",
        null,
        "2026-09-20",
        fetchImpl
      ),
    (error) => {
      assert.match(
        String(error),
        /MESSAGE_ASSET_GOOGLE_ADS_HTTP_403_PERMISSION_DENIED/
      );
      assert.doesNotMatch(String(error), /secret-provider-detail/);
      return true;
    }
  );
});
