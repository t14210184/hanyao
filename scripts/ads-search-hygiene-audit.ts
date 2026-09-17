import { writeFile } from "node:fs/promises";
import { exchangeServiceAccountTokenForScopes } from "../workers/google-ads-uploader/src/auth.ts";
import { GOOGLE_ADS_SCOPE } from "../workers/google-ads-uploader/src/types.ts";
import { classifySearchTerm } from "./ads-search-hygiene-rules.ts";

const CUSTOMER_ID = "4801404246";
const API_VERSION = "v25";
const API_URL = `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:searchStream`;
const CLASSIFICATION_VERSION = "hanyao-search-hygiene-v1";

const credential = process.env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?.trim();
const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim();
const outputPath = process.env.ADS_HYGIENE_OUTPUT_PATH?.trim();
const liveRequired = process.env.ADS_HYGIENE_LIVE_REQUIRED === "1";

type RecordLike = Record<string, unknown>;
const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;
const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const asNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const defaultDateRange = (): { start: string; end: string } => {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { start: isoDate(start), end: isoDate(end) };
};
const validateDate = (value: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`INVALID_DATE_${value}`);
  return value;
};

const defaults = defaultDateRange();
const startDate = validateDate(process.env.ADS_HYGIENE_START_DATE?.trim() || defaults.start);
const endDate = validateDate(process.env.ADS_HYGIENE_END_DATE?.trim() || defaults.end);
if (startDate > endDate) throw new Error("INVALID_DATE_RANGE");

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

const missingRequirements = [
  !credential ? "GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON" : null,
  !developerToken ? "GOOGLE_ADS_DEVELOPER_TOKEN" : null,
].filter((value): value is string => value !== null);

const skipped = {
  schemaVersion: 1,
  result: "SKIPPED_MISSING_GOOGLE_ADS_READ_REQUIREMENTS",
  customerId: CUSTOMER_ID,
  apiVersion: API_VERSION,
  classificationVersion: CLASSIFICATION_VERSION,
  dateRange: { start: startDate, end: endDate },
  missingRequirements,
};

if (!credential || !developerToken) {
  if (liveRequired) {
    throw new Error(`GOOGLE_ADS_READ_REQUIREMENTS_REQUIRED_${missingRequirements.join("_")}`);
  }
  console.log(JSON.stringify(skipped));
  process.exit(0);
}

const auth = await exchangeServiceAccountTokenForScopes(credential, [GOOGLE_ADS_SCOPE]);
const headers: Record<string, string> = {
  authorization: `Bearer ${auth.accessToken}`,
  "content-type": "application/json",
  "developer-token": developerToken,
};
if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

const query = `SELECT
  campaign.id,
  campaign.name,
  ad_group.id,
  ad_group.name,
  search_term_view.search_term,
  search_term_view.status,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros
FROM search_term_view
WHERE campaign.status = 'ENABLED'
  AND campaign.advertising_channel_type = 'SEARCH'
  AND segments.date BETWEEN '${startDate}' AND '${endDate}'
ORDER BY metrics.cost_micros DESC`;

const response = await fetch(API_URL, {
  method: "POST",
  headers,
  body: JSON.stringify({ query }),
});
const text = await response.text();
if (!response.ok) {
  let providerStatus = "UNKNOWN";
  try {
    const parsed = asRecord(JSON.parse(text));
    providerStatus = asString(asRecord(parsed?.error)?.status) ?? providerStatus;
  } catch {
    // Never echo the provider response body because it can contain sensitive diagnostics.
  }
  throw new Error(`GOOGLE_ADS_HTTP_${response.status}_${providerStatus.replace(/[^A-Z0-9_]/gi, "_")}`);
}

const rows = rowsFrom(JSON.parse(text));
const audited = rows.map((row) => {
  const campaign = asRecord(row.campaign) ?? {};
  const adGroup = asRecord(row.adGroup) ?? {};
  const view = asRecord(row.searchTermView) ?? {};
  const metrics = asRecord(row.metrics) ?? {};
  const searchTerm = asString(view.searchTerm) ?? "";
  const decision = classifySearchTerm(searchTerm);
  const status = asString(view.status) ?? "UNKNOWN";
  const alreadyExcluded = status.includes("EXCLUDED");

  return {
    campaignId: asString(campaign.id),
    campaignName: asString(campaign.name),
    adGroupId: asString(adGroup.id),
    adGroupName: asString(adGroup.name),
    searchTerm,
    searchTermStatus: status,
    metrics: {
      impressions: asNumber(metrics.impressions),
      clicks: asNumber(metrics.clicks),
      costMicros: asNumber(metrics.costMicros),
    },
    decision,
    candidate:
      decision.action === "NEGATIVE_EXACT" && !alreadyExcluded
        ? {
            scope: "AD_GROUP",
            negative: true,
            keyword: {
              text: decision.normalizedTerm,
              matchType: "EXACT",
            },
          }
        : null,
  };
});

const candidates = audited.filter((row) => row.candidate !== null);
const candidateCostMicros = candidates.reduce((sum, row) => sum + row.metrics.costMicros, 0);
const candidateClicks = candidates.reduce((sum, row) => sum + row.metrics.clicks, 0);
const reviewRows = audited.filter((row) =>
  ["REVIEW_NAVIGATION", "KEEP_REVIEW"].includes(row.decision.action)
);

const manifest = {
  schemaVersion: 1,
  result: "AUDIT_COMPLETE_NO_MUTATION",
  generatedAt: new Date().toISOString(),
  customerId: CUSTOMER_ID,
  apiVersion: API_VERSION,
  sourceView: "search_term_view",
  classificationVersion: CLASSIFICATION_VERSION,
  dateRange: { start: startDate, end: endDate },
  mutationPolicy: {
    applied: false,
    defaultCandidateScope: "AD_GROUP",
    defaultCandidateMatchType: "EXACT",
    prohibitedAutomaticBroadNegative: true,
  },
  totals: {
    auditedRows: audited.length,
    candidateRows: candidates.length,
    candidateClicks,
    candidateCostMicros,
  },
  candidates,
  reviewRows,
};

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (outputPath) await writeFile(outputPath, serialized, "utf8");

// Default stdout is intentionally metadata-only. Exact search terms, campaign/ad-group
// identities and spend detail are written only when an explicit output path is supplied.
console.log(
  JSON.stringify({
    schemaVersion: 1,
    result: manifest.result,
    generatedAt: manifest.generatedAt,
    customerId: CUSTOMER_ID,
    apiVersion: API_VERSION,
    sourceView: manifest.sourceView,
    classificationVersion: CLASSIFICATION_VERSION,
    dateRange: manifest.dateRange,
    mutationApplied: false,
    auditedRows: audited.length,
    candidateRows: candidates.length,
    reviewRows: reviewRows.length,
    detailOutputWritten: Boolean(outputPath),
  })
);
