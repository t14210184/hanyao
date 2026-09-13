import type { D1Database } from "@cloudflare/workers-types";
import {
  MAX_UPLOAD_ATTEMPTS,
  STALE_PROCESSING_THRESHOLD_MS,
  type ConversionOutboxRow,
  type OutboxRepository,
} from "./types.ts";

const OUTBOX_COLUMNS = `
  conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid,
  wbraid, attribution_touch, transaction_id, destination_key, status,
  retry_count, next_retry_at, last_error_code, created_at, sent_at,
  submitted_at, google_request_id, next_diagnostic_at, terminal_result,
  last_error_reason, diagnostic_status, diagnostic_record_count,
  diagnostic_error_reason, diagnostic_attempt_count, updated_at,
  business_conversion_id, snapshot_version, eligibility_rule_version,
  google_ads_account_id, google_ads_conversion_action_id, event_source,
  lease_generation, lease_owner, lease_expires_at`;

const changesFrom = (result: { meta?: { changes?: number } }): number =>
  Number(result.meta?.changes ?? 0);

const businessOutcomeFor = (row: ConversionOutboxRow): "SUCCESS" | "FAILED" | "RECONCILIATION_REQUIRED" | null => {
  if (row.status === "success" || row.status === "deduplicated" || row.status === "sent") return "SUCCESS";
  if (row.status !== "failed") return null;
  const ambiguous = new Set([
    "PARTIAL_SUCCESS_HUMAN_REVIEW",
    "DIAGNOSTIC_TIMEBOX_EXCEEDED",
    "DIAGNOSTIC_STATUS_UNKNOWN",
    "DIAGNOSTIC_NETWORK_ERROR",
    "DIAGNOSTIC_HTTP_ERROR",
    "AUTH_TOKEN_ACQUISITION_FAILED",
    "INGEST_NETWORK_ERROR",
  ]);
  return row.terminal_result && ambiguous.has(row.terminal_result) ? "RECONCILIATION_REQUIRED" : "FAILED";
};

