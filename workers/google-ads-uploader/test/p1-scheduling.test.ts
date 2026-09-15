import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MIN_DIAGNOSTIC_SLOTS,
  withP1Scheduling,
} from "../src/scheduler-p1.ts";
import type {
  ConversionOutboxRow,
  OutboxRepository,
} from "../src/types.ts";

const NOW = "2026-09-15T00:00:00.000Z";
const row = (conversionId: string): ConversionOutboxRow =>
  ({ conversion_id: conversionId } as ConversionOutboxRow);

class ProbeRepository implements OutboxRepository {
  readonly uploadLimits: number[] = [];
  readonly diagnosticLimits: number[] = [];
  readonly uploadClaims: string[] = [];
  readonly diagnosticClaims: string[] = [];
  readonly uploads: ConversionOutboxRow[];
  readonly diagnostics: ConversionOutboxRow[];
  poisonUpload: string | null = null;
  poisonDiagnostic: string | null = null;
  failSave = false;

  constructor(uploadCount: number, diagnosticCount: number) {
    this.uploads = Array.from({ length: uploadCount }, (_, index) =>
      row(`upload-${index + 1}`));
    this.diagnostics = Array.from({ length: diagnosticCount }, (_, index) =>
      row(`diagnostic-${index + 1}`));
  }

  async listDueUploads(
    _nowIso: string,
    limit: number
  ): Promise<ConversionOutboxRow[]> {
    this.uploadLimits.push(limit);
    return this.uploads.slice(0, limit);
  }

  async listDueDiagnostics(
    _nowIso: string,
    limit: number
  ): Promise<ConversionOutboxRow[]> {
    this.diagnosticLimits.push(limit);
    return this.diagnostics.slice(0, limit);
  }

  async claimUpload(
    conversionId: string,
    _nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    this.uploadClaims.push(conversionId);
    if (conversionId === this.poisonUpload) {
      throw new Error("SIMULATED_UPLOAD_CLAIM_FAILURE");
    }
    return row(conversionId);
  }

  async claimDiagnostic(
    conversionId: string,
    _nowIso: string
  ): Promise<ConversionOutboxRow | null> {
    this.diagnosticClaims.push(conversionId);
    if (conversionId === this.poisonDiagnostic) {
      throw new Error("unsafe raw diagnostic claim failure text");
    }
    return row(conversionId);
  }

  async cleanupTerminalRows(): Promise<number> {
    return 0;
  }

  async save(): Promise<void> {
    if (this.failSave) throw new Error("RECEIPT_PERSIST_FAILED");
  }
}

test("P1 M01 reserves up to two diagnostic slots", async () => {
  const inner = new ProbeRepository(5, 3);
  const wrapped = withP1Scheduling(inner);
  const uploads = await wrapped.listDueUploads(NOW, 5);

  assert.equal(MIN_DIAGNOSTIC_SLOTS, 2);
  assert.deepEqual(inner.diagnosticLimits, [2]);
  assert.deepEqual(inner.uploadLimits, [3]);
  assert.equal(uploads.length, 3);
});

test("P1 M01 lends all slots to uploads when diagnostics are empty", async () => {
  const inner = new ProbeRepository(6, 0);
  const wrapped = withP1Scheduling(inner);
  const uploads = await wrapped.listDueUploads(NOW, 5);

  assert.deepEqual(inner.diagnosticLimits, [2]);
  assert.deepEqual(inner.uploadLimits, [5]);
  assert.equal(uploads.length, 5);
});

test("P1 M01 isolates an upload claim poison row", async () => {
  const inner = new ProbeRepository(2, 0);
  inner.poisonUpload = "upload-1";
  const warnings: Array<Record<string, string | number | null>> = [];
  const wrapped = withP1Scheduling(inner, {
    warn: (_message, details) => warnings.push(details ?? {}),
  });

  assert.equal(await wrapped.claimUpload("upload-1", NOW), null);
  assert.equal((await wrapped.claimUpload("upload-2", NOW))?.conversion_id, "upload-2");
  assert.deepEqual(inner.uploadClaims, ["upload-1", "upload-2"]);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.failure_code, "SIMULATED_UPLOAD_CLAIM_FAILURE");
});

test("P1 M01 isolates a diagnostic claim and sanitizes unsafe error text", async () => {
  const inner = new ProbeRepository(0, 2);
  inner.poisonDiagnostic = "diagnostic-1";
  const warnings: Array<Record<string, string | number | null>> = [];
  const wrapped = withP1Scheduling(inner, {
    warn: (_message, details) => warnings.push(details ?? {}),
  });

  assert.equal(await wrapped.claimDiagnostic("diagnostic-1", NOW), null);
  assert.equal(
    (await wrapped.claimDiagnostic("diagnostic-2", NOW))?.conversion_id,
    "diagnostic-2"
  );
  assert.deepEqual(inner.diagnosticClaims, ["diagnostic-1", "diagnostic-2"]);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.failure_code, "UNEXPECTED_ROW_FAILURE");
});

test("P1 wrapper does not swallow non-claim persistence failures", async () => {
  const inner = new ProbeRepository(0, 0);
  inner.failSave = true;
  const wrapped = withP1Scheduling(inner);

  await assert.rejects(
    wrapped.save(row("receipt-row")),
    /RECEIPT_PERSIST_FAILED/
  );
});
