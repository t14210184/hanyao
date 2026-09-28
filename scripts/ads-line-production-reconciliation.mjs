import path from "node:path";
import { fileURLToPath } from "node:url";
import { queryD1ReadOnly } from "./cloudflare-d1-readonly.mjs";

const DEFAULT_PRODUCTION_D1_ID = "52453bad-90a3-4495-911b-c3d5b6cefb1f";
const MAX_WINDOW_DAYS = 120;

export const validateDateWindow = (from, to) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(to ?? "")) {
    throw new Error("ADS_LINE_RECONCILIATION_DATE_INVALID");
  }
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
    throw new Error("ADS_LINE_RECONCILIATION_WINDOW_INVALID");
  }
  const days = Math.floor((toMs - fromMs) / 86400000) + 1;
  if (days > MAX_WINDOW_DAYS) throw new Error("ADS_LINE_RECONCILIATION_WINDOW_TOO_LARGE");
  return { from, to, days };
};

export const buildLineReasonExpression = (hasMatchReason) =>
  hasMatchReason
    ? "COALESCE(match_reason, 'LEGACY_UNCLASSIFIED')"
    : `CASE
        WHEN match_status='MATCHED_ADS' THEN 'MATCHED_ADS'
        WHEN match_status='UNMATCHED' AND token_extraction_count=0 THEN 'NO_TOKEN'
        WHEN match_status='UNMATCHED' AND token_extraction_count=1 THEN 'UNKNOWN_TOKEN'
        WHEN match_status='AMBIGUOUS' THEN 'MULTIPLE_TOKENS'
        WHEN match_status='WRONG_CHANNEL' THEN 'WRONG_CHANNEL'
        WHEN match_status='IGNORED_NON_TEXT' THEN 'IGNORED_NON_TEXT'
        WHEN match_status='MATCHED_UNATTRIBUTED' THEN 'LEGACY_MATCHED_UNATTRIBUTED'
        ELSE 'LEGACY_UNCLASSIFIED'
      END`;

const arg = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const isReadOnlyMeta = (meta) =>
  meta?.changedDb === false && Number(meta?.rowsWritten ?? 0) === 0 && Number(meta?.changes ?? 0) === 0;

const rows = (result) => Array.isArray(result?.results) ? result.results : [];

