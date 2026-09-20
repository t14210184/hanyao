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
