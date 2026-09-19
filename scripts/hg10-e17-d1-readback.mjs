import { queryD1ReadOnly } from "./cloudflare-d1-readonly.mjs";

const DEFAULT_PRODUCTION_D1_ID = "52453bad-90a3-4495-911b-c3d5b6cefb1f";
const dateIndex = process.argv.indexOf("--date");
const targetDate = dateIndex >= 0 ? process.argv[dateIndex + 1] : undefined;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const databaseId =
  process.env.HG10_PRODUCTION_D1_ID?.trim() || DEFAULT_PRODUCTION_D1_ID;
const token =
  process.env.CLOUDFLARE_API_TOKEN?.trim() ||
  process.env.WRANGLER_AUTH_TOKEN?.trim();

if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate ?? "")) {
  throw new Error("HG10_E17_TARGET_DATE_INVALID");
}
if (!accountId || !token) {
  throw new Error("HG10_E17_CLOUDFLARE_READ_CREDENTIAL_REQUIRED");
}

const queries = {
  line: `SELECT COUNT(*) AS matched_ads_count
    FROM line_events
    WHERE match_status = 'MATCHED_ADS'
      AND date(received_at, '+8 hours') = ?`,
  business: `SELECT
      COUNT(*) AS business_conversion_count,
      SUM(CASE WHEN eligibility_state = 'ELIGIBLE' THEN 1 ELSE 0 END) AS eligible_business_count,
      SUM(CASE WHEN outcome_state = 'RECONCILIATION_REQUIRED' THEN 1 ELSE 0 END) AS reconciliation_count
    FROM business_conversions
    WHERE conversion_type = 'verified_line_contact'
      AND date(conversion_time, '+8 hours') = ?`,
  outbox: `SELECT
      COUNT(*) AS outbox_count,
      SUM(CASE WHEN status IN ('success','deduplicated') THEN 1 ELSE 0 END) AS terminal_success_count,
      SUM(CASE WHEN terminal_result = 'RECONCILIATION_REQUIRED' THEN 1 ELSE 0 END) AS reconciliation_count
    FROM conversion_outbox
    WHERE conversion_type = 'verified_line_contact'
      AND date(event_timestamp, '+8 hours') = ?`,
  provider: `SELECT
      COUNT(DISTINCT pa.attempt_id) AS provider_attempt_count,
      COUNT(DISTINCT CASE WHEN pae.provider_request_id IS NOT NULL THEN pa.attempt_id END) AS request_id_count,
      SUM(CASE WHEN pae.event_type = 'SUCCESS' OR pae.normalized_status = 'SUCCESS' THEN 1 ELSE 0 END) AS diagnostic_success_count,
      SUM(CASE WHEN pae.event_type = 'FAILED' OR pae.normalized_status = 'FAILED' THEN 1 ELSE 0 END) AS diagnostic_failed_count,
      SUM(CASE WHEN pae.event_type = 'RECONCILIATION_REQUIRED' OR pae.ambiguous = 1 THEN 1 ELSE 0 END) AS reconciliation_count
    FROM provider_attempts pa
    JOIN business_conversions bc
      ON bc.business_conversion_id = pa.business_conversion_id
    LEFT JOIN provider_attempt_events pae
      ON pae.attempt_id = pa.attempt_id
    WHERE date(bc.conversion_time, '+8 hours') = ?`,
};

const read = async (sql) =>
  queryD1ReadOnly({
    accountId,
    databaseId,
    token,
    sql,
    params: [targetDate],
  });

const [line, business, outbox, provider] = await Promise.all([
  read(queries.line),
  read(queries.business),
  read(queries.outbox),
  read(queries.provider),
]);

const row = (result) => result.results[0] ?? {};
const num = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const lineRow = row(line);
const businessRow = row(business);
const outboxRow = row(outbox);
const providerRow = row(provider);
const metas = [line.meta, business.meta, outbox.meta, provider.meta];

console.log(
  JSON.stringify({
    schema: "hanyao.hg10-e17.d1-readback.v1",
    result: "D1_READBACK_PASS",
    targetDate,
    timezone: "Asia/Taipei",
    databaseId,
    lineMatchedAdsCount: num(lineRow.matched_ads_count),
    businessConversionCount: num(businessRow.business_conversion_count),
    eligibleBusinessCount: num(businessRow.eligible_business_count),
    outboxCount: num(outboxRow.outbox_count),
    outboxTerminalSuccessCount: num(outboxRow.terminal_success_count),
    providerAttemptCount: num(providerRow.provider_attempt_count),
    requestIdCount: num(providerRow.request_id_count),
    diagnosticSuccessCount: num(providerRow.diagnostic_success_count),
    diagnosticFailedCount: num(providerRow.diagnostic_failed_count),
    reconciliationCount:
      num(businessRow.reconciliation_count) +
      num(outboxRow.reconciliation_count) +
      num(providerRow.reconciliation_count),
    readOnlyGuard: metas.every(
      (meta) =>
        meta.changedDb === false &&
        meta.rowsWritten === 0 &&
        meta.changes === 0
    ),
    rowsRead: metas.reduce((sum, meta) => sum + num(meta.rowsRead), 0),
    tokenPrinted: false,
  })
);
