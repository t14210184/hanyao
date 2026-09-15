import type { D1Database } from "@cloudflare/workers-types";
import { extractLeadTokens } from "./lead-token.ts";
import {
  deriveLineUserKey,
  LINE_IDENTITY_KEY_ID,
  type ParsedLineEvent,
} from "./line-webhook.ts";
import type { Env } from "./types.ts";

export interface LineIdentityKey {
  keyId: string;
  secret: string;
}

export interface LineIdentityKeyring {
  current: LineIdentityKey;
  previous: LineIdentityKey | null;
}

export interface ResolvedLineIdentity {
  keyId: string;
  secret: string;
  lineUserKey: string | null;
  source: "CURRENT" | "EXISTING_EVENT" | "TOKEN_CLAIM" | "ACTIVE_DEDUPE";
}

interface DerivedCandidate extends LineIdentityKey {
  lineUserKey: string;
}

interface ExistingIdentityRow {
  line_user_key: string | null;
  business_subject_key: string | null;
  identity_key_id: string | null;
}

interface ClaimantRow {
  claimant_key: string;
}

interface DedupeLockRow {
  subject_key: string;
}

const KEY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;

const normalizeKeyId = (value: string | undefined, fallback: string): string => {
  const keyId = value?.trim() || fallback;
  if (!KEY_ID_PATTERN.test(keyId)) {
    throw new Error("LINE_IDENTITY_KEY_ID_INVALID");
  }
  return keyId;
};

export const resolveLineIdentityKeyring = (
  env: Pick<
    Env,
    | "LINE_USER_KEY_HMAC_SECRET"
    | "LINE_USER_KEY_HMAC_KEY_ID"
    | "LINE_USER_KEY_HMAC_PREVIOUS_KEY_ID"
    | "LINE_USER_KEY_HMAC_PREVIOUS_SECRET"
  >
): LineIdentityKeyring | null => {
  const currentSecret = env.LINE_USER_KEY_HMAC_SECRET?.trim();
  const previousKeyId = env.LINE_USER_KEY_HMAC_PREVIOUS_KEY_ID?.trim();
  const previousSecret = env.LINE_USER_KEY_HMAC_PREVIOUS_SECRET?.trim();

  if (!currentSecret) {
    if (previousKeyId || previousSecret) {
      throw new Error("LINE_IDENTITY_CURRENT_KEY_MISSING");
    }
    return null;
  }

  const current: LineIdentityKey = {
    keyId: normalizeKeyId(env.LINE_USER_KEY_HMAC_KEY_ID, LINE_IDENTITY_KEY_ID),
    secret: currentSecret,
  };

  if (Boolean(previousKeyId) !== Boolean(previousSecret)) {
    throw new Error("LINE_IDENTITY_PREVIOUS_KEY_INCOMPLETE");
  }
  if (!previousKeyId || !previousSecret) {
    return { current, previous: null };
  }

  const previous: LineIdentityKey = {
    keyId: normalizeKeyId(previousKeyId, ""),
    secret: previousSecret,
  };
  if (previous.keyId === current.keyId) {
    throw new Error("LINE_IDENTITY_KEY_ID_REUSED");
  }
  if (previous.secret === current.secret) {
    throw new Error("LINE_IDENTITY_SECRET_REUSED");
  }
  return { current, previous };
};

const deriveCandidates = async (
  userId: string,
  keyring: LineIdentityKeyring
): Promise<DerivedCandidate[]> => {
  const keys = keyring.previous
    ? [keyring.current, keyring.previous]
    : [keyring.current];
  return Promise.all(
    keys.map(async (key) => ({
      ...key,
      lineUserKey: await deriveLineUserKey(userId, key.secret),
    }))
  );
};

const candidateForSubjectKey = (
  candidates: DerivedCandidate[],
  subjectKey: string | null
): DerivedCandidate | null =>
  subjectKey
    ? candidates.find((candidate) => candidate.lineUserKey === subjectKey) ?? null
    : null;

