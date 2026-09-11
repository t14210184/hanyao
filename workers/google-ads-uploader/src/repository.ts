import type { D1Database } from "@cloudflare/workers-types";
import type {
  ConversionOutboxRow,
  OutboxRepository,
} from "./types.ts";

const OUTBOX_COLUMNS = `
  conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid,
  wbraid, attribution_touch, transaction_id, destination_key, status,
  retry_count, next_retry_at, last_error_code, created_at, sent_at,
  submitted_at, google_request_id, next_diagnostic_at, terminal_result,
  last_error_reason, diagnostic_status, diagnostic_record_count,
  diagnostic_error_reason, diagnostic_attempt_count, updated_at`;

const changesFrom = (result: { meta?: { changes?: number } }): number =>
  Number(result.meta?.changes ?? 0);

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
                  WHEN google_request_id IS NULL THEN 'pending'
                  ELSE 'submitted'
                END,
                last_error_code = 'STALE_PROCESSING_RECOVERED',
                last_error_reason = CASE
                  WHEN google_request_id IS NULL THEN 'STALE_UPLOAD_CLAIM_RECOVERED'
                  ELSE 'STALE_DIAGNOSTIC_CLAIM_RECOVERED'
                END,
                updated_at = ?2
          WHERE conversion_id IN (
            SELECT conversion_id FROM conversion_outbox
             WHERE status = 'processing'
               AND updated_at <= ?1
             ORDER BY updated_at, conversion_id
             LIMIT ?3
          )`
      )
      .bind(staleBeforeIso, nowIso, boundedLimit)
      .run();
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
         ORDER BY COALESCE(next_retry_at, created_at), created_at, conversion_id
         LIMIT ?3`
      )
      .bind(nowIso, 8, limit)
      .all<ConversionOutboxRow>();
    return result.results ?? [];
  }

  async claimUpload(
    conversionId: string,
    nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    const result = await this.database
      .prepare(
        `UPDATE conversion_outbox
            SET status = 'processing',
                retry_count = retry_count + 1,
                updated_at = ?1
          WHERE conversion_id = ?2
            AND status = 'pending'
            AND (next_retry_at IS NULL OR next_retry_at <= ?1)
            AND retry_count < ?3`
      )
      .bind(nowIso, conversionId, 8)
      .run();
    if (changesFrom(result) !== 1) return null;
    return this.database
      .prepare(`SELECT ${OUTBOX_COLUMNS} FROM conversion_outbox WHERE conversion_id = ?1`)
      .bind(conversionId)
      .first<ConversionOutboxRow>();
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
    const result = await this.database
      .prepare(
        `UPDATE conversion_outbox
            SET status = 'processing',
                diagnostic_attempt_count = diagnostic_attempt_count + 1,
                updated_at = ?1
          WHERE conversion_id = ?2
            AND status = 'submitted'
            AND google_request_id IS NOT NULL
            AND next_diagnostic_at IS NOT NULL
            AND next_diagnostic_at <= ?1`
      )
      .bind(nowIso, conversionId)
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
    await this.database
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
          updated_at = ?15
        WHERE conversion_id = ?16`
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
        row.conversion_id
      )
      .run();
  }
}
