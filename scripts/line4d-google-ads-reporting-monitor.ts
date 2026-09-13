import { exchangeServiceAccountTokenForScopes } from "../workers/google-ads-uploader/src/auth.ts";
import { GOOGLE_ADS_SCOPE } from "../workers/google-ads-uploader/src/types.ts";
import {
  evaluateReportingEvidence,
  type ReportingSnapshot,
} from "./line4d-reporting-evidence.ts";

const CUSTOMER_ID = "4801404246";
const CONVERSION_ACTION_ID = "7674301565";
const API_VERSION = "v25";
const API_URL = `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:searchStream`;

const credential = process.env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?.trim();
const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim();
const reportingBaselineJson = process.env.GOOGLE_ADS_REPORTING_BASELINE_JSON?.trim();

if (!credential) {
  console.log("GOOGLE_ADS_REPORTING_MONITOR=SKIPPED_NO_GITHUB_CREDENTIAL");
  process.exit(0);
}

type RecordLike = Record<string, unknown>;
const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;
const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const rowsFrom = (payload: unknown): RecordLike[] => {
  const chunks = Array.isArray(payload) ? payload : [payload];
  const rows: RecordLike[] = [];
  for (const chunk of chunks) {
    const record = asRecord(chunk);
    const results = Array.isArray(record?.results) ? record.results : [];
    for (const result of results) {
      const row = asRecord(result);
      if (row) rows.push(row);
    }
  }
  return rows;
};

const baselineFromEnv = (): ReportingSnapshot | null => {
  if (!reportingBaselineJson) return null;
  const record = asRecord(JSON.parse(reportingBaselineJson));
  if (!record) throw new Error("REPORTING_BASELINE_INVALID");
  const allConversions = asNumber(record.allConversions);
  const customerId = asString(record.customerId);
  const conversionActionId = asString(record.conversionActionId);
  if (allConversions === null || !customerId || !conversionActionId) {
    throw new Error("REPORTING_BASELINE_INVALID");
  }
  return {
    customerId,
    conversionActionId,
    allConversions,
    lastConversionDate: asString(record.lastConversionDate),
    lastReceivedRequestDateTime: asString(record.lastReceivedRequestDateTime),
  };
};

try {
  const auth = await exchangeServiceAccountTokenForScopes(credential, [GOOGLE_ADS_SCOPE]);
  const headers: Record<string, string> = {
    authorization: `Bearer ${auth.accessToken}`,
    "content-type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const query = `SELECT
    conversion_action.id,
    metrics.all_conversions,
    metrics.conversion_last_conversion_date,
    metrics.conversion_last_received_request_date_time
  FROM conversion_action
  WHERE conversion_action.id = ${CONVERSION_ACTION_ID}
  LIMIT 1`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  const text = await response.text();
  if (!response.ok) {
    let status = "UNKNOWN";
    try {
      const parsed = asRecord(JSON.parse(text));
      status = asString(asRecord(parsed?.error)?.status) ?? status;
    } catch {
      // Never echo the provider response body.
    }
    throw new Error(`GOOGLE_ADS_HTTP_${response.status}_${status.replace(/[^A-Z0-9_]/gi, "_")}`);
  }

  const rows = rowsFrom(JSON.parse(text));
  if (rows.length !== 1) throw new Error("CONVERSION_ACTION_REPORTING_ROW_NOT_FOUND");
  const metrics = asRecord(rows[0].metrics) ?? {};
  const currentSnapshot: ReportingSnapshot = {
    customerId: CUSTOMER_ID,
    conversionActionId: CONVERSION_ACTION_ID,
    allConversions: asNumber(metrics.allConversions) ?? 0,
    lastConversionDate: asString(metrics.conversionLastConversionDate),
    lastReceivedRequestDateTime: asString(metrics.conversionLastReceivedRequestDateTime),
  };
  const baseline = baselineFromEnv();
  const evidence = evaluateReportingEvidence(currentSnapshot, baseline);

  console.log(
    JSON.stringify({
      result: evidence.reportingVisible
        ? "GOOGLE_ADS_REPORTING_DELTA_CONFIRMED"
        : "GOOGLE_ADS_REPORTING_UNVERIFIED",
      ...currentSnapshot,
      baselineProvided: baseline !== null,
      ...evidence,
      baselineSnapshot: baseline === null ? currentSnapshot : undefined,
    })
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  console.error(`GOOGLE_ADS_REPORTING_MONITOR=FAIL:${message.replace(/[^A-Z0-9_:-]/gi, "_")}`);
  process.exitCode = 1;
}