export async function runAdsLineReconciliation({
  from,
  to,
  accountId,
  databaseId = DEFAULT_PRODUCTION_D1_ID,
  token,
  query = queryD1ReadOnly,
}) {
  validateDateWindow(from, to);
  if (!accountId || !token) throw new Error("ADS_LINE_RECONCILIATION_CLOUDFLARE_READ_CREDENTIAL_REQUIRED");

  const q = async (sql, params = []) => query({ accountId, databaseId, token, sql, params });

  const lineColumns = await q("SELECT name FROM pragma_table_info('line_events') ORDER BY cid");
  const hasMatchReason = rows(lineColumns).some((row) => row.name === "match_reason");
  const reasonExpr = buildLineReasonExpression(hasMatchReason);

  const tableInventory = await q(`SELECT name FROM sqlite_master
    WHERE type='table' AND name IN (
      'business_conversions','conversion_outbox','provider_attempts','provider_attempt_events',
      'message_asset_metrics_daily','message_asset_metrics_collector_state'
    ) ORDER BY name`);
  const tables = new Set(rows(tableInventory).map((row) => row.name));

  const line = await q(`SELECT
      date(received_at, '+8 hours') AS metric_date,
      match_status,
      ${reasonExpr} AS match_reason,
      identity_state,
      COUNT(*) AS event_count,
      SUM(CASE WHEN lead_token IS NOT NULL THEN 1 ELSE 0 END) AS token_bound_count,
      SUM(CASE WHEN attribution_session_id IS NOT NULL THEN 1 ELSE 0 END) AS session_bound_count
    FROM line_events
    WHERE date(received_at, '+8 hours') BETWEEN ? AND ?
    GROUP BY metric_date, match_status, match_reason, identity_state
    ORDER BY metric_date, match_status, match_reason, identity_state`, [from, to]);

  const business = tables.has("business_conversions")
    ? await q(`SELECT
        date(conversion_time, '+8 hours') AS metric_date,
        conversion_type,
        eligibility_state,
        outcome_state,
        COUNT(*) AS conversion_count
      FROM business_conversions
      WHERE date(conversion_time, '+8 hours') BETWEEN ? AND ?
      GROUP BY metric_date, conversion_type, eligibility_state, outcome_state
      ORDER BY metric_date, conversion_type, eligibility_state, outcome_state`, [from, to])
    : null;

  const outbox = tables.has("conversion_outbox")
    ? await q(`SELECT
        date(event_timestamp, '+8 hours') AS metric_date,
        conversion_type,
        status,
        terminal_result,
        COUNT(*) AS outbox_count
      FROM conversion_outbox
      WHERE date(event_timestamp, '+8 hours') BETWEEN ? AND ?
      GROUP BY metric_date, conversion_type, status, terminal_result
      ORDER BY metric_date, conversion_type, status, terminal_result`, [from, to])
    : null;

  const provider = tables.has("provider_attempts") && tables.has("provider_attempt_events") && tables.has("business_conversions")
    ? await q(`SELECT
        date(bc.conversion_time, '+8 hours') AS metric_date,
        COUNT(DISTINCT pa.attempt_id) AS attempt_count,
        COUNT(DISTINCT CASE WHEN pae.provider_request_id IS NOT NULL THEN pa.attempt_id END) AS request_id_count,
        SUM(CASE WHEN pae.event_type='SUCCESS' OR pae.normalized_status='SUCCESS' THEN 1 ELSE 0 END) AS success_event_count,
        SUM(CASE WHEN pae.event_type='FAILED' OR pae.normalized_status='FAILED' THEN 1 ELSE 0 END) AS failed_event_count,
        SUM(CASE WHEN pae.ambiguous=1 OR pae.event_type='RECONCILIATION_REQUIRED' THEN 1 ELSE 0 END) AS reconciliation_event_count
      FROM provider_attempts pa
      JOIN business_conversions bc ON bc.business_conversion_id=pa.business_conversion_id
      LEFT JOIN provider_attempt_events pae ON pae.attempt_id=pa.attempt_id
      WHERE date(bc.conversion_time, '+8 hours') BETWEEN ? AND ?
      GROUP BY metric_date ORDER BY metric_date`, [from, to])
    : null;

  const messageAssets = tables.has("message_asset_metrics_daily")
    ? await q(`SELECT
        metric_date,
        campaign_id,
        asset_id,
        SUM(impressions) AS impressions,
        SUM(interactions) AS interactions,
        SUM(clicks) AS clicks,
        SUM(message_impressions) AS message_impressions,
        SUM(message_chats) AS message_chats,
        SUM(cost_micros) AS cost_micros
      FROM message_asset_metrics_daily
      WHERE metric_date BETWEEN ? AND ?
      GROUP BY metric_date, campaign_id, asset_id
      ORDER BY metric_date, campaign_id, asset_id`, [from, to])
    : null;

  const collectorState = tables.has("message_asset_metrics_collector_state")
    ? await q(`SELECT customer_id,last_attempt_at,last_success_at,last_nonempty_at,last_failure_code,last_row_count,updated_at
      FROM message_asset_metrics_collector_state ORDER BY customer_id`)
    : null;

  const results = [lineColumns, tableInventory, line, business, outbox, provider, messageAssets, collectorState].filter(Boolean);
  return {
    schema: "hanyao.ads-line-reconciliation.v1",
    result: "READBACK_PASS",
    from,
    to,
    timezone: "Asia/Taipei",
    databaseId,
    lineMatchReasonMode: hasMatchReason ? "EXPLICIT_COLUMN" : "LEGACY_CONSERVATIVE_INFERENCE",
    line: rows(line),
    business: rows(business),
    outbox: rows(outbox),
    provider: rows(provider),
    messageAssets: rows(messageAssets),
    messageAssetCollectorState: rows(collectorState),
    missingTables: [
      "business_conversions","conversion_outbox","provider_attempts","provider_attempt_events",
      "message_asset_metrics_daily","message_asset_metrics_collector_state"
    ].filter((name) => !tables.has(name)),
    readOnlyGuard: results.every((result) => isReadOnlyMeta(result.meta)),
    rowsRead: results.reduce((sum, result) => sum + Number(result.meta?.rowsRead ?? 0), 0),
    tokenPrinted: false,
  };
}

async function main() {
  const from = arg("--from");
  const to = arg("--to");
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim() || process.env.WRANGLER_AUTH_TOKEN?.trim();
  const databaseId = process.env.HG10_PRODUCTION_D1_ID?.trim() || DEFAULT_PRODUCTION_D1_ID;
  const result = await runAdsLineReconciliation({ from, to, accountId, databaseId, token });
  console.log(JSON.stringify(result));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  await main();
}
