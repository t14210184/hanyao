import type { D1Database } from "@cloudflare/workers-types";

export type LeadStageType =
  | "QUALIFIED_CANDIDATE"
  | "QUALIFIED_CONFIRMED"
  | "WON_JOB";

export type LeadStageSource =
  | "RULE"
  | "HUMAN"
  | "JOB_SYSTEM"
  | "RULE_CONFIRMED"
  | "HUMAN_CONFIRMED"
  | "JOB_SCHEDULED"
  | "QUOTE_ACCEPTED"
  | "PAYMENT_CONFIRMED"
  | "SERVICE_COMPLETED";

export type LeadStageSourceCategory = "RULE" | "HUMAN" | "JOB_SYSTEM";
export type LeadStageEventSource = "MESSAGE" | "PHONE" | "OTHER";

export interface StructuredStageEvidence {
  realContact: boolean;
  serviceRelevant: boolean;
  commercialIntent: boolean;
  qualificationProof: boolean;
  dedupePass: boolean;
  sourceVerifiedContact: boolean;
  realBusinessEvidence: boolean;
  sourceIds: string[];
  factHashes?: string[];
}

export interface LeadStageEventInput {
  sourceVerifiedBusinessConversionId: string;
  lineUserKey?: string | null;
  stageType: LeadStageType;
  stageSource: LeadStageSource;
  stageRuleVersion: string;
  occurredAt: string;
  createdAt?: string;
  eventSource: LeadStageEventSource;
  evidence: StructuredStageEvidence;
  conversionValueMicros?: number | null;
  currencyCode?: string | null;
}

export interface LeadStageEventRecord {
  stageEventId: string;
  sourceVerifiedBusinessConversionId: string;
  lineUserKey: string | null;
  stageType: LeadStageType;
  stageSource: LeadStageSource;
  stageRuleVersion: string;
  evidenceDigest: string;
  idempotencyKey: string;
  occurredAt: string;
  eventSource: LeadStageEventSource;
  conversionValueMicros: number | null;
  currencyCode: string | null;
  createdAt: string;
}

export type StageWriteResult = {
  written: boolean;
  record: LeadStageEventRecord;
};

const SAFE_SOURCE_ID = /^[A-Za-z][A-Za-z0-9_-]{1,31}:[A-Za-z0-9_.:-]{1,160}$/;
const SAFE_HASH = /^[0-9a-fA-F]{64}$/;
const SAFE_RULE_VERSION = /^[A-Za-z0-9._:-]{1,80}$/;

const stageSourceCategoryMap: Record<LeadStageSource, LeadStageSourceCategory> = {
  RULE: "RULE",
  RULE_CONFIRMED: "RULE",
  HUMAN: "HUMAN",
  HUMAN_CONFIRMED: "HUMAN",
  JOB_SYSTEM: "JOB_SYSTEM",
  JOB_SCHEDULED: "JOB_SYSTEM",
  QUOTE_ACCEPTED: "JOB_SYSTEM",
  PAYMENT_CONFIRMED: "JOB_SYSTEM",
  SERVICE_COMPLETED: "JOB_SYSTEM",
};

export const stageSourceCategory = (
  source: LeadStageSource
): LeadStageSourceCategory => stageSourceCategoryMap[source];

const normalizeSourceIds = (sourceIds: string[]): string[] =>
  [...new Set(sourceIds.map((value) => value.trim()))].sort();

const normalizeFactHashes = (factHashes: string[] | undefined): string[] =>
  [...new Set((factHashes ?? []).map((value) => value.trim().toLowerCase()))].sort();

const canonicalEvidence = (evidence: StructuredStageEvidence): string =>
  JSON.stringify({
    commercialIntent: evidence.commercialIntent,
    dedupePass: evidence.dedupePass,
    factHashes: normalizeFactHashes(evidence.factHashes),
    qualificationProof: evidence.qualificationProof,
    realBusinessEvidence: evidence.realBusinessEvidence,
    realContact: evidence.realContact,
    serviceRelevant: evidence.serviceRelevant,
    sourceIds: normalizeSourceIds(evidence.sourceIds),
    sourceVerifiedContact: evidence.sourceVerifiedContact,
  });