export class D1OutboxRepository implements OutboxRepository {
  private readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  async recoverStaleClaims(
    staleBeforeIso: string,
    nowIso: string,
    limit: number
  ): Promise<number> {
    const boundedLimit = Math.max(1, Math.min(Math.floor(limit), 100));
    const result = await this.database
      .prepare(
        `UPDATE conversion_outbox
            SET status = CASE
                  WHEN google_request_id IS NULL
                    AND business_conversion_id IS NOT NULL
                    AND EXISTS (
                      SELECT 1 FROM provider_attempts pa
                      WHERE pa.business_conversion_id = conversion_outbox.business_conversion_id
                        AND pa.fence_token = conversion_outbox.lease_generation
                    ) THEN 'failed'
                  WHEN google_request_id IS NULL AND retry_count >= ?4 THEN 'failed'
                  WHEN google_request_id IS NULL THEN 'pending'
                  ELSE 'submitted'
                END,
                next_retry_at = CASE
                  WHEN google_request_id IS NULL
                    AND business_conversion_id IS NOT NULL
                    AND EXISTS (
                      SELECT 1 FROM provider_attempts pa
                      WHERE pa.business_conversion_id = conversion_outbox.business_conversion_id
                        AND pa.fence_token = conversion_outbox.lease_generation
                    ) THEN NULL
                  WHEN google_request_id IS NULL AND retry_count >= ?4 THEN NULL
                  ELSE next_retry_at
                END,
                last_error_code = CASE
                  WHEN google_request_id IS NULL
                    AND business_conversion_id IS NOT NULL
                    AND EXISTS (
                      SELECT 1 FROM provider_attempts pa
                      WHERE pa.business_conversion_id = conversion_outbox.business_conversion_id
                        AND pa.fence_token = conversion_outbox.lease_generation
                    ) THEN 'RECONCILIATION_REQUIRED'
                  WHEN google_request_id IS NULL AND retry_count >= ?4 THEN 'STALE_UPLOAD_RETRY_BUDGET_EXHAUSTED'
                  ELSE 'STALE_PROCESSING_RECOVERED'
                END,
                last_error_reason = CASE
                  WHEN google_request_id IS NULL
                    AND business_conversion_id IS NOT NULL
                    AND EXISTS (
                      SELECT 1 FROM provider_attempts pa
                      WHERE pa.business_conversion_id = conversion_outbox.business_conversion_id
                        AND pa.fence_token = conversion_outbox.lease_generation
                    ) THEN 'PROVIDER_ATTEMPT_RESULT_UNKNOWN'
                  WHEN google_request_id IS NULL AND retry_count >= ?4 THEN 'STALE_UPLOAD_RETRY_BUDGET_EXHAUSTED'
                  WHEN google_request_id IS NULL THEN 'STALE_UPLOAD_CLAIM_RECOVERED'
                  ELSE 'STALE_DIAGNOSTIC_CLAIM_RECOVERED'
                END,
                terminal_result = CASE
                  WHEN google_request_id IS NULL
                    AND business_conversion_id IS NOT NULL
                    AND EXISTS (
                      SELECT 1 FROM provider_attempts pa
                      WHERE pa.business_conversion_id = conversion_outbox.business_conversion_id
                        AND pa.fence_token = conversion_outbox.lease_generation
                    ) THEN 'RECONCILIATION_REQUIRED'
                  WHEN google_request_id IS NULL AND retry_count >= ?4 THEN 'STALE_UPLOAD_RETRY_BUDGET_EXHAUSTED'
                  ELSE terminal_result
                END,
                lease_owner = NULL,
                lease_expires_at = NULL,
                updated_at = ?2
          WHERE conversion_id IN (
            SELECT conversion_id FROM conversion_outbox
             WHERE status = 'processing'
               AND ((lease_expires_at IS NOT NULL AND lease_expires_at <= ?2)
                 OR (lease_expires_at IS NULL AND updated_at <= ?1))
             ORDER BY COALESCE(lease_expires_at, updated_at), conversion_id
             LIMIT ?3
          )`
      )
      .bind(staleBeforeIso, nowIso, boundedLimit, MAX_UPLOAD_ATTEMPTS)
      .run();
    const reconcileBusinessSql =
      "UPDATE business_conversions SET outcome_state = 'RECONCILIATION_REQUIRED', " +
      "updated_at = ?1, version = version + 1 WHERE business_conversion_id IN (" +
      "SELECT business_conversion_id FROM conversion_outbox WHERE business_conversion_id IS NOT NULL " +
      "AND terminal_result = 'RECONCILIATION_REQUIRED' ORDER BY updated_at, conversion_id LIMIT ?2) " +
      "AND outcome_state = 'PENDING'";
    await this.database.prepare(reconcileBusinessSql).bind(nowIso, boundedLimit).run();
    const reconcileLeaseSql =
      "UPDATE provider_delivery_leases SET lease_state = 'RECONCILIATION_REQUIRED', " +
      "lease_owner = NULL, lease_expires_at = NULL, last_reconciled_at = ?1, updated_at = ?1 " +
      "WHERE business_conversion_id IN (SELECT business_conversion_id FROM conversion_outbox " +
      "WHERE business_conversion_id IS NOT NULL AND terminal_result = 'RECONCILIATION_REQUIRED' " +
      "ORDER BY updated_at, conversion_id LIMIT ?2)";
    await this.database.prepare(reconcileLeaseSql).bind(nowIso, boundedLimit).run();
    return changesFrom(result);
  }

