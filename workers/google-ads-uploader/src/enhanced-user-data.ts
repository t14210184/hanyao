import type { D1Database } from "@cloudflare/workers-types";

export const GOOGLE_DATA_MANAGER_MAX_USER_IDENTIFIERS = 10;

export type EnhancedIdentifierType =
  | "EMAIL_SHA256"
  | "PHONE_SHA256";

export interface EnhancedHashedIdentifier {
  type: EnhancedIdentifierType;
  hash: string;
}

export interface DataManagerUserIdentifier {
  emailAddress?: string;
  phoneNumber?: string;
}

export interface DataManagerUserData {
  userIdentifiers: DataManagerUserIdentifier[];
}

export type ConsentState = "GRANTED" | "DENIED" | "UNSPECIFIED";

export interface ConsentSnapshotInput {
  state: ConsentState;
  source: string;
  observedAt: string;
  policyVersion: string;
}

export interface EnhancedUserDataSnapshot {
  identifiers: EnhancedHashedIdentifier[];
  consentState: ConsentState;
  consentSource: string | null;
  consentObservedAt: string | null;
  consentPolicyVersion: string | null;
}

const SHA256_HEX = /^[0-9a-f]{64}$/;

export const normalizeEnhancedHashedIdentifiers = (
  identifiers: readonly EnhancedHashedIdentifier[] | null | undefined
): EnhancedHashedIdentifier[] => {
  if (!identifiers || identifiers.length === 0) return [];

  const seen = new Set<string>();
  const normalized: EnhancedHashedIdentifier[] = [];

  for (const identifier of identifiers) {
    if (
      (identifier.type !== "EMAIL_SHA256" &&
        identifier.type !== "PHONE_SHA256") ||
      !SHA256_HEX.test(identifier.hash.toLowerCase())
    ) {
      continue;
    }

    const hash = identifier.hash.toLowerCase();
    const key = `${identifier.type}:${hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ type: identifier.type, hash });

    if (normalized.length >= GOOGLE_DATA_MANAGER_MAX_USER_IDENTIFIERS) {
      break;
    }
  }

  return normalized;
};

export const buildDataManagerUserData = (
  identifiers: readonly EnhancedHashedIdentifier[] | null | undefined
): DataManagerUserData | null => {
  const normalized = normalizeEnhancedHashedIdentifiers(identifiers);
  if (normalized.length === 0) return null;

  return {
    userIdentifiers: normalized.map((identifier) =>
      identifier.type === "EMAIL_SHA256"
        ? { emailAddress: identifier.hash }
        : { phoneNumber: identifier.hash }
    ),
  };
};

const schemaReady = new WeakSet<object>();
const schemaInflight = new WeakMap<object, Promise<void>>();

const verifyEnhancedUserDataSchema = async (
  database: D1Database
): Promise<void> => {
  const row = await database
    .prepare(
      `SELECT COUNT(*) AS count
         FROM sqlite_master
        WHERE type='table'
          AND name IN (
            'lead_user_identifiers',
            'conversion_user_data_snapshots',
            'conversion_user_data_snapshot_items'
          )`
    )
    .first<{ count: number | string }>();

  if (Number(row?.count ?? 0) !== 3) {
    throw new Error("ENHANCED_USER_DATA_SCHEMA_INCOMPLETE");
  }
  const columns = await database
    .prepare(
      `SELECT COUNT(*) AS count
         FROM pragma_table_info('conversion_user_data_snapshots')
        WHERE name IN (
          'consent_state',
          'consent_source',
          'consent_observed_at',
          'consent_policy_version'
        )`
    )
    .first<{ count: number | string }>();
  if (Number(columns?.count ?? 0) !== 4) {
    throw new Error("ENHANCED_USER_DATA_CONSENT_SCHEMA_INCOMPLETE");
  }
};

export const ensureEnhancedUserDataSchema = async (
  database: D1Database
): Promise<void> => {
  const key = database as unknown as object;
  if (schemaReady.has(key)) return;

  let inflight = schemaInflight.get(key);
  if (!inflight) {
    inflight = (async () => {
      await verifyEnhancedUserDataSchema(database);
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

interface SnapshotIdentifierRow {
  identifier_type: EnhancedIdentifierType;
  identifier_hash: string;
}

interface SnapshotConsentRow {
  consent_state: ConsentState;
  consent_source: string | null;
  consent_observed_at: string | null;
  consent_policy_version: string | null;
}

export const readEnhancedUserDataSnapshotForConversion = async (
  database: D1Database,
  businessConversionId: string,
  snapshottedAt: string,
  consent: ConsentSnapshotInput = {
    state: "UNSPECIFIED",
    source: "NO_PER_RECORD_EVIDENCE",
    observedAt: snapshottedAt,
    policyVersion: "v1",
  }
): Promise<EnhancedUserDataSnapshot> => {
  await ensureEnhancedUserDataSchema(database);

  await database.batch([
    database
      .prepare(
        `INSERT OR IGNORE INTO conversion_user_data_snapshots (
          business_conversion_id, line_user_key, snapshot_version,
          snapshotted_at, sealed_at, consent_state, consent_source,
          consent_observed_at, consent_policy_version, created_at
        )
        SELECT business_conversion_id, subject_key, 1, ?2, NULL, ?3, ?4,
               ?5, ?6, ?2
          FROM business_conversions
         WHERE business_conversion_id=?1
           AND subject_kind='LINE_USER_HMAC'
           AND subject_key IS NOT NULL`
      )
      .bind(
        businessConversionId,
        snapshottedAt,
        consent.state,
        consent.source,
        consent.observedAt,
        consent.policyVersion
      ),
    database
      .prepare(
        `INSERT OR IGNORE INTO conversion_user_data_snapshot_items (
          business_conversion_id, identifier_type, identifier_hash,
          source_line_event_id, first_seen_at, created_at
        )
        SELECT snapshot.business_conversion_id,
               identifiers.identifier_type,
               lower(identifiers.identifier_hash),
               identifiers.source_line_event_id,
               identifiers.first_seen_at,
               ?2
          FROM conversion_user_data_snapshots snapshot
          JOIN lead_user_identifiers identifiers
            ON identifiers.line_user_key = snapshot.line_user_key
         WHERE snapshot.business_conversion_id=?1
           AND snapshot.sealed_at IS NULL
           AND identifiers.first_seen_at <= snapshot.snapshotted_at
           AND length(identifiers.identifier_hash)=64
           AND identifiers.identifier_hash NOT GLOB '*[^0-9a-fA-F]*'
         ORDER BY identifiers.first_seen_at,
                  identifiers.identifier_type,
                  identifiers.identifier_hash
         LIMIT ${GOOGLE_DATA_MANAGER_MAX_USER_IDENTIFIERS}`
      )
      .bind(businessConversionId, snapshottedAt),
    database
      .prepare(
        `UPDATE conversion_user_data_snapshots
            SET sealed_at=?2
          WHERE business_conversion_id=?1
            AND sealed_at IS NULL`
      )
      .bind(businessConversionId, snapshottedAt),
  ]);

  const result = await database
    .prepare(
      `SELECT identifier_type, identifier_hash
         FROM conversion_user_data_snapshot_items
        WHERE business_conversion_id=?1
        ORDER BY first_seen_at, identifier_type, identifier_hash
        LIMIT ${GOOGLE_DATA_MANAGER_MAX_USER_IDENTIFIERS}`
    )
    .bind(businessConversionId)
    .all<SnapshotIdentifierRow>();

  const consentRow = await database
    .prepare(
      `SELECT consent_state, consent_source, consent_observed_at,
              consent_policy_version
         FROM conversion_user_data_snapshots
        WHERE business_conversion_id=?1`
    )
    .bind(businessConversionId)
    .first<SnapshotConsentRow>();

  return {
    identifiers: normalizeEnhancedHashedIdentifiers(
      (result.results ?? []).map((row) => ({
        type: row.identifier_type,
        hash: row.identifier_hash,
      }))
    ),
    consentState: consentRow?.consent_state ?? "UNSPECIFIED",
    consentSource: consentRow?.consent_source ?? null,
    consentObservedAt: consentRow?.consent_observed_at ?? null,
    consentPolicyVersion: consentRow?.consent_policy_version ?? null,
  };
};

export const snapshotEnhancedUserDataForConversion = async (
  database: D1Database,
  businessConversionId: string,
  snapshottedAt: string,
  consent?: ConsentSnapshotInput
): Promise<EnhancedHashedIdentifier[]> =>
  (
    await readEnhancedUserDataSnapshotForConversion(
      database,
      businessConversionId,
      snapshottedAt,
      consent
    )
  ).identifiers;
