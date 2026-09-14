import type { AttributionSessionRow, GoogleAdsAttributionSelection } from "./attribution.ts";
import { selectGoogleAdsAttribution } from "./attribution.ts";

export const LEAD_ATTRIBUTION_SNAPSHOT_VERSION = 1 as const;
export const LEAD_LINEAGE_RULE_VERSION = "google-ads-last-then-first-v1" as const;

export interface LeadAttributionSnapshot {
  schema_version: typeof LEAD_ATTRIBUTION_SNAPSHOT_VERSION;
  session_reference: string | null;
  selected_touch: "last" | "first" | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  touch_captured_at: string | null;
  issued_at: string;
  session_expires_at: string | null;
  source_rule_version: typeof LEAD_LINEAGE_RULE_VERSION;
}

export interface StoredLeadAttributionSnapshot {
  json: string;
  hash: string;
  ruleVersion: typeof LEAD_LINEAGE_RULE_VERSION;
}
interface StoredLeadAttributionFields {
  session_id: string | null;
  attribution_snapshot_json: string | null;
  attribution_snapshot_hash: string | null;
  lineage_rule_version: string | null;
}

const sha256Hex = async (value: string): Promise<string> => {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const touchCapturedAt = (
  session: AttributionSessionRow,
  selection: GoogleAdsAttributionSelection | null
): string | null => {
  if (!selection) return null;
  return selection.attribution_touch === "last"
    ? session.last_captured_at
    : session.first_captured_at;
};
export const createLeadAttributionSnapshot = async (
  session: AttributionSessionRow | null,
  issuedAt: string
): Promise<StoredLeadAttributionSnapshot> => {
  const selection = session ? selectGoogleAdsAttribution(session) : null;
  const snapshot: LeadAttributionSnapshot = {
    schema_version: LEAD_ATTRIBUTION_SNAPSHOT_VERSION,
    session_reference: session?.session_id ?? null,
    selected_touch: selection?.attribution_touch ?? null,
    gclid: selection?.gclid ?? null,
    gbraid: selection?.gbraid ?? null,
    wbraid: selection?.wbraid ?? null,
    touch_captured_at: session ? touchCapturedAt(session, selection) : null,
    issued_at: issuedAt,
    session_expires_at: session?.expires_at ?? null,
    source_rule_version: LEAD_LINEAGE_RULE_VERSION,
  };
  const json = JSON.stringify(snapshot);
  return {
    json,
    hash: await sha256Hex(json),
    ruleVersion: LEAD_LINEAGE_RULE_VERSION,
  };
};
const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isSelectedTouch = (
  value: unknown
): value is "last" | "first" | null =>
  value === null || value === "last" || value === "first";

export const readVerifiedLeadAttributionSnapshot = async (
  row: StoredLeadAttributionFields
): Promise<LeadAttributionSnapshot | null> => {
  if (row.lineage_rule_version === null) return null;
  if (row.lineage_rule_version !== LEAD_LINEAGE_RULE_VERSION) {
    throw new Error("LEAD_ATTRIBUTION_SNAPSHOT_RULE_UNSUPPORTED");
  }
  if (!row.attribution_snapshot_json || !row.attribution_snapshot_hash) {
    throw new Error("LEAD_ATTRIBUTION_SNAPSHOT_MISSING");
  }
  if (await sha256Hex(row.attribution_snapshot_json) !== row.attribution_snapshot_hash) {
    throw new Error("LEAD_ATTRIBUTION_SNAPSHOT_HASH_MISMATCH");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.attribution_snapshot_json);
  } catch {
    throw new Error("LEAD_ATTRIBUTION_SNAPSHOT_INVALID_JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("LEAD_ATTRIBUTION_SNAPSHOT_INVALID_SHAPE");
  }
  const value = parsed as Record<string, unknown>;
  if (
    value.schema_version !== LEAD_ATTRIBUTION_SNAPSHOT_VERSION ||
    value.source_rule_version !== LEAD_LINEAGE_RULE_VERSION ||
    !isNullableString(value.session_reference) ||
    value.session_reference !== row.session_id ||
    !isSelectedTouch(value.selected_touch) ||
    !isNullableString(value.gclid) ||
    !isNullableString(value.gbraid) ||
    !isNullableString(value.wbraid) ||
    !isNullableString(value.touch_captured_at) ||
    typeof value.issued_at !== "string" ||
    !isNullableString(value.session_expires_at)
  ) {
    throw new Error("LEAD_ATTRIBUTION_SNAPSHOT_INVALID_SHAPE");
  }
  const hasClickIdentifier = Boolean(value.gclid || value.gbraid || value.wbraid);
  if (
    !Number.isFinite(Date.parse(value.issued_at)) ||
    (value.touch_captured_at !== null && !Number.isFinite(Date.parse(value.touch_captured_at))) ||
    (value.session_expires_at !== null && !Number.isFinite(Date.parse(value.session_expires_at))) ||
    (value.session_reference === null &&
      (value.selected_touch !== null || hasClickIdentifier || value.session_expires_at !== null)) ||
    (value.session_reference !== null && value.session_expires_at === null) ||
    (value.selected_touch === null && hasClickIdentifier) ||
    (value.selected_touch !== null && !hasClickIdentifier)
  ) {
    throw new Error("LEAD_ATTRIBUTION_SNAPSHOT_INVALID_CONTRACT");
  }
  return value as unknown as LeadAttributionSnapshot;
};
