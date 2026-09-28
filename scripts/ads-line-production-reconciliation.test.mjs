import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLineReasonExpression,
  runAdsLineReconciliation,
  validateDateWindow,
} from "./ads-line-production-reconciliation.mjs";

test("validates bounded date windows", () => {
  assert.deepEqual(validateDateWindow("2026-09-17", "2026-09-28"), {
    from: "2026-09-17", to: "2026-09-28", days: 12,
  });
  assert.throws(() => validateDateWindow("2026-09-28", "2026-09-17"), /WINDOW_INVALID/);
  assert.throws(() => validateDateWindow("2026/09/17", "2026-09-28"), /DATE_INVALID/);
});

test("uses explicit match reason only when schema has it", () => {
  assert.match(buildLineReasonExpression(true), /match_reason/);
  const legacy = buildLineReasonExpression(false);
  assert.match(legacy, /NO_TOKEN/);
  assert.match(legacy, /UNKNOWN_TOKEN/);
  assert.match(legacy, /LEGACY_MATCHED_UNATTRIBUTED/);
});

test("reconciliation remains read-only and schema-adaptive", async () => {
  const calls = [];
  const query = async ({ sql, params }) => {
    calls.push({ sql, params });
    let results = [];
    if (sql.includes("pragma_table_info")) {
      results = [{ name: "match_status" }, { name: "token_extraction_count" }];
    } else if (sql.includes("sqlite_master")) {
      results = [
        { name: "business_conversions" },
        { name: "conversion_outbox" },
        { name: "provider_attempts" },
        { name: "provider_attempt_events" },
      ];
    } else if (sql.includes("FROM line_events")) {
      results = [{ metric_date: "2026-09-17", match_status: "MATCHED_ADS", match_reason: "MATCHED_ADS", identity_state: "KNOWN", event_count: 1 }];
    }
    return { results, meta: { changedDb: false, rowsWritten: 0, changes: 0, rowsRead: results.length } };
  };
  const result = await runAdsLineReconciliation({
    from: "2026-09-17",
    to: "2026-09-28",
    accountId: "account",
    token: "secret-not-printed",
    query,
  });
  assert.equal(result.readOnlyGuard, true);
  assert.equal(result.tokenPrinted, false);
  assert.equal(result.lineMatchReasonMode, "LEGACY_CONSERVATIVE_INFERENCE");
  assert.ok(result.missingTables.includes("message_asset_metrics_daily"));
  assert.ok(calls.every((call) => /^\s*SELECT/i.test(call.sql)));
});
