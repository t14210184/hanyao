import { exchangeServiceAccountTokenForScopes } from "./auth.ts";
import {
  GOOGLE_ADS_SCOPE,
  PROVIDER_HTTP_TIMEOUT_MS,
  type FetchLike,
  type UploaderEnv,
  type UploaderLogger,
} from "./types.ts";

export const MESSAGE_ASSET_API_VERSION = "v25";
export const DEFAULT_MESSAGE_ASSET_METRICS_INTERVAL_MS = 60 * 60 * 1000;

type RecordLike = Record<string, unknown>;

export interface MessageAssetMetricRow {
  metricDate: string;
  customerId: string;
  campaignId: string;
  campaignName: string | null;
  assetId: string;
  assetResourceName: string;
  campaignAssetResourceName: string;
  assetStatus: string | null;
  primaryStatus: string | null;
  primaryStatusReasons: string[];
  impressions: number;
  interactions: number;
  clicks: number;
  conversions: number;
  allConversions: number;
  costMicros: number;
  messageChats: number;
  messageImpressions: number;
  messageChatRate: number;
}

export interface MessageAssetMetricsSummary {
  state: "DISABLED" | "NOT_DUE" | "SUCCESS" | "FAILED";
  rowsRead: number;
  rowsWritten: number;
  failureCode: string | null;
}

interface MessageAssetCollectorStateRow {
  customer_id: string;
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_nonempty_at: string | null;
  last_failure_code: string | null;
  last_row_count: number | string | null;
}

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const rowsFromSearchStream = (payload: unknown): RecordLike[] => {
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

const assetIdFromResource = (resourceName: string): string => {
  const match = resourceName.match(/\/assets\/(\d+)$/);
  if (!match) throw new Error("MESSAGE_ASSET_RESOURCE_INVALID");
  return match[1];
};

export const buildMessageAssetMetricsQuery = (
  targetDate: string | null = null
): string => {
  if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error("MESSAGE_ASSET_DATE_INVALID");
  }
  const datePredicate = targetDate
    ? `segments.date = '${targetDate}'`
    : "segments.date DURING TODAY";

  return `SELECT
    segments.date,
    campaign.id,
    campaign.name,
    campaign_asset.resource_name,
    campaign_asset.asset,
    campaign_asset.field_type,
    campaign_asset.status,
    campaign_asset.primary_status,
    campaign_asset.primary_status_reasons,
    metrics.impressions,
    metrics.interactions,
    metrics.clicks,
    metrics.conversions,
    metrics.all_conversions,
    metrics.cost_micros,
    metrics.message_chats,
    metrics.message_impressions,
    metrics.message_chat_rate
  FROM campaign_asset
  WHERE campaign_asset.field_type = 'BUSINESS_MESSAGE'
    AND ${datePredicate}
  ORDER BY segments.date, campaign.id, campaign_asset.asset`;
};

export const normalizeMessageAssetMetricRows = (
  payload: unknown,
  customerId: string
): MessageAssetMetricRow[] =>
  rowsFromSearchStream(payload).map((row) => {
    const segments = asRecord(row.segments) ?? {};
    const campaign = asRecord(row.campaign) ?? {};
    const campaignAsset = asRecord(row.campaignAsset) ?? {};
    const metrics = asRecord(row.metrics) ?? {};

    const metricDate = asString(segments.date);
    const campaignId = asString(campaign.id) ?? String(campaign.id ?? "");
    const assetResourceName = asString(campaignAsset.asset);
    const campaignAssetResourceName = asString(campaignAsset.resourceName);
    const fieldType = asString(campaignAsset.fieldType);

    if (!metricDate || !/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) {
      throw new Error("MESSAGE_ASSET_METRIC_DATE_MISSING");
    }
    if (!/^\d+$/.test(campaignId)) {
      throw new Error("MESSAGE_ASSET_CAMPAIGN_ID_INVALID");
    }
    if (!assetResourceName || !campaignAssetResourceName) {
      throw new Error("MESSAGE_ASSET_RESOURCE_MISSING");
    }
    if (fieldType !== "BUSINESS_MESSAGE") {
      throw new Error("MESSAGE_ASSET_FIELD_TYPE_DRIFT");
    }

    return {
      metricDate,
      customerId,
      campaignId,
      campaignName: asString(campaign.name),
      assetId: assetIdFromResource(assetResourceName),
      assetResourceName,
      campaignAssetResourceName,
      assetStatus: asString(campaignAsset.status),
      primaryStatus: asString(campaignAsset.primaryStatus),
      primaryStatusReasons: asStringArray(
        campaignAsset.primaryStatusReasons
      ).sort(),
      impressions: asNumber(metrics.impressions),
      interactions: asNumber(metrics.interactions),
      clicks: asNumber(metrics.clicks),
      conversions: asNumber(metrics.conversions),
      allConversions: asNumber(metrics.allConversions),
      costMicros: asNumber(metrics.costMicros),
      messageChats: asNumber(metrics.messageChats),
      messageImpressions: asNumber(metrics.messageImpressions),
      messageChatRate: asNumber(metrics.messageChatRate),
    };
  });

