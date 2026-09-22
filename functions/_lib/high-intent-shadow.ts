import type { D1Database } from "@cloudflare/workers-types";
import {
  analyzeHighIntentMessage,
  type HighIntentMessageAnalysis,
} from "./high-intent-signal.ts";

export type HighIntentAttributionLane =
  | "EXACT_CLICK"
  | "USER_DATA_ONLY"
  | "UNATTRIBUTED";

export interface HighIntentShadowInput {
  lineEventId: string;
  lineUserKey: string | null;
  leadToken: string | null;
  matchStatus: string;
  exactAdsAttribution: boolean;
  messageText: string | null;
  observedAt: string;
}

export type HighIntentAnalyzer = (
  value: string
) => Promise<HighIntentMessageAnalysis>;

export type HighIntentShadowResult =
  | "WRITTEN"
  | "SKIPPED_NON_TEXT"
  | "FAILED";

export const HIGH_INTENT_IDENTIFIER_RETENTION_DAYS = 90;

const schemaReady = new WeakSet<object>();
const schemaInflight = new WeakMap<object, Promise<void>>();

const verifyShadowSchema = async (database: D1Database): Promise<void> => {
  const row = await database
    .prepare(
      `SELECT COUNT(*) AS count
         FROM sqlite_master
        WHERE type='table'
          AND name IN (
            'lead_signal_observations',
            'lead_user_identifiers',
            'message_asset_metrics_daily'
          )`
    )
    .first<{ count: number | string }>();
  if (Number(row?.count ?? 0) !== 3) {
    throw new Error("HIGH_INTENT_SHADOW_SCHEMA_INCOMPLETE");
  }
  const requiredColumns = await database
    .prepare(
      `SELECT COUNT(*) AS count
         FROM pragma_table_info('lead_user_identifiers')
        WHERE name IN ('expires_at', 'retention_policy_version')`
    )
    .first<{ count: number | string }>();
  if (Number(requiredColumns?.count ?? 0) !== 2) {
    throw new Error("HIGH_INTENT_RETENTION_SCHEMA_INCOMPLETE");
  }
  const metricsColumns = await database
    .prepare(
      `SELECT COUNT(*) AS count
         FROM pragma_table_info('message_asset_metrics_daily')
        WHERE name IN ('message_chats', 'message_impressions', 'message_chat_rate')`
    )
    .first<{ count: number | string }>();
  if (Number(metricsColumns?.count ?? 0) !== 3) {
    throw new Error("HIGH_INTENT_MESSAGE_METRICS_SCHEMA_INCOMPLETE");
  }
  const checkpoint = await database
    .prepare(
      `SELECT COUNT(*) AS count
         FROM sqlite_master
        WHERE type='table' AND name='message_asset_metrics_collector_state'`
    )
    .first<{ count: number | string }>();
  if (Number(checkpoint?.count ?? 0) !== 1) {
    throw new Error("HIGH_INTENT_MESSAGE_CHECKPOINT_SCHEMA_INCOMPLETE");
  }
};

export const ensureHighIntentShadowSchema = async (
  database: D1Database
): Promise<void> => {
  const key = database as unknown as object;
  if (schemaReady.has(key)) return;

  let inflight = schemaInflight.get(key);
  if (!inflight) {
    inflight = (async () => {
      await verifyShadowSchema(database);
      schemaReady.add(key);
    })();
    schemaInflight.set(key, inflight);
  }

  try {
    await inflight;
  } catch (error) {
    schemaInflight.delete(key);
    throw error;
  }
};

const classifyLane = (
  input: HighIntentShadowInput,
  analysis: HighIntentMessageAnalysis
): HighIntentAttributionLane => {
  if (input.exactAdsAttribution) return "EXACT_CLICK";
  if (input.lineUserKey && analysis.identifiers.length > 0) {
    return "USER_DATA_ONLY";
  }
  return "UNATTRIBUTED";
};

export const persistHighIntentShadow = async (
  database: D1Database,
  input: HighIntentShadowInput,
  analyzer: HighIntentAnalyzer = analyzeHighIntentMessage
): Promise<Exclude<HighIntentShadowResult, "FAILED">> => {
  if (input.messageText === null) return "SKIPPED_NON_TEXT";

  await ensureHighIntentShadowSchema(database);

  const analysis = await analyzer(input.messageText);
  const lane = classifyLane(input, analysis);
  const observationId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.parse(input.observedAt) +
      HIGH_INTENT_IDENTIFIER_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const statements = [
    database.prepare(
      `INSERT OR IGNORE INTO lead_signal_observations (
        observation_id, line_event_id, line_user_key, lead_token, observed_at,
        rule_version, match_status, attribution_lane, service_signal,
        transaction_intent_signal, location_signal, schedule_signal,
        contact_signal, qualified_candidate, created_at
      ) VALUES (
        ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15
      )`
    ).bind(
      observationId,
      input.lineEventId,
      input.lineUserKey,
      input.leadToken,
      input.observedAt,
      analysis.classification.ruleVersion,
      input.matchStatus,
      lane,
      analysis.classification.serviceSignal ? 1 : 0,
      analysis.classification.transactionIntentSignal ? 1 : 0,
      analysis.classification.locationSignal ? 1 : 0,
      analysis.classification.scheduleSignal ? 1 : 0,
      analysis.classification.contactSignal ? 1 : 0,
      analysis.classification.qualifiedCandidate ? 1 : 0,
      input.observedAt
    ),
  ];

  if (input.lineUserKey) {
    for (const identifier of analysis.identifiers) {
      statements.push(
        database.prepare(
          `INSERT OR IGNORE INTO lead_user_identifiers (
            identifier_id, line_user_key, identifier_type, identifier_hash,
            source_line_event_id, first_seen_at, expires_at,
            retention_policy_version, created_at
          ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`
        ).bind(
          crypto.randomUUID(),
          input.lineUserKey,
          identifier.type,
          identifier.hash,
          input.lineEventId,
          input.observedAt,
          expiresAt,
          "v1",
          input.observedAt
        )
      );
    }
  }

  await database.batch(statements);
  return "WRITTEN";
};

export const persistHighIntentShadowSafely = async (
  database: D1Database,
  input: HighIntentShadowInput,
  analyzer: HighIntentAnalyzer = analyzeHighIntentMessage
): Promise<HighIntentShadowResult> => {
  try {
    return await persistHighIntentShadow(database, input, analyzer);
  } catch {
    console.warn("HANYAO_HIGH_INTENT_SHADOW_FAILED", {
      line_event_id: input.lineEventId,
      code: "SHADOW_WRITE_FAILED",
    });
    return "FAILED";
  }
};

export const cleanupExpiredLeadUserIdentifiers = async (
  database: D1Database,
  nowIso: string,
  limit = 100
): Promise<number> => {
  const boundedLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  const result = await database
    .prepare(
      `DELETE FROM lead_user_identifiers
        WHERE identifier_id IN (
          SELECT candidate.identifier_id
            FROM lead_user_identifiers candidate
           WHERE candidate.expires_at IS NOT NULL
             AND candidate.expires_at <= ?1
             AND NOT EXISTS (
               SELECT 1
                 FROM conversion_user_data_snapshot_items item
                WHERE item.identifier_type = candidate.identifier_type
                  AND lower(item.identifier_hash) = lower(candidate.identifier_hash)
             )
           ORDER BY candidate.expires_at, candidate.identifier_id
           LIMIT ?2
        )`
    )
    .bind(nowIso, boundedLimit)
    .run();
  return Number(result.meta?.changes ?? 0);
};