const sha256Hex = async (value: string): Promise<string> => {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const assertInputShape = (input: LeadStageEventInput): void => {
  if (!input.sourceVerifiedBusinessConversionId.trim()) {
    throw new Error("STAGE_SOURCE_VERIFIED_CONVERSION_MISSING");
  }
  if (!SAFE_RULE_VERSION.test(input.stageRuleVersion.trim())) {
    throw new Error("STAGE_RULE_VERSION_INVALID");
  }
  if (!Number.isFinite(Date.parse(input.occurredAt))) {
    throw new Error("STAGE_OCCURRED_AT_INVALID");
  }
  if (input.createdAt && !Number.isFinite(Date.parse(input.createdAt))) {
    throw new Error("STAGE_CREATED_AT_INVALID");
  }
  if (input.lineUserKey && !/^lu_v1_[A-Za-z0-9_-]{20,160}$/.test(input.lineUserKey)) {
    throw new Error("STAGE_LINE_USER_KEY_INVALID");
  }
  if (input.evidence.sourceIds.length === 0) {
    throw new Error("STAGE_EVIDENCE_SOURCE_MISSING");
  }
  if (input.evidence.sourceIds.some((value) => !SAFE_SOURCE_ID.test(value.trim()))) {
    throw new Error("STAGE_EVIDENCE_SOURCE_UNSAFE");
  }
  if ((input.evidence.factHashes ?? []).some((value) => !SAFE_HASH.test(value.trim()))) {
    throw new Error("STAGE_EVIDENCE_HASH_INVALID");
  }
  if (input.conversionValueMicros !== null && input.conversionValueMicros !== undefined) {
    if (!Number.isSafeInteger(input.conversionValueMicros) || input.conversionValueMicros < 0) {
      throw new Error("STAGE_CONVERSION_VALUE_INVALID");
    }
  }
  if (input.currencyCode !== null && input.currencyCode !== undefined && !/^[A-Z]{3}$/.test(input.currencyCode)) {
    throw new Error("STAGE_CURRENCY_INVALID");
  }
};

export const qualifiedConfirmationFailures = (
  evidence: StructuredStageEvidence
): string[] => {
  const failures: string[] = [];
  if (!evidence.realContact) failures.push("REAL_CONTACT_REQUIRED");
  if (!evidence.serviceRelevant) failures.push("SERVICE_RELEVANT_REQUIRED");
  if (!evidence.commercialIntent) failures.push("COMMERCIAL_INTENT_REQUIRED");
  if (!evidence.qualificationProof) failures.push("QUALIFICATION_PROOF_REQUIRED");
  if (!evidence.dedupePass) failures.push("STAGE_DEDUPE_REQUIRED");
  if (!evidence.sourceVerifiedContact) failures.push("SOURCE_VERIFIED_CONTACT_REQUIRED");
  return failures;
};

export const assertStageCanBeProjected = (
  input: LeadStageEventInput
): void => {
  assertInputShape(input);
  if (input.stageType === "QUALIFIED_CONFIRMED") {
    const failures = qualifiedConfirmationFailures(input.evidence);
    if (failures.length > 0) {
      throw new Error(`QUALIFIED_CONFIRMATION_GATE_FAILED:${failures.join(",")}`);
    }
  }
  if (input.stageType === "WON_JOB") {
    if (!input.evidence.realBusinessEvidence) {
      throw new Error("WON_JOB_BUSINESS_EVIDENCE_REQUIRED");
    }
    if (!input.conversionValueMicros || input.conversionValueMicros <= 0) {
      throw new Error("WON_JOB_VALUE_REQUIRED");
    }
    if (!input.currencyCode) throw new Error("WON_JOB_CURRENCY_REQUIRED");
    if (input.eventSource !== "OTHER") throw new Error("WON_JOB_EVENT_SOURCE_INVALID");
  }
};

const buildIdentityMaterial = (input: LeadStageEventInput): string =>
  JSON.stringify({
    sourceVerifiedBusinessConversionId: input.sourceVerifiedBusinessConversionId.trim(),
    stageRuleVersion: input.stageRuleVersion.trim(),
    stageSource: input.stageSource,
    stageType: input.stageType,
    sourceIds: normalizeSourceIds(input.evidence.sourceIds),
  });

export const buildLeadStageEventRecord = async (
  input: LeadStageEventInput
): Promise<LeadStageEventRecord> => {
  assertStageCanBeProjected(input);
  const evidenceDigest = await sha256Hex(`hanyao-stage-evidence:v1:${canonicalEvidence(input.evidence)}`);
  const idempotencyKey = await sha256Hex(`hanyao-stage-idempotency:v1:${buildIdentityMaterial(input)}`);
  const stageEventId = await sha256Hex(`hanyao-stage-event:v1:${idempotencyKey}`);
  return {
    stageEventId,
    sourceVerifiedBusinessConversionId: input.sourceVerifiedBusinessConversionId.trim(),
    lineUserKey: input.lineUserKey?.trim() || null,
    stageType: input.stageType,
    stageSource: input.stageSource,
    stageRuleVersion: input.stageRuleVersion.trim(),
    evidenceDigest,
    idempotencyKey,
    occurredAt: input.occurredAt,
    eventSource: input.eventSource,
    conversionValueMicros: input.conversionValueMicros ?? null,
    currencyCode: input.currencyCode ?? null,
    createdAt: input.createdAt ?? input.occurredAt,
  };
};

export const recordLeadStageEvent = async (
  database: D1Database,
  input: LeadStageEventInput
): Promise<StageWriteResult> => {
  const record = await buildLeadStageEventRecord(input);
  const result = await database
    .prepare(
      `INSERT OR IGNORE INTO lead_stage_events (
        stage_event_id, source_verified_business_conversion_id, line_user_key,
        stage_type, stage_source, stage_rule_version, evidence_digest,
        idempotency_key, occurred_at, event_source, conversion_value_micros,
        currency_code, created_at
      ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)`
    )
    .bind(
      record.stageEventId,
      record.sourceVerifiedBusinessConversionId,
      record.lineUserKey,
      record.stageType,
      record.stageSource,
      record.stageRuleVersion,
      record.evidenceDigest,
      record.idempotencyKey,
      record.occurredAt,
      record.eventSource,
      record.conversionValueMicros,
      record.currencyCode,
      record.createdAt
    )
    .run();
  return {
    written: Number(result.meta?.changes ?? 0) === 1,
    record,
  };
};

interface StageRowForProjection {
  stage_event_id: string;
  source_verified_business_conversion_id: string;
  line_user_key: string | null;
  stage_type: LeadStageType;
  stage_source: LeadStageSource;
  stage_rule_version: string;
  occurred_at: string;
  event_source: LeadStageEventSource;
  conversion_value_micros: number | string | null;
  currency_code: string | null;
}

interface VerifiedConversionSnapshot {
  business_conversion_id: string;
  subject_kind: "LINE_USER_HMAC" | "ATTRIBUTION_SESSION";
  subject_key: string;
  attribution_session_id: string;
  first_lead_token: string;
  first_line_event_id: string;
  first_webhook_event_id: string | null;
  conversion_time: string;
  dedupe_until: string;
  attribution_touch: "first" | "last";
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  lineage_observed_at: string;
}

interface CanonicalBusinessRow {
  business_conversion_id: string;
  transaction_id: string;
  conversion_type: "verified_line_contact" | "qualified_line_lead" | "won_job";
  subject_kind: "LINE_USER_HMAC" | "ATTRIBUTION_SESSION";
  subject_key: string;
  first_lead_token: string;
  destination_key: string;
  conversion_action_id: string;
  stage_event_id: string | null;
  dedupe_until: string;
  lineage_observed_at: string;
  conversion_value_micros: number | string | null;
  currency_code: string | null;
}

interface CanonicalLockRow {
  subject_kind: "LINE_USER_HMAC" | "ATTRIBUTION_SESSION";
  subject_key: string;
  conversion_type: "verified_line_contact" | "qualified_line_lead" | "won_job";
  active_business_conversion_id: string;
  dedupe_until: string;
}

interface CanonicalOutboxRow {
  conversion_id: string;
  lead_token: string;
  conversion_type: "verified_line_contact" | "qualified_line_lead" | "won_job";
  transaction_id: string;
  destination_key: string;
  google_ads_account_id: string | null;
  google_ads_conversion_action_id: string | null;
  business_conversion_id: string | null;
  stage_event_id: string | null;
  event_source: LeadStageEventSource;
  conversion_value_micros: number | string | null;
  currency_code: string | null;
}

interface CanonicalExpectation {
  businessConversionId: string;
  conversionId: string;
  transactionId: string;
  conversionType: "qualified_line_lead" | "won_job";
  destinationKey: "HY_QUALIFIED_LINE_LEAD" | "HY_WON_JOB";
  actionId: string;
  accountId: string;
  stageEventId: string;
  sourceVerifiedBusinessConversionId: string;
  stageDedupeUntil: string;
  leadToken: string;
  subjectKind: "LINE_USER_HMAC" | "ATTRIBUTION_SESSION";
  subjectKey: string;
  eventSource: LeadStageEventSource;
  conversionValueMicros: number | null;
  currencyCode: string | null;
}

interface CanonicalPrestate {
  stage: StageRowForProjection | null;
  business: CanonicalBusinessRow[];
  lock: CanonicalLockRow | null;
  outbox: CanonicalOutboxRow[];
}

/**
 * Repeat-stage policy: one canonical Qualified outcome and one canonical Won
 * Job outcome are allowed per verified inquiry. A later stage event of the
 * same conversion type is rejected with STAGE_REPEAT_OUTCOME_BLOCKED. This
 * makes the legacy lead-token/type unique key an intentional business rule,
 * rather than an accidental carry-over from the Verified-only schema.
 */
export const REPEAT_STAGE_POLICY =
  "ONE_CANONICAL_OUTCOME_PER_VERIFIED_INQUIRY_AND_STAGE_TYPE" as const;

/**
 * Later-stage dedupe fences are anchored to the actual stage occurrence. They
 * never inherit the Verified contact window, which may already be expired.
 */
export const STAGE_DEDUPE_WINDOW_DAYS = {
  QUALIFIED_CONFIRMED: 30,
  WON_JOB: 365,
} as const;

export const deriveStageDedupeUntil = (
  stageType: "QUALIFIED_CONFIRMED" | "WON_JOB",
  occurredAt: string
): string => {
  const occurred = Date.parse(occurredAt);
  if (!Number.isFinite(occurred)) throw new Error("STAGE_OCCURRED_AT_INVALID");
  return new Date(
    occurred + STAGE_DEDUPE_WINDOW_DAYS[stageType] * 24 * 60 * 60 * 1000
  ).toISOString();
};

const stageDestination = (stageType: LeadStageType): {
  conversionType: "qualified_line_lead" | "won_job";
  destinationKey: "HY_QUALIFIED_LINE_LEAD" | "HY_WON_JOB";
} | null => {
  if (stageType === "QUALIFIED_CONFIRMED") {
    return {
      conversionType: "qualified_line_lead",
      destinationKey: "HY_QUALIFIED_LINE_LEAD",
    };
  }
  if (stageType === "WON_JOB") {
    return { conversionType: "won_job", destinationKey: "HY_WON_JOB" };
  }
  return null;
};

const assertActionId = (value: string): string => {
  const actionId = value.trim();
  if (!/^\d{6,20}$/.test(actionId)) {
    throw new Error("STAGE_DESTINATION_ACTION_UNAVAILABLE");
  }
  return actionId;
};

const valueMatches = (
  actual: number | string | null,
  expected: number | null
): boolean =>
  expected === null
    ? actual === null
    : actual !== null && Number(actual) === expected;

const exactBusinessMatches = (
  row: CanonicalBusinessRow | undefined,
  expected: CanonicalExpectation
): boolean => Boolean(
  row &&
  row.business_conversion_id === expected.businessConversionId &&
  row.transaction_id === expected.transactionId &&
  row.conversion_type === expected.conversionType &&
  row.subject_kind === expected.subjectKind &&
  row.subject_key === expected.subjectKey &&
  row.first_lead_token === expected.leadToken &&
  row.destination_key === expected.destinationKey &&
  row.conversion_action_id === expected.actionId &&
  row.stage_event_id === expected.stageEventId &&
  row.dedupe_until === expected.stageDedupeUntil &&
  valueMatches(row.conversion_value_micros, expected.conversionValueMicros) &&
  row.currency_code === expected.currencyCode
);

const exactLockMatches = (
  row: CanonicalLockRow | null,
  expected: CanonicalExpectation
): boolean => Boolean(
  row &&
  row.subject_kind === expected.subjectKind &&
  row.subject_key === expected.subjectKey &&
  row.conversion_type === expected.conversionType &&
  row.active_business_conversion_id === expected.businessConversionId &&
  row.dedupe_until === expected.stageDedupeUntil
);

const exactOutboxMatches = (
  row: CanonicalOutboxRow | undefined,
  expected: CanonicalExpectation
): boolean => Boolean(
  row &&
  row.conversion_id === expected.conversionId &&
  row.lead_token === expected.leadToken &&
  row.conversion_type === expected.conversionType &&
  row.transaction_id === expected.transactionId &&
  row.destination_key === expected.destinationKey &&
  row.google_ads_account_id === expected.accountId &&
  row.google_ads_conversion_action_id === expected.actionId &&
  row.business_conversion_id === expected.businessConversionId &&
  row.stage_event_id === expected.stageEventId &&
  row.event_source === expected.eventSource &&
  valueMatches(row.conversion_value_micros, expected.conversionValueMicros) &&
  row.currency_code === expected.currencyCode
);

const exactStageMatches = (
  row: StageRowForProjection | null,
  expected: CanonicalExpectation
): boolean => Boolean(
  row &&
  row.stage_event_id === expected.stageEventId &&
  row.source_verified_business_conversion_id ===
    expected.sourceVerifiedBusinessConversionId &&
  row.event_source === expected.eventSource &&
  valueMatches(row.conversion_value_micros, expected.conversionValueMicros) &&
  row.currency_code === expected.currencyCode
);

const exactCanonicalMatches = (
  state: CanonicalPrestate,
  expected: CanonicalExpectation
): boolean =>
  exactStageMatches(state.stage, expected) &&
  exactBusinessMatches(
    state.business.find((row) => row.stage_event_id === expected.stageEventId),
    expected
  ) &&
  exactLockMatches(state.lock, expected) &&
  exactOutboxMatches(
    state.outbox.find((row) => row.stage_event_id === expected.stageEventId),
    expected
  );

const hasCurrentIdentity = (
  state: CanonicalPrestate,
  expected: CanonicalExpectation
): boolean =>
  state.business.some(
    (row) =>
      row.stage_event_id === expected.stageEventId ||
      row.business_conversion_id === expected.businessConversionId ||
      row.transaction_id === expected.transactionId
  ) ||
  state.outbox.some(
    (row) =>
      row.stage_event_id === expected.stageEventId ||
      row.conversion_id === expected.conversionId ||
      row.transaction_id === expected.transactionId
  ) ||
  state.lock?.active_business_conversion_id === expected.businessConversionId;

const hasCurrentIdentityCollision = (
  state: CanonicalPrestate,
  expected: CanonicalExpectation
): boolean =>
  state.business.some(
    (row) =>
      (row.stage_event_id === expected.stageEventId ||
        row.business_conversion_id === expected.businessConversionId ||
        row.transaction_id === expected.transactionId) &&
      !exactBusinessMatches(row, expected)
  ) ||
  state.outbox.some(
    (row) =>
      (row.stage_event_id === expected.stageEventId ||
        row.conversion_id === expected.conversionId ||
        row.transaction_id === expected.transactionId) &&
      !exactOutboxMatches(row, expected)
  );

const hasRepeatStage = (
  state: CanonicalPrestate,
  expected: CanonicalExpectation
): boolean =>
  state.business.some(
    (row) =>
      row.first_lead_token === expected.leadToken &&
      row.conversion_type === expected.conversionType &&
      row.stage_event_id !== expected.stageEventId
  ) ||
  state.outbox.some(
    (row) =>
      row.lead_token === expected.leadToken &&
      row.conversion_type === expected.conversionType &&
      row.stage_event_id !== expected.stageEventId
  );

const evaluatePrestate = (
  state: CanonicalPrestate,
  expected: CanonicalExpectation
): "CLEAN" | "ALREADY_PRESENT" => {
  if (exactCanonicalMatches(state, expected)) return "ALREADY_PRESENT";
  if (hasCurrentIdentityCollision(state, expected)) {
    throw new Error("CANONICAL_STAGE_CONFLICT");
  }
  if (hasCurrentIdentity(state, expected)) {
    throw new Error("RECONCILIATION_REQUIRED");
  }
  if (hasRepeatStage(state, expected)) {
    throw new Error("STAGE_REPEAT_OUTCOME_BLOCKED");
  }
  if (
    state.lock &&
    state.lock.active_business_conversion_id !== expected.businessConversionId
  ) {
    throw new Error("STAGE_DEDUPE_LOCK_CONFLICT");
  }
  return "CLEAN";
};

const readCanonicalPrestate = async (
  database: D1Database,
  stageEventId: string,
  source: VerifiedConversionSnapshot,
  expected: CanonicalExpectation
): Promise<CanonicalPrestate> => {
  const [stage, businessRows, lock, outboxRows] = await Promise.all([
    database
      .prepare(
        `SELECT stage_event_id, source_verified_business_conversion_id, line_user_key,
                stage_type, stage_source, stage_rule_version, occurred_at, event_source,
                conversion_value_micros, currency_code
           FROM lead_stage_events WHERE stage_event_id=?1`
      )
      .bind(stageEventId)
      .first<StageRowForProjection>(),
    database
      .prepare(
        `SELECT business_conversion_id, transaction_id, conversion_type, subject_kind,
                subject_key, first_lead_token, destination_key, conversion_action_id,
                stage_event_id, dedupe_until, lineage_observed_at,
                conversion_value_micros, currency_code
           FROM business_conversions
          WHERE business_conversion_id=?1 OR transaction_id=?2 OR stage_event_id=?3
             OR (first_lead_token=?4 AND conversion_type=?5)`
      )
      .bind(
        expected.businessConversionId,
        expected.transactionId,
        expected.stageEventId,
        source.first_lead_token,
        expected.conversionType
      )
      .all<CanonicalBusinessRow>(),
    database
      .prepare(
        `SELECT subject_kind, subject_key, conversion_type,
                active_business_conversion_id, dedupe_until
           FROM business_conversion_dedupe_locks
          WHERE subject_kind=?1 AND subject_key=?2 AND conversion_type=?3`
      )
      .bind(source.subject_kind, source.subject_key, expected.conversionType)
      .first<CanonicalLockRow>(),
    database
      .prepare(
        `SELECT conversion_id, lead_token, conversion_type, transaction_id,
                destination_key, google_ads_account_id,
                google_ads_conversion_action_id,
                business_conversion_id, stage_event_id, event_source,
                conversion_value_micros, currency_code
           FROM conversion_outbox
          WHERE conversion_id=?1 OR transaction_id=?2 OR stage_event_id=?3
             OR (lead_token=?4 AND conversion_type=?5)`
      )
      .bind(
        expected.conversionId,
        expected.transactionId,
        expected.stageEventId,
        source.first_lead_token,
        expected.conversionType
      )
      .all<CanonicalOutboxRow>(),
  ]);
  return {
    stage,
    business: businessRows.results ?? [],
    lock,
    outbox: outboxRows.results ?? [],
  };
};

/**
 * Projects only a confirmed stage into the existing business_conversions and
 * conversion_outbox tables. The classifier has no call path to this function;
 * a candidate therefore cannot become a canonical conversion by observation.
 *
 * The prestate is classified before any write. A clean state uses ordinary
 * INSERT statements in one D1 batch, whose transaction is atomic. A failed or
 * partial poststate is never silently repaired or retried.
 */
export const projectConfirmedStageToCanonicalOutbox = async (
  database: D1Database,
  stageEventId: string,
  conversionActionId: string,
  googleAdsAccountId: string,
  nowIso: string
): Promise<"CREATED" | "ALREADY_PRESENT"> => {
  const stage = await database
    .prepare(
      `SELECT stage_event_id, source_verified_business_conversion_id, line_user_key,
              stage_type, stage_source, stage_rule_version, occurred_at, event_source,
              conversion_value_micros, currency_code
         FROM lead_stage_events WHERE stage_event_id=?1`
    )
    .bind(stageEventId)
    .first<StageRowForProjection>();
  if (!stage) throw new Error("STAGE_EVENT_NOT_FOUND");
  const destination = stageDestination(stage.stage_type);
  if (!destination) throw new Error("STAGE_CANDIDATE_NOT_PROJECTABLE");
  if (
    stage.stage_type !== "QUALIFIED_CONFIRMED" &&
    stage.stage_type !== "WON_JOB"
  ) {
    throw new Error("STAGE_CANDIDATE_NOT_PROJECTABLE");
  }
  const actionId = assertActionId(conversionActionId);
  const accountId = googleAdsAccountId.trim();
  if (!/^\d{6,20}$/.test(accountId)) {
    throw new Error("STAGE_DESTINATION_ACCOUNT_INVALID");
  }
  const value = stage.conversion_value_micros === null
    ? null
    : Number(stage.conversion_value_micros);
  const hasPositiveValue =
    value !== null && Number.isSafeInteger(value) && value > 0;
  if (destination.conversionType === "won_job" &&
      (!hasPositiveValue || !stage.currency_code)) {
    throw new Error("WON_JOB_VALUE_REQUIRED");
  }

  const source = await database
    .prepare(
      `SELECT business_conversion_id, subject_kind, subject_key,
              attribution_session_id, first_lead_token, first_line_event_id,
              first_webhook_event_id, conversion_time, dedupe_until,
              attribution_touch, gclid, gbraid, wbraid, lineage_observed_at
         FROM business_conversions
        WHERE business_conversion_id=?1 AND conversion_type='verified_line_contact'`
    )
    .bind(stage.source_verified_business_conversion_id)
    .first<VerifiedConversionSnapshot>();
  if (!source) throw new Error("STAGE_SOURCE_CONVERSION_NOT_FOUND");

  const businessConversionId = `stage_bc_${stage.stage_event_id}`;
  const conversionId = `stage_outbox_${stage.stage_event_id}`;
  const transactionId = `stage_tx_${await sha256Hex(
    `${stage.stage_event_id}\0${destination.conversionType}\0${actionId}`
  )}`;
  const stageDedupeUntil = deriveStageDedupeUntil(
    stage.stage_type,
    stage.occurred_at
  );
  const expected: CanonicalExpectation = {
    businessConversionId,
    conversionId,
    transactionId,
    conversionType: destination.conversionType,
    destinationKey: destination.destinationKey,
    actionId,
    accountId,
    stageEventId: stage.stage_event_id,
    sourceVerifiedBusinessConversionId:
      stage.source_verified_business_conversion_id,
    stageDedupeUntil,
    leadToken: source.first_lead_token,
    subjectKind: source.subject_kind,
    subjectKey: source.subject_key,
    eventSource: stage.event_source,
    conversionValueMicros: value,
    currencyCode: stage.currency_code,
  };
  const prestate = await readCanonicalPrestate(
    database,
    stage.stage_event_id,
    source,
    expected
  );
  if (evaluatePrestate(prestate, expected) === "ALREADY_PRESENT") {
    return "ALREADY_PRESENT";
  }

  const eligibilityReason = `STAGE_LEDGER_CONFIRMED_${stage.stage_type}`;
  let results: Array<{ meta?: { changes?: number } }>;
  try {
    results = await database.batch([
      database
        .prepare(
          `INSERT INTO business_conversions (
            business_conversion_id, transaction_id, conversion_type, subject_kind, subject_key,
            attribution_session_id, first_lead_token, first_line_event_id, first_webhook_event_id,
            conversion_time, dedupe_until, attribution_touch, gclid, gbraid, wbraid,
            lineage_observed_at, destination_key, conversion_action_id,
            eligibility_state, eligibility_reason, eligibility_evaluated_at,
            outcome_state, created_at, updated_at, version, stage_event_id,
            conversion_value_micros, currency_code
          ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,
                    'ELIGIBLE',?19,?20,'PENDING',?20,?20,1,?21,?22,?23)`
        )
        .bind(
          businessConversionId,
          transactionId,
          destination.conversionType,
          source.subject_kind,
          source.subject_key,
          source.attribution_session_id,
          source.first_lead_token,
          source.first_line_event_id,
          source.first_webhook_event_id,
          stage.occurred_at,
          stageDedupeUntil,
          source.attribution_touch,
          source.gclid,
          source.gbraid,
          source.wbraid,
          stage.occurred_at,
          destination.destinationKey,
          actionId,
          eligibilityReason,
          nowIso,
          stage.stage_event_id,
          value,
          stage.currency_code
        ),
      database
        .prepare(
          `INSERT INTO business_conversion_dedupe_locks (
            subject_kind, subject_key, conversion_type, active_business_conversion_id,
            dedupe_until, last_lineage_observed_at, fence_version, updated_at
          ) VALUES (?1,?2,?3,?4,?5,?6,0,?7)`
        )
        .bind(
          source.subject_kind,
          source.subject_key,
          destination.conversionType,
          businessConversionId,
          stageDedupeUntil,
          stage.occurred_at,
          nowIso
        ),
      database
        .prepare(
          `INSERT INTO conversion_outbox (
            conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid, wbraid,
            attribution_touch, transaction_id, destination_key, status, retry_count,
            created_at, updated_at, business_conversion_id, snapshot_version,
            eligibility_rule_version, google_ads_account_id, google_ads_conversion_action_id,
            event_source, lease_generation, stage_event_id, conversion_value_micros, currency_code
          ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'pending',0,?11,?11,?12,1,?13,?14,?15,?16,0,?17,?18,?19)`
        )
        .bind(
          conversionId,
          source.first_lead_token,
          destination.conversionType,
          stage.occurred_at,
          source.gclid,
          source.gbraid,
          source.wbraid,
          source.attribution_touch,
          transactionId,
          destination.destinationKey,
          nowIso,
          businessConversionId,
          stage.stage_rule_version,
          accountId,
          actionId,
          stage.event_source,
          stage.stage_event_id,
          value,
          stage.currency_code
        ),
    ]);
  } catch {
    const postFailureState = await readCanonicalPrestate(
      database,
      stage.stage_event_id,
      source,
      expected
    );
    if (exactCanonicalMatches(postFailureState, expected)) {
      return "ALREADY_PRESENT";
    }
    try {
      evaluatePrestate(postFailureState, expected);
    } catch (error) {
      throw error;
    }
    throw new Error("CANONICAL_BATCH_FAILED_ROLLED_BACK");
  }

  if (
    results.length !== 3 ||
    results.some((result) => Number(result.meta?.changes ?? 0) !== 1)
  ) {
    throw new Error("CANONICAL_BATCH_RESULT_INVALID");
  }

  const poststate = await readCanonicalPrestate(
    database,
    stage.stage_event_id,
    source,
    expected
  );
  if (!exactCanonicalMatches(poststate, expected)) {
    throw new Error("RECONCILIATION_REQUIRED");
  }
  return "CREATED";
};