  async listDueUploads(
    nowIso: string,
    limit: number
  ): Promise<ConversionOutboxRow[]> {
    const result = await this.database
      .prepare(
        `SELECT ${OUTBOX_COLUMNS} FROM conversion_outbox
         WHERE status = 'pending'
           AND (next_retry_at IS NULL OR next_retry_at <= ?1)
           AND retry_count < ?2
           AND business_conversion_id IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM business_conversions bc
             WHERE bc.business_conversion_id = conversion_outbox.business_conversion_id
               AND bc.eligibility_state = 'ELIGIBLE'
               AND bc.outcome_state = 'PENDING'
           )
         ORDER BY COALESCE(next_retry_at, created_at), created_at, conversion_id
         LIMIT ?3`
      )
      .bind(nowIso, MAX_UPLOAD_ATTEMPTS, limit)
      .all<ConversionOutboxRow>();
    return result.results ?? [];
  }

  async claimUpload(
    conversionId: string,
    nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    const leaseOwner = crypto.randomUUID();
    const leaseExpiresAt = new Date(Date.parse(nowIso) + STALE_PROCESSING_THRESHOLD_MS).toISOString();
    const result = await this.database
      .prepare(
        `UPDATE conversion_outbox
            SET status = 'processing',
                retry_count = retry_count + 1,
                lease_generation = lease_generation + 1,
                lease_owner = ?4,
                lease_expires_at = ?5,
                updated_at = ?1
          WHERE conversion_id = ?2
            AND status = 'pending'
            AND (next_retry_at IS NULL OR next_retry_at <= ?1)
            AND retry_count < ?3`
      )
      .bind(nowIso, conversionId, MAX_UPLOAD_ATTEMPTS, leaseOwner, leaseExpiresAt)
      .run();
    if (changesFrom(result) !== 1) return null;
    return this.database
      .prepare(`SELECT ${OUTBOX_COLUMNS} FROM conversion_outbox WHERE conversion_id = ?1`)
      .bind(conversionId)
      .first<ConversionOutboxRow>();
  }

  async beginProviderAttempt(
    row: ConversionOutboxRow,
    nowIso: string
  ): Promise<string> {
    if (!row.business_conversion_id || !row.lease_owner || row.lease_generation === undefined || !row.lease_expires_at) {
      throw new Error("PROVIDER_ATTEMPT_CONTEXT_MISSING");
    }
    const attemptId = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const attemptSql =
      "INSERT INTO provider_attempts (attempt_id, business_conversion_id, attempt_sequence, transaction_id, " +
      "provider_name, operation, attempt_intent, fence_token, lease_expires_at, started_at, created_at) " +
      "SELECT ?1, ?2, COALESCE(MAX(attempt_sequence), 0) + 1, ?3, 'GOOGLE_DATA_MANAGER', " +
      "'events:ingest', 'DELIVER_CONVERSION', ?4, ?5, ?6, ?6 FROM provider_attempts " +
      "WHERE business_conversion_id = ?2";
    const eventSql =
      "INSERT INTO provider_attempt_events (attempt_event_id, attempt_id, event_sequence, event_type, " +
      "recorded_at, normalized_status, retryable, ambiguous) " +
      "VALUES (?1, ?2, 1, 'ATTEMPT_STARTED', ?3, 'STARTED', 0, 0)";
    const leaseSql =
      "INSERT INTO provider_delivery_leases (business_conversion_id, lease_state, lease_owner, active_attempt_id, " +
      "fence_token, lease_expires_at, last_reconciled_at, updated_at) " +
      "VALUES (?1, 'CLAIMED', ?2, ?3, ?4, ?5, NULL, ?6) " +
      "ON CONFLICT(business_conversion_id) DO UPDATE SET lease_state = 'CLAIMED', " +
      "lease_owner = excluded.lease_owner, active_attempt_id = excluded.active_attempt_id, " +
      "fence_token = excluded.fence_token, lease_expires_at = excluded.lease_expires_at, updated_at = excluded.updated_at " +
      "WHERE provider_delivery_leases.fence_token < excluded.fence_token OR " +
      "(provider_delivery_leases.fence_token = excluded.fence_token AND provider_delivery_leases.lease_owner = excluded.lease_owner)";
    const results = await this.database.batch([
      this.database.prepare(attemptSql).bind(attemptId, row.business_conversion_id, row.transaction_id, row.lease_generation, row.lease_expires_at, nowIso),
      this.database.prepare(eventSql).bind(eventId, attemptId, nowIso),
      this.database.prepare(leaseSql).bind(row.business_conversion_id, row.lease_owner, attemptId, row.lease_generation, row.lease_expires_at, nowIso),
    ]);
    if (changesFrom(results[0]) !== 1 || changesFrom(results[2]) !== 1) {
      throw new Error("PROVIDER_ATTEMPT_FENCE_FAILED");
    }
    return attemptId;
  }