const safeCode = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "";
  return /^[A-Z0-9_:-]{3,120}$/.test(message)
    ? message
    : "MESSAGE_ASSET_METRICS_UNKNOWN";
};

export const readMessageAssetMetrics = async (
  customerId: string,
  accessToken: string,
  loginCustomerId: string | null,
  targetDate: string | null,
  fetchImpl: FetchLike = fetch
): Promise<MessageAssetMetricRow[]> => {
  if (!/^\d+$/.test(customerId)) {
    throw new Error("MESSAGE_ASSET_CUSTOMER_ID_INVALID");
  }
  if (!accessToken || /\s/.test(accessToken)) {
    throw new Error("MESSAGE_ASSET_ACCESS_TOKEN_INVALID");
  }
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const response = await fetchImpl(
    `https://googleads.googleapis.com/${MESSAGE_ASSET_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: buildMessageAssetMetricsQuery(targetDate),
      }),
      signal: AbortSignal.timeout(PROVIDER_HTTP_TIMEOUT_MS),
    }
  );
  const text = await response.text();
  if (!response.ok) {
    let status = "UNKNOWN";
    try {
      const parsed = asRecord(JSON.parse(text));
      status = asString(asRecord(parsed?.error)?.status) ?? status;
    } catch {
      // Provider response bodies are never echoed.
    }
    throw new Error(
      `MESSAGE_ASSET_GOOGLE_ADS_HTTP_${response.status}_${status
        .replace(/[^A-Z0-9_:-]/gi, "_")
        .slice(0, 80)}`
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("MESSAGE_ASSET_GOOGLE_ADS_RESPONSE_MALFORMED");
  }
  return normalizeMessageAssetMetricRows(payload, customerId);
};

export const ensureMessageAssetMetricsTable = async (env: UploaderEnv): Promise<void> => {
  const tables = await env.ATTRIBUTION_DB
    .prepare(
      `SELECT COUNT(*) AS count
         FROM sqlite_master
        WHERE type='table'
          AND name IN ('message_asset_metrics_daily', 'message_asset_metrics_collector_state')`
    )
    .first<{ count: number | string }>();
  if (Number(tables?.count ?? 0) !== 2) {
    throw new Error("MESSAGE_ASSET_METRICS_SCHEMA_INCOMPLETE");
  }
  const columns = await env.ATTRIBUTION_DB
    .prepare(
      `SELECT COUNT(*) AS count
         FROM pragma_table_info('message_asset_metrics_daily')
        WHERE name IN (
          'message_chats',
          'message_impressions',
          'message_chat_rate'
        )`
    )
    .first<{ count: number | string }>();
  if (Number(columns?.count ?? 0) !== 3) {
    throw new Error("MESSAGE_ASSET_METRICS_V2_SCHEMA_INCOMPLETE");
  }
};

const readCollectorState = async (
  env: UploaderEnv,
  customerId: string
): Promise<MessageAssetCollectorStateRow | null> =>
  env.ATTRIBUTION_DB
    .prepare(
      `SELECT customer_id, last_attempt_at, last_success_at, last_nonempty_at,
              last_failure_code, last_row_count
         FROM message_asset_metrics_collector_state
        WHERE customer_id=?1`
    )
    .bind(customerId)
    .first<MessageAssetCollectorStateRow>();

const updateCollectorState = async (
  env: UploaderEnv,
  input: {
    customerId: string;
    attemptAt: string;
    successAt?: string | null;
    nonemptyAt?: string | null;
    failureCode?: string | null;
    rowCount?: number | null;
  }
): Promise<void> => {
  await env.ATTRIBUTION_DB
    .prepare(
      `INSERT INTO message_asset_metrics_collector_state (
        customer_id, last_attempt_at, last_success_at, last_nonempty_at,
        last_failure_code, last_row_count, updated_at
      ) VALUES (?1,?2,?3,?4,?5,?6,?2)
      ON CONFLICT(customer_id) DO UPDATE SET
        last_attempt_at=excluded.last_attempt_at,
        last_success_at=COALESCE(excluded.last_success_at, message_asset_metrics_collector_state.last_success_at),
        last_nonempty_at=COALESCE(excluded.last_nonempty_at, message_asset_metrics_collector_state.last_nonempty_at),
        last_failure_code=excluded.last_failure_code,
        last_row_count=excluded.last_row_count,
        updated_at=excluded.updated_at`
    )
    .bind(
      input.customerId,
      input.attemptAt,
      input.successAt ?? null,
      input.nonemptyAt ?? null,
      input.failureCode ?? null,
      input.rowCount ?? null
    )
    .run();
};

export const projectMessageAssetMetricRows = async (
  env: UploaderEnv,
  rows: MessageAssetMetricRow[],
  nowIso: string
): Promise<number> => {
  if (rows.length === 0) return 0;
  const statements = rows.map((row) =>
    env.ATTRIBUTION_DB.prepare(
      `INSERT INTO message_asset_metrics_daily (
        metric_date, google_ads_customer_id, campaign_id, asset_id,
        asset_status, policy_status, impressions, interactions, clicks,
        conversions, all_conversions, cost_micros, message_chats,
        message_impressions, message_chat_rate, provider_observed_at,
        created_at, updated_at
      ) VALUES (
        ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?16,?16
      )
      ON CONFLICT(metric_date,google_ads_customer_id,campaign_id,asset_id)
      DO UPDATE SET
        asset_status=excluded.asset_status,
        policy_status=excluded.policy_status,
        impressions=excluded.impressions,
        interactions=excluded.interactions,
        clicks=excluded.clicks,
        conversions=excluded.conversions,
        all_conversions=excluded.all_conversions,
        cost_micros=excluded.cost_micros,
        message_chats=excluded.message_chats,
        message_impressions=excluded.message_impressions,
        message_chat_rate=excluded.message_chat_rate,
        provider_observed_at=excluded.provider_observed_at,
        updated_at=excluded.updated_at`
    ).bind(
      row.metricDate,
      row.customerId,
      row.campaignId,
      row.assetId,
      row.assetStatus,
      row.primaryStatus,
      row.impressions,
      row.interactions,
      row.clicks,
      row.conversions,
      row.allConversions,
      row.costMicros,
      row.messageChats,
      row.messageImpressions,
      row.messageChatRate,
      nowIso
    )
  );
  await env.ATTRIBUTION_DB.batch(statements);
  return rows.length;
};

export const collectMessageAssetMetrics = async (
  env: UploaderEnv,
  options: {
    now?: Date;
    fetchImpl?: FetchLike;
    logger?: UploaderLogger;
    targetDate?: string | null;
  } = {}
): Promise<MessageAssetMetricsSummary> => {
  if (env.MESSAGE_ASSET_METRICS_ENABLED !== "true") {
    return { state: "DISABLED", rowsRead: 0, rowsWritten: 0, failureCode: null };
  }

  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const intervalMinutes = Number(
    env.MESSAGE_ASSET_METRICS_MIN_INTERVAL_MINUTES ?? "60"
  );
  const intervalMs =
    Number.isFinite(intervalMinutes) && intervalMinutes >= 15
      ? intervalMinutes * 60 * 1000
      : DEFAULT_MESSAGE_ASSET_METRICS_INTERVAL_MS;

  const customerId = env.GOOGLE_ADS_ACCOUNT_ID?.trim() || "";
  try {
    await ensureMessageAssetMetricsTable(env);
    if (!/^\d+$/.test(customerId)) {
      throw new Error("MESSAGE_ASSET_CUSTOMER_ID_INVALID");
    }
    const state = await readCollectorState(env, customerId);
    const last = state?.last_success_at ?? null;
    if (
      last &&
      Number.isFinite(Date.parse(last)) &&
      now.getTime() - Date.parse(last) < intervalMs
    ) {
      return { state: "NOT_DUE", rowsRead: 0, rowsWritten: 0, failureCode: null };
    }

    await updateCollectorState(env, {
      customerId,
      attemptAt: nowIso,
      rowCount: 0,
      failureCode: null,
    });

    const serialized = env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?.trim();
    if (!serialized) throw new Error("MESSAGE_ASSET_PROVIDER_CREDENTIAL_MISSING");

    const loginCustomerId =
      env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "").trim() || null;
    const token = await exchangeServiceAccountTokenForScopes(
      serialized,
      [GOOGLE_ADS_SCOPE],
      fetchImpl,
      now
    );
    const rows = await readMessageAssetMetrics(
      customerId,
      token.accessToken,
      loginCustomerId,
      options.targetDate ?? null,
      fetchImpl
    );
    const written = await projectMessageAssetMetricRows(env, rows, nowIso);
    await updateCollectorState(env, {
      customerId,
      attemptAt: nowIso,
      successAt: nowIso,
      nonemptyAt: rows.length > 0 ? nowIso : null,
      failureCode: null,
      rowCount: rows.length,
    });
    options.logger?.info?.("google-ads Message Asset metrics collected", {
      rows_read: rows.length,
      rows_written: written,
    });
    return {
      state: "SUCCESS",
      rowsRead: rows.length,
      rowsWritten: written,
      failureCode: null,
    };
  } catch (error) {
    const failureCode = safeCode(error);
    if (/^\d+$/.test(customerId)) {
      try {
        await updateCollectorState(env, {
          customerId,
          attemptAt: nowIso,
          failureCode,
          rowCount: 0,
        });
      } catch {
        // Preserve the provider failure classification if the checkpoint is unavailable.
      }
    }
    options.logger?.warn?.("google-ads Message Asset metrics isolated failure", {
      failure_code: failureCode,
    });
    return {
      state: "FAILED",
      rowsRead: 0,
      rowsWritten: 0,
      failureCode,
    };
  }
};
