import assert from "node:assert/strict";
import test from "node:test";
import { evaluateReportingEvidence, type ReportingSnapshot } from "./line4d-reporting-evidence.ts";

const snapshot = (overrides: Partial<ReportingSnapshot> = {}): ReportingSnapshot => ({
  customerId: "4801404246",
  conversionActionId: "7674301565",
  allConversions: 5,
  lastConversionDate: "2026-09-12",
  lastReceivedRequestDateTime: "2026-09-12 12:00:00+00:00",
  ...overrides,
});

test("historical conversions without a baseline never prove the new E2E", () => {
  assert.deepEqual(evaluateReportingEvidence(snapshot(), null), {
    verificationState: "BASELINE_REQUIRED",
    reportingVisible: false,
    conversionDelta: null,
    lastReceivedAdvanced: false,
  });
});

test("unchanged historical reporting stays fail closed", () => {
  const baseline = snapshot();
  const current = snapshot();
  const result = evaluateReportingEvidence(current, baseline);
  assert.equal(result.verificationState, "NO_DELTA");
  assert.equal(result.reportingVisible, false);
});
test("count delta without a newer provider request timestamp is not enough", () => {
  const baseline = snapshot();
  const current = snapshot({ allConversions: 6 });
  const result = evaluateReportingEvidence(current, baseline);
  assert.equal(result.verificationState, "DELTA_WITHOUT_REQUEST_TIME_ADVANCE");
  assert.equal(result.reportingVisible, false);
});

test("count delta plus newer provider request timestamp confirms visibility", () => {
  const baseline = snapshot();
  const current = snapshot({
    allConversions: 6,
    lastReceivedRequestDateTime: "2026-09-12 12:05:00+00:00",
  });
  const result = evaluateReportingEvidence(current, baseline);
  assert.equal(result.verificationState, "DELTA_CONFIRMED");
  assert.equal(result.reportingVisible, true);
  assert.equal(result.conversionDelta, 1);
  assert.equal(result.lastReceivedAdvanced, true);
});

test("baseline from another action is rejected", () => {
  assert.throws(
    () => evaluateReportingEvidence(snapshot(), snapshot({ conversionActionId: "999" })),
    /REPORTING_BASELINE_TARGET_MISMATCH/
  );
});