  async recordProviderAcknowledged(
    row: ConversionOutboxRow,
    attemptId: string,
    requestId: string,
    nowIso: string
  ): Promise<void> {
    if (!row.business_conversion_id || row.lease_generation === undefined) {
      throw new Error("PROVIDER_ATTEMPT_CONTEXT_MISSING");
    }
    const sql =
      "INSERT OR IGNORE INTO provider_attempt_events (attempt_event_id, attempt_id, event_sequence, event_type, " +
      "recorded_at, provider_request_id, normalized_status, retryable, ambiguous) " +
      "VALUES (?1, ?2, 2, 'ACKNOWLEDGED', ?3, ?4, 'ACKNOWLEDGED', 0, 0)";
    await this.database.prepare(sql).bind(crypto.randomUUID(), attemptId, nowIso, requestId).run();
  }

  async recordProviderUnknown(
    row: ConversionOutboxRow,
    attemptId: string,
    reason: string,
    nowIso: string
  ): Promise<void> {
    if (!row.business_conversion_id || row.lease_generation === undefined) {
      throw new Error("PROVIDER_ATTEMPT_CONTEXT_MISSING");
    }
    const eventSql =
      "INSERT OR IGNORE INTO provider_attempt_events (attempt_event_id, attempt_id, event_sequence, event_type, " +
      "recorded_at, normalized_status, retryable, ambiguous, sanitized_reason) " +
      "VALUES (?1, ?2, 2, 'SENT_UNKNOWN', ?3, 'UNKNOWN', 0, 1, ?4)";
    const leaseSql =
      "UPDATE provider_delivery_leases SET lease_state = 'RECONCILIATION_REQUIRED', lease_owner = NULL, " +
      "lease_expires_at = NULL, last_reconciled_at = ?1, updated_at = ?1 WHERE business_conversion_id = ?2 " +
      "AND active_attempt_id = ?3 AND fence_token = ?4";
    const businessSql =
      "UPDATE business_conversions SET outcome_state = 'RECONCILIATION_REQUIRED', updated_at = ?1, version = version + 1 " +
      "WHERE business_conversion_id = ?2 AND outcome_state IN ('PENDING', 'RECONCILIATION_REQUIRED')";
    await this.database.batch([
      this.database.prepare(eventSql).bind(crypto.randomUUID(), attemptId, nowIso, reason),
      this.database.prepare(leaseSql).bind(nowIso, row.business_conversion_id, attemptId, row.lease_generation),
      this.database.prepare(businessSql).bind(nowIso, row.business_conversion_id),
    ]);
  }

  async listDueDiagnostics(
    nowIso: string,
    limit: number
  ): Promise<ConversionOutboxRow[]> {
    const result = await this.database
      .prepare(
        `SELECT ${OUTBOX_COLUMNS} FROM conversion_outbox
         WHERE status = 'submitted'
           AND google_request_id IS NOT NULL
           AND next_diagnostic_at IS NOT NULL
           AND next_diagnostic_at <= ?1
         ORDER BY next_diagnostic_at, submitted_at, conversion_id
         LIMIT ?2`
      )
      .bind(nowIso, limit)
      .all<ConversionOutboxRow>();
    return result.results ?? [];
  }

