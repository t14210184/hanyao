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

const schemaReady = new WeakSet<object>();
const schemaInflight = new WeakMap<object, Promise<void>>();

const SHADOW_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS lead_signal_observations (
    observation_id TEXT PRIMARY KEY NOT NULL,
    line_event_id TEXT NOT NULL UNIQUE,
    line_user_key TEXT,
    lead_token TEXT,
    observed_at TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    match_status TEXT NOT NULL,
    attribution_lane TEXT NOT NULL CHECK (
      attribution_lane IN ('EXACT_CLICK', 'USER_DATA_ONLY', 'UNATTRIBUTED')
    ),
    service_signal INTEGER NOT NULL DEFAULT 0 CHECK (service_signal IN (0, 1)),
    transaction_intent_signal INTEGER NOT NULL DEFAULT 0
      CHECK (transaction_intent_signal IN (0, 1)),
    location_signal INTEGER NOT NULL DEFAULT 0 CHECK (location_signal IN (0, 1)),
    schedule_signal INTEGER NOT NULL DEFAULT 0 CHECK (schedule_signal IN (0, 1)),
    contact_signal INTEGER NOT NULL DEFAULT 0 CHECK (contact_signal IN (0, 1)),
    qualified_candidate INTEGER NOT NULL DEFAULT 0
      CHECK (qualified_candidate IN (0, 1)),
    created_at TEXT NOT NULL,
    FOREIGN KEY (line_event_id) REFERENCES line_events (line_event_id)
      ON DELETE RESTRICT,
    FOREIGN KEY (lead_token) REFERENCES lead_tokens (lead_token)
      ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_lead_signal_observations_candidate
    ON lead_signal_observations (
      qualified_candidate,
      attribution_lane,
      observed_at
    )`,
  `CREATE INDEX IF NOT EXISTS idx_lead_signal_observations_line_user
    ON lead_signal_observations (line_user_key, observed_at)`,
  `CREATE TABLE IF NOT EXISTS lead_user_identifiers (
    identifier_id TEXT PRIMARY KEY NOT NULL,
    line_user_key TEXT NOT NULL,
    identifier_type TEXT NOT NULL CHECK (
      identifier_type IN ('EMAIL_SHA256', 'PHONE_SHA256')
    ),
    identifier_hash TEXT NOT NULL CHECK (length(identifier_hash) = 64),
    source_line_event_id TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (line_user_key, identifier_type, identifier_hash),
    FOREIGN KEY (source_line_event_id) REFERENCES line_events (line_event_id)
      ON DELETE RESTRICT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_lead_user_identifiers_line_user
    ON lead_user_identifiers (line_user_key, identifier_type, first_seen_at)`,
  `CREATE TABLE IF NOT EXISTS message_asset_metrics_daily (
    metric_date TEXT NOT NULL,
    google_ads_customer_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    asset_status TEXT,
    policy_status TEXT,
    impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    interactions INTEGER NOT NULL DEFAULT 0 CHECK (interactions >= 0),
    clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    conversions REAL NOT NULL DEFAULT 0 CHECK (conversions >= 0),
    all_conversions REAL NOT NULL DEFAULT 0 CHECK (all_conversions >= 0),
    cost_micros INTEGER NOT NULL DEFAULT 0 CHECK (cost_micros >= 0),
    provider_observed_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (
      metric_date,
      google_ads_customer_id,
      campaign_id,
      asset_id
    )
  )`,
  `CREATE INDEX IF NOT EXISTS idx_message_asset_metrics_campaign_date
    ON message_asset_metrics_daily (campaign_id, metric_date)`,
] as const;

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
};

export const ensureHighIntentShadowSchema = async (
  database: D1Database
): Promise<void> => {
  const key = database as unknown as object;
  if (schemaReady.has(key)) return;

  let inflight = schemaInflight.get(key);
  if (!inflight) {
    inflight = (async () => {
      const statements = SHADOW_SCHEMA_STATEMENTS.map((sql) =>
        database.prepare(sql)
      );
      await database.batch(statements);
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
            source_line_event_id, first_seen_at, created_at
          ) VALUES (?1,?2,?3,?4,?5,?6,?7)`
        ).bind(
          crypto.randomUUID(),
          input.lineUserKey,
          identifier.type,
          identifier.hash,
          input.lineEventId,
          input.observedAt,
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
