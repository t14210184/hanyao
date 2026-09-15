import type { D1Database } from "@cloudflare/workers-types";
import {
  MAX_UPLOAD_ATTEMPTS,
  PROVIDER_DISPATCH_MIN_LEASE_REMAINING_MS,
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
  lease_generation, lease_owner, lease_expires_at, upload_payload_hash,
  completion_id`;

const changesFrom = (result: { meta?: { changes?: number } }): number =>
  Number(result.meta?.changes ?? 0);

const businessOutcomeFor = (row: ConversionOutboxRow): "SUCCESS" | "FAILED" | "RECONCILIATION_REQUIRED" | null => {
  if (row.status === "success" || row.status === "deduplicated" || row.status === "sent") return "SUCCESS";
  if (row.status !== "failed") return null;
  if (row.terminal_result === "RECONCILIATION_REQUIRED") {
    return "RECONCILIATION_REQUIRED";
  }
  const ambiguous = new Set([
    "PARTIAL_SUCCESS_HUMAN_REVIEW",
    "DIAGNOSTIC_TIMEBOX_EXCEEDED",
    "DIAGNOSTIC_STATUS_UNKNOWN",
    "DIAGNOSTIC_NETWORK_ERROR",
    "DIAGNOSTIC_HTTP_ERROR",
    "AUTH_TOKEN_ACQUISITION_FAILED",
    "INGEST_NETWORK_ERROR",
    "DUPLICATE_CONTEXT_UNPROVEN",
  ]);
  return row.terminal_result && ambiguous.has(row.terminal_result) ? "RECONCILIATION_REQUIRED" : "FAILED";
};

export class D1OutboxRepository implements OutboxRepository {
  private readonly database: D1Database;
  private readonly clock: () => Date;

  constructor(database: D1Database, clock: () => Date = () => new Date()) {
    this.database = database;
    this.clock = clock;
  }

  private freshNow(): Date {
    return this.clock();
  }

  private safeThroughIso(now: Date): string {
    return new Date(
      now.getTime() + PROVIDER_DISPATCH_MIN_LEASE_REMAINING_MS
    ).toISOString();
  }

  async recoverStaleClaims(
    staleBeforeIso: string,
    nowIso: string,
    limit: number
  ): Promise<number> {
    const boundedLimit = Math.max(1, Math.min(Math.floor(limit), 100));

    const restoreResult = await this.database
      .prepare(
        `WITH ack_candidates AS (
           SELECT co.conversion_id,
                  MIN(pae.provider_request_id) AS provider_request_id,
                  MAX(pae.recorded_at) AS acknowledged_at
             FROM conversion_outbox co
             JOIN provider_attempts pa
               ON pa.business_conversion_id = co.business_conversion_id
              AND pa.transaction_id = co.transaction_id
              AND pa.fence_token = co.lease_generation
              AND pa.destination_key = co.destination_key
              AND pa.payload_hash = co.upload_payload_hash
             JOIN provider_attempt_events pae
               ON pae.attempt_id = pa.attempt_id
              AND pae.event_type = 'ACKNOWLEDGED'
              AND pae.provider_request_id IS NOT NULL
            WHERE co.status = 'processing'
              AND co.google_request_id IS NULL
              AND co.business_conversion_id IS NOT NULL
              AND co.upload_payload_hash IS NOT NULL
              AND ((co.lease_expires_at IS NOT NULL AND co.lease_expires_at <= ?2)
                OR (co.lease_expires_at IS NULL AND co.updated_at <= ?1))
            GROUP BY co.conversion_id
           HAVING COUNT(DISTINCT pae.provider_request_id) = 1
            ORDER BY COALESCE(co.lease_expires_at, co.updated_at), co.conversion_id
            LIMIT ?3
         )
         UPDATE conversion_outbox
            SET status = 'submitted',
                google_request_id = (
                  SELECT provider_request_id FROM ack_candidates
                   WHERE ack_candidates.conversion_id = conversion_outbox.conversion_id
                ),
                submitted_at = COALESCE(submitted_at, (
                  SELECT acknowledged_at FROM ack_candidates
                   WHERE ack_candidates.conversion_id = conversion_outbox.conversion_id
                )),
                next_diagnostic_at = ?2,
                last_error_code = 'ACK_RESTORED_AFTER_STALE_CLAIM',
                last_error_reason = 'ACK_RESTORED_AFTER_STALE_CLAIM',
                terminal_result = NULL,
                lease_owner = NULL,
                lease_expires_at = NULL,
                updated_at = ?2
          WHERE conversion_id IN (SELECT conversion_id FROM ack_candidates)`
      )
      .bind(staleBeforeIso, nowIso, boundedLimit)
      .run();
    const restored = changesFrom(restoreResult);
    if (restored > 0) {
      await this.database
        .prepare(
          `UPDATE provider_delivery_leases
              SET lease_state = 'CLOSED', lease_owner = NULL, lease_expires_at = NULL,
                  last_reconciled_at = ?1, updated_at = ?1
            WHERE business_conversion_id IN (
              SELECT business_conversion_id FROM conversion_outbox
               WHERE status = 'submitted'
                 AND google_request_id IS NOT NULL
                 AND last_error_code = 'ACK_RESTORED_AFTER_STALE_CLAIM'
                 AND updated_at = ?1
            )`
        )
        .bind(nowIso)
        .run();
    }

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
    return restored + changesFrom(result);
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
    _nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    const claimNowIso = this.freshNow().toISOString();
    const leaseOwner = crypto.randomUUID();
    const leaseExpiresAt = new Date(
      Date.parse(claimNowIso) + STALE_PROCESSING_THRESHOLD_MS
    ).toISOString();
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
      .bind(claimNowIso, conversionId, MAX_UPLOAD_ATTEMPTS, leaseOwner, leaseExpiresAt)
      .run();
    if (changesFrom(result) !== 1) return null;
    return this.database
      .prepare(`SELECT ${OUTBOX_COLUMNS} FROM conversion_outbox WHERE conversion_id = ?1`)
      .bind(conversionId)
      .first<ConversionOutboxRow>();
  }

  async beginProviderAttempt(
    row: ConversionOutboxRow,
    payloadHash: string,
    _nowIso: string
  ): Promise<string> {
    if (
      !row.business_conversion_id ||
      !row.lease_owner ||
      row.lease_generation === undefined ||
      !row.lease_expires_at ||
      !payloadHash
    ) {
      throw new Error("PROVIDER_ATTEMPT_CONTEXT_MISSING");
    }
    const freshNow = this.freshNow();
    const dispatchNowIso = freshNow.toISOString();
    const safeThroughIso = this.safeThroughIso(freshNow);
    const attemptId = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const attemptSql =
      "INSERT INTO provider_attempts (attempt_id, business_conversion_id, attempt_sequence, transaction_id, " +
      "provider_name, operation, attempt_intent, fence_token, lease_expires_at, started_at, created_at, " +
      "destination_key, payload_hash) " +
      "SELECT ?1, ?2, COALESCE((SELECT MAX(attempt_sequence) FROM provider_attempts WHERE business_conversion_id = ?2), 0) + 1, " +
      "?3, 'GOOGLE_DATA_MANAGER', 'events:ingest', 'DELIVER_CONVERSION', ?4, ?5, ?6, ?6, ?7, ?8 " +
      "WHERE EXISTS (SELECT 1 FROM conversion_outbox co JOIN business_conversions bc " +
      "ON bc.business_conversion_id = co.business_conversion_id " +
      "WHERE co.conversion_id = ?9 AND co.business_conversion_id = ?2 AND co.status = 'processing' " +
      "AND co.lease_generation = ?4 AND co.lease_owner = ?10 AND co.lease_expires_at = ?5 " +
      "AND co.lease_expires_at > ?11 AND co.transaction_id = ?3 AND co.destination_key = ?7 " +
      "AND bc.eligibility_state = 'ELIGIBLE' AND bc.outcome_state = 'PENDING') " +
      "AND NOT EXISTS (SELECT 1 FROM provider_delivery_leases pdl WHERE pdl.business_conversion_id = ?2 " +
      "AND (pdl.fence_token > ?4 OR (pdl.fence_token = ?4 AND COALESCE(pdl.lease_owner, '') <> ?10)))";
    const eventSql =
      "INSERT INTO provider_attempt_events (attempt_event_id, attempt_id, event_sequence, event_type, " +
      "recorded_at, normalized_status, retryable, ambiguous) " +
      "SELECT ?1, ?2, 1, 'ATTEMPT_STARTED', ?3, 'STARTED', 0, 0 " +
      "WHERE EXISTS (SELECT 1 FROM provider_attempts WHERE attempt_id = ?2)";
    const leaseSql =
      "INSERT INTO provider_delivery_leases (business_conversion_id, lease_state, lease_owner, active_attempt_id, " +
      "fence_token, lease_expires_at, last_reconciled_at, updated_at) " +
      "SELECT ?1, 'CLAIMED', ?2, ?3, ?4, ?5, NULL, ?6 " +
      "WHERE EXISTS (SELECT 1 FROM provider_attempts WHERE attempt_id = ?3 AND business_conversion_id = ?1) " +
      "ON CONFLICT(business_conversion_id) DO UPDATE SET lease_state = 'CLAIMED', " +
      "lease_owner = excluded.lease_owner, active_attempt_id = excluded.active_attempt_id, " +
      "fence_token = excluded.fence_token, lease_expires_at = excluded.lease_expires_at, updated_at = excluded.updated_at " +
      "WHERE provider_delivery_leases.fence_token < excluded.fence_token OR " +
      "(provider_delivery_leases.fence_token = excluded.fence_token AND provider_delivery_leases.lease_owner = excluded.lease_owner)";
    const outboxSql =
      "UPDATE conversion_outbox SET upload_payload_hash = ?1 WHERE conversion_id = ?2 " +
      "AND status = 'processing' AND lease_generation = ?3 AND lease_owner = ?4 " +
      "AND lease_expires_at = ?5 AND lease_expires_at > ?6 AND business_conversion_id = ?7 " +
      "AND EXISTS (SELECT 1 FROM business_conversions bc WHERE bc.business_conversion_id = ?7 " +
      "AND bc.eligibility_state = 'ELIGIBLE' AND bc.outcome_state = 'PENDING') " +
      "AND EXISTS (SELECT 1 FROM provider_attempts pa WHERE pa.attempt_id = ?8 " +
      "AND pa.business_conversion_id = ?7 AND pa.fence_token = ?3 " +
      "AND pa.transaction_id = conversion_outbox.transaction_id " +
      "AND pa.destination_key = conversion_outbox.destination_key)";
    const results = await this.database.batch([
      this.database.prepare(attemptSql).bind(
        attemptId,
        row.business_conversion_id,
        row.transaction_id,
        row.lease_generation,
        row.lease_expires_at,
        dispatchNowIso,
        row.destination_key,
        payloadHash,
        row.conversion_id,
        row.lease_owner,
        safeThroughIso
      ),
      this.database.prepare(eventSql).bind(eventId, attemptId, dispatchNowIso),
      this.database.prepare(leaseSql).bind(
        row.business_conversion_id,
        row.lease_owner,
        attemptId,
        row.lease_generation,
        row.lease_expires_at,
        dispatchNowIso
      ),
      this.database.prepare(outboxSql).bind(
        payloadHash,
        row.conversion_id,
        row.lease_generation,
        row.lease_owner,
        row.lease_expires_at,
        safeThroughIso,
        row.business_conversion_id,
        attemptId
      ),
    ]);
    if (
      changesFrom(results[0]) !== 1 ||
      changesFrom(results[1]) !== 1 ||
      changesFrom(results[2]) !== 1 ||
      changesFrom(results[3]) !== 1
    ) {
      throw new Error("PROVIDER_ATTEMPT_FENCE_FAILED");
    }
    row.upload_payload_hash = payloadHash;
    row.updated_at = dispatchNowIso;
    return attemptId;
  }

  async recordProviderAcknowledged(
    row: ConversionOutboxRow,
    attemptId: string,
    requestId: string,
    _nowIso: string
  ): Promise<void> {
    if (
      !row.business_conversion_id ||
      row.lease_generation === undefined ||
      !row.upload_payload_hash
    ) {
      throw new Error("PROVIDER_ATTEMPT_CONTEXT_MISSING");
    }
    const recordedAt = this.freshNow().toISOString();
    const sql =
      "INSERT OR IGNORE INTO provider_attempt_events (attempt_event_id, attempt_id, event_sequence, event_type, " +
      "recorded_at, provider_request_id, normalized_status, retryable, ambiguous) " +
      "SELECT ?1, pa.attempt_id, 2, 'ACKNOWLEDGED', ?3, ?4, 'ACKNOWLEDGED', 0, 0 " +
      "FROM provider_attempts pa WHERE pa.attempt_id = ?2 " +
      "AND pa.business_conversion_id = ?5 AND pa.transaction_id = ?6 AND pa.fence_token = ?7 " +
      "AND pa.destination_key = ?8 AND pa.payload_hash = ?9";
    const result = await this.database
      .prepare(sql)
      .bind(
        crypto.randomUUID(),
        attemptId,
        recordedAt,
        requestId,
        row.business_conversion_id,
        row.transaction_id,
        row.lease_generation,
        row.destination_key,
        row.upload_payload_hash
      )
      .run();
    if (changesFrom(result) === 1) return;
    const existing = await this.database
      .prepare(
        "SELECT provider_request_id FROM provider_attempt_events " +
        "WHERE attempt_id = ?1 AND event_type = 'ACKNOWLEDGED'"
      )
      .bind(attemptId)
      .first<{ provider_request_id: string | null }>();
    if (existing?.provider_request_id === requestId) return;
    throw new Error("PROVIDER_ACK_CONTEXT_MISMATCH");
  }

  async verifyProviderRequestContext(
    row: ConversionOutboxRow
  ): Promise<boolean> {
    if (
      !row.business_conversion_id ||
      !row.google_request_id ||
      !row.upload_payload_hash ||
      !row.transaction_id ||
      !row.destination_key
    ) {
      return false;
    }
    const result = await this.database
      .prepare(
        `SELECT COUNT(*) AS context_count,
                COUNT(DISTINCT pae.provider_request_id) AS request_count
           FROM provider_attempts pa
           JOIN provider_attempt_events pae ON pae.attempt_id = pa.attempt_id
          WHERE pa.business_conversion_id = ?1
            AND pa.transaction_id = ?2
            AND pa.destination_key = ?3
            AND pa.payload_hash = ?4
            AND pa.provider_name = 'GOOGLE_DATA_MANAGER'
            AND pa.operation = 'events:ingest'
            AND pa.attempt_intent = 'DELIVER_CONVERSION'
            AND pae.event_type = 'ACKNOWLEDGED'
            AND pae.provider_request_id = ?5`
      )
      .bind(
        row.business_conversion_id,
        row.transaction_id,
        row.destination_key,
        row.upload_payload_hash,
        row.google_request_id
      )
      .first<{ context_count: number | string; request_count: number | string }>();
    return (
      Number(result?.context_count ?? 0) === 1 &&
      Number(result?.request_count ?? 0) === 1
    );
  }

  async recordProviderUnknown(
    row: ConversionOutboxRow,
    attemptId: string,
    reason: string,
    _nowIso: string
  ): Promise<void> {
    if (!row.business_conversion_id || row.lease_generation === undefined) {
      throw new Error("PROVIDER_ATTEMPT_CONTEXT_MISSING");
    }
    const recordedAt = this.freshNow().toISOString();
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
      this.database.prepare(eventSql).bind(crypto.randomUUID(), attemptId, recordedAt, reason),
      this.database.prepare(leaseSql).bind(recordedAt, row.business_conversion_id, attemptId, row.lease_generation),
      this.database.prepare(businessSql).bind(recordedAt, row.business_conversion_id),
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
    _nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    const claimNowIso = this.freshNow().toISOString();
    const leaseOwner = crypto.randomUUID();
    const leaseExpiresAt = new Date(
      Date.parse(claimNowIso) + STALE_PROCESSING_THRESHOLD_MS
    ).toISOString();
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
      .bind(claimNowIso, conversionId, leaseOwner, leaseExpiresAt)
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
    row.updated_at = this.freshNow().toISOString();

    const businessOutcome = row.business_conversion_id
      ? businessOutcomeFor(row)
      : null;
    const terminalCompletion = Boolean(row.business_conversion_id && businessOutcome);
    const completionId = terminalCompletion ? crypto.randomUUID() : null;
    const outboxSql = `UPDATE conversion_outbox SET
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
      lease_expires_at = NULL,
      completion_id = ?19
    WHERE conversion_id = ?16
      AND status = 'processing'
      AND lease_generation = ?17
      AND lease_owner = ?18
      AND lease_expires_at > ?15`;
    const outboxStatement = this.database.prepare(outboxSql).bind(
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
      row.lease_owner,
      completionId
    );

    if (!terminalCompletion || !row.business_conversion_id || !businessOutcome || !completionId) {
      const result = await outboxStatement.run();
      if (changesFrom(result) !== 1) throw new Error("STALE_LEASE_FENCE");
      row.lease_owner = null;
      row.lease_expires_at = null;
      return;
    }

    const leaseState = businessOutcome === "RECONCILIATION_REQUIRED"
      ? "RECONCILIATION_REQUIRED"
      : "CLOSED";
    const terminalEventType = businessOutcome === "RECONCILIATION_REQUIRED"
      ? "RECONCILIATION_REQUIRED"
      : row.status === "deduplicated"
        ? "DUPLICATE_TRANSACTION_ID"
        : businessOutcome === "SUCCESS"
          ? "SUCCESS"
          : "FAILED";
    const normalizedStatus = row.terminal_result || businessOutcome;
    const ambiguous = businessOutcome === "RECONCILIATION_REQUIRED" ? 1 : 0;

    const guardSql = `SELECT CASE WHEN EXISTS (
      SELECT 1
        FROM conversion_outbox co
        JOIN business_conversions bc
          ON bc.business_conversion_id = co.business_conversion_id
       WHERE co.conversion_id = ?1
         AND co.business_conversion_id = ?2
         AND co.status = 'processing'
         AND co.lease_generation = ?3
         AND co.lease_owner = ?4
         AND co.lease_expires_at > ?5
         AND bc.outcome_state IN ('PENDING', 'RECONCILIATION_REQUIRED')
    ) THEN 1 ELSE abs(-9223372036854775808) END AS terminal_completion_guard`;
    const businessSql = `UPDATE business_conversions
      SET outcome_state = ?1,
          completion_id = ?2,
          updated_at = ?3,
          version = version + 1
      WHERE business_conversion_id = ?4
        AND outcome_state IN ('PENDING', 'RECONCILIATION_REQUIRED')
        AND EXISTS (
          SELECT 1 FROM conversion_outbox
           WHERE conversion_id = ?5 AND completion_id = ?2
        )`;
    const leaseSql = `UPDATE provider_delivery_leases
      SET lease_state = ?1,
          lease_owner = NULL,
          lease_expires_at = NULL,
          last_reconciled_at = ?2,
          updated_at = ?2,
          completion_id = ?3
      WHERE business_conversion_id = ?4
        AND EXISTS (
          SELECT 1 FROM conversion_outbox
           WHERE conversion_id = ?5 AND completion_id = ?3
        )`;
    const eventSql = `INSERT OR IGNORE INTO provider_attempt_events (
      attempt_event_id, attempt_id, event_sequence, event_type, recorded_at,
      provider_request_id, normalized_status, retryable, ambiguous,
      sanitized_reason, record_count, completion_id
    )
    SELECT ?1, pdl.active_attempt_id, COALESCE(MAX(pae.event_sequence), 0) + 1,
           ?2, ?3, ?4, ?5, 0, ?6, ?7, ?8, ?9
      FROM provider_delivery_leases pdl
      LEFT JOIN provider_attempt_events pae ON pae.attempt_id = pdl.active_attempt_id
     WHERE pdl.business_conversion_id = ?10
       AND pdl.active_attempt_id IS NOT NULL
       AND pdl.completion_id = ?9
       AND EXISTS (
         SELECT 1 FROM conversion_outbox
          WHERE conversion_id = ?11 AND completion_id = ?9
       )
     GROUP BY pdl.active_attempt_id`;
    const verifySql = `SELECT CASE WHEN
      EXISTS (
        SELECT 1 FROM conversion_outbox
         WHERE conversion_id = ?1 AND business_conversion_id = ?2
           AND completion_id = ?3 AND status = ?4
      )
      AND EXISTS (
        SELECT 1 FROM business_conversions
         WHERE business_conversion_id = ?2
           AND completion_id = ?3 AND outcome_state = ?5
      )
      AND NOT EXISTS (
        SELECT 1 FROM provider_delivery_leases
         WHERE business_conversion_id = ?2
           AND (completion_id IS NULL OR completion_id <> ?3 OR lease_state <> ?6)
      )
      AND NOT EXISTS (
        SELECT 1 FROM provider_delivery_leases pdl
         WHERE pdl.business_conversion_id = ?2
           AND pdl.active_attempt_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM provider_attempt_events pae
              WHERE pae.attempt_id = pdl.active_attempt_id
                AND pae.completion_id = ?3
           )
      )
      THEN 1 ELSE abs(-9223372036854775808)
    END AS terminal_completion_verified`;

    const results = await this.database.batch([
      this.database.prepare(guardSql).bind(
        row.conversion_id,
        row.business_conversion_id,
        row.lease_generation,
        row.lease_owner,
        row.updated_at
      ),
      outboxStatement,
      this.database.prepare(businessSql).bind(
        businessOutcome,
        completionId,
        row.updated_at,
        row.business_conversion_id,
        row.conversion_id
      ),
      this.database.prepare(leaseSql).bind(
        leaseState,
        row.updated_at,
        completionId,
        row.business_conversion_id,
        row.conversion_id
      ),
      this.database.prepare(eventSql).bind(
        crypto.randomUUID(),
        terminalEventType,
        row.updated_at,
        row.google_request_id,
        normalizedStatus,
        ambiguous,
        row.last_error_reason,
        row.diagnostic_record_count,
        completionId,
        row.business_conversion_id,
        row.conversion_id
      ),
      this.database.prepare(verifySql).bind(
        row.conversion_id,
        row.business_conversion_id,
        completionId,
        row.status,
        businessOutcome,
        leaseState
      ),
    ]);
    if (changesFrom(results[1]) !== 1 || changesFrom(results[2]) !== 1) {
      throw new Error("TERMINAL_COMPLETION_INVARIANT_FAILED");
    }
    row.lease_owner = null;
    row.lease_expires_at = null;
    row.completion_id = completionId;
  }
}