  async claimDiagnostic(
    conversionId: string,
    nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    const leaseOwner = crypto.randomUUID();
    const leaseExpiresAt = new Date(Date.parse(nowIso) + STALE_PROCESSING_THRESHOLD_MS).toISOString();
    const result = await this.database
      .prepare(
        `UPDATE conversion_outbox
            SET status = 'processing',
                diagnostic_attempt_count = diagnostic_attempt_count + 1,
                lease_generation = lease_generation + 1,
                lease_owner = ?3,
                lease_expires_at = ?4,
                updated_at = ?1
          WHERE conversion_id = ?2
            AND status = 'submitted'
            AND google_request_id IS NOT NULL
            AND next_diagnostic_at IS NOT NULL
            AND next_diagnostic_at <= ?1`
      )
      .bind(nowIso, conversionId, leaseOwner, leaseExpiresAt)
      .run();
    if (changesFrom(result) !== 1) return null;
    return this.database
      .prepare(`SELECT ${OUTBOX_COLUMNS} FROM conversion_outbox WHERE conversion_id = ?1`)
      .bind(conversionId)
      .first<ConversionOutboxRow>();
  }

  async cleanupTerminalRows(cutoffIso: string, limit: number): Promise<number> {
    const boundedLimit = Math.max(1, Math.min(Math.floor(limit), 100));
    const result = await this.database
      .prepare(
        `DELETE FROM conversion_outbox
         WHERE conversion_id IN (
           SELECT conversion_id FROM conversion_outbox
           WHERE status IN ('success', 'failed', 'deduplicated', 'validated_only', 'sent')
             AND updated_at <= ?1
           ORDER BY updated_at, conversion_id
           LIMIT ?2
         )`
      )
      .bind(cutoffIso, boundedLimit)
      .run();
    return changesFrom(result);
  }

  async save(row: ConversionOutboxRow): Promise<void> {
    if (!row.lease_owner || row.lease_generation === undefined) {
      throw new Error("OUTBOX_LEASE_CONTEXT_MISSING");
    }
    const result = await this.database
      .prepare(
        `UPDATE conversion_outbox SET
          status = ?1,
          retry_count = ?2,
          next_retry_at = ?3,
          last_error_code = ?4,
          submitted_at = ?5,
          google_request_id = ?6,
          next_diagnostic_at = ?7,
          terminal_result = ?8,
          last_error_reason = ?9,
          diagnostic_status = ?10,
          diagnostic_record_count = ?11,
          diagnostic_error_reason = ?12,
          diagnostic_attempt_count = ?13,
          sent_at = ?14,
          updated_at = ?15,
          lease_owner = NULL,
          lease_expires_at = NULL
        WHERE conversion_id = ?16
          AND status = 'processing'
          AND lease_generation = ?17
          AND lease_owner = ?18
          AND lease_expires_at > ?15`
      )
      .bind(
        row.status,
        row.retry_count,
        row.next_retry_at,
        row.last_error_code,
        row.submitted_at,
        row.google_request_id,
        row.next_diagnostic_at,
        row.terminal_result,
        row.last_error_reason,
        row.diagnostic_status,
        row.diagnostic_record_count,
        row.diagnostic_error_reason,
        row.diagnostic_attempt_count,
        row.sent_at,
        row.updated_at,
        row.conversion_id,
        row.lease_generation,
        row.lease_owner
      )
      .run();
    if (changesFrom(result) !== 1) throw new Error("STALE_LEASE_FENCE");
    row.lease_owner = null;
    row.lease_expires_at = null;
    if (!row.business_conversion_id) return;
    const businessOutcome = businessOutcomeFor(row);
    if (!businessOutcome) return;
    await this.database
      .prepare(
        `UPDATE business_conversions
            SET outcome_state = ?1, updated_at = ?2, version = version + 1
          WHERE business_conversion_id = ?3
            AND outcome_state IN ('PENDING', 'RECONCILIATION_REQUIRED')`
      )
      .bind(businessOutcome, row.updated_at, row.business_conversion_id)
      .run();
  }
}