const addEvidence = (
  evidence: Map<string, { candidate: DerivedCandidate; sources: Set<string> }>,
  candidate: DerivedCandidate | null,
  source: string
): void => {
  if (!candidate) return;
  const current = evidence.get(candidate.keyId) ?? {
    candidate,
    sources: new Set<string>(),
  };
  current.sources.add(source);
  evidence.set(candidate.keyId, current);
};

export const resolveLineIdentityForEvent = async (
  database: D1Database,
  event: ParsedLineEvent,
  keyring: LineIdentityKeyring
): Promise<ResolvedLineIdentity> => {
  if (event.sourceType !== "user" || !event.sourceUserId) {
    return {
      keyId: keyring.current.keyId,
      secret: keyring.current.secret,
      lineUserKey: null,
      source: "CURRENT",
    };
  }

  const candidates = await deriveCandidates(event.sourceUserId, keyring);
  const current = candidates[0];
  const evidence = new Map<
    string,
    { candidate: DerivedCandidate; sources: Set<string> }
  >();

  const existing = await database
    .prepare(
      `SELECT line_user_key, business_subject_key, identity_key_id
         FROM line_events WHERE webhook_event_id=?1`
    )
    .bind(event.webhookEventId)
    .first<ExistingIdentityRow>();

  if (existing) {
    if (
      existing.line_user_key &&
      existing.business_subject_key &&
      existing.line_user_key !== existing.business_subject_key
    ) {
      throw new Error("LINE_IDENTITY_STORED_SUBJECT_MISMATCH");
    }
    const storedKey = existing.business_subject_key || existing.line_user_key;
    if (storedKey) {
      const candidate = candidateForSubjectKey(candidates, storedKey);
      if (!candidate) {
        throw new Error("LINE_IDENTITY_KEY_VERSION_UNAVAILABLE");
      }
      if (
        existing.identity_key_id &&
        existing.identity_key_id !== "current" &&
        existing.identity_key_id !== candidate.keyId
      ) {
        throw new Error("LINE_IDENTITY_STORED_KEY_ID_MISMATCH");
      }
      addEvidence(evidence, candidate, "EXISTING_EVENT");
    }
  }

  if (event.eventType === "message" && event.messageType === "text" && event.messageText) {
    const tokens = extractLeadTokens(event.messageText);
    if (tokens.length === 1) {
      const claim = await database
        .prepare("SELECT claimant_key FROM token_claims WHERE lead_token=?1")
        .bind(tokens[0])
        .first<ClaimantRow>();
      addEvidence(
        evidence,
        candidateForSubjectKey(candidates, claim?.claimant_key ?? null),
        "TOKEN_CLAIM"
      );
    }
  }

  for (const candidate of candidates) {
    const active = await database
      .prepare(
        `SELECT subject_key FROM business_conversion_dedupe_locks
          WHERE subject_kind='LINE_USER_HMAC'
            AND subject_key=?1
            AND conversion_type='verified_line_contact'
            AND dedupe_until>?2`
      )
      .bind(candidate.lineUserKey, event.lineEventTimestamp)
      .first<DedupeLockRow>();
    if (active) addEvidence(evidence, candidate, "ACTIVE_DEDUPE");
  }

  if (evidence.size > 1) {
    throw new Error("LINE_IDENTITY_ROTATION_AMBIGUOUS");
  }
  if (evidence.size === 1) {
    const [{ candidate, sources }] = [...evidence.values()];
    const source = sources.has("EXISTING_EVENT")
      ? "EXISTING_EVENT"
      : sources.has("TOKEN_CLAIM")
        ? "TOKEN_CLAIM"
        : "ACTIVE_DEDUPE";
    return {
      keyId: candidate.keyId,
      secret: candidate.secret,
      lineUserKey: candidate.lineUserKey,
      source,
    };
  }

  return {
    keyId: current.keyId,
    secret: current.secret,
    lineUserKey: current.lineUserKey,
    source: "CURRENT",
  };
};
