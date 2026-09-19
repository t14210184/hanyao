import assert from "node:assert/strict";
import test from "node:test";
import { classifyConversionClosure } from "./conversion-closure-classifier.mjs";

const base = {
  lineMatchedAdsCount: 1,
  businessConversionCount: 1,
  eligibleBusinessCount: 1,
  outboxCount: 1,
  providerAttemptCount: 1,
  requestIdCount: 1,
  diagnosticSuccessCount: 1,
  diagnosticFailedCount: 0,
  reconciliationCount: 0,
  adsDateRowReturned: true,
  adsDateConversions: 1,
};

const cases = [
  ["NO_ELIGIBLE_EVENT", { lineMatchedAdsCount: 0 }],
  ["ELIGIBLE_NOT_QUEUED", { outboxCount: 0 }],
  [
    "QUEUED_NOT_DISPATCHED",
    { providerAttemptCount: 0, requestIdCount: 0, diagnosticSuccessCount: 0 },
  ],
  [
    "DISPATCHED_DIAGNOSTIC_PENDING",
    { diagnosticSuccessCount: 0, adsDateRowReturned: false, adsDateConversions: 0 },
  ],
  ["DIAGNOSTIC_FAILED", { diagnosticSuccessCount: 0, diagnosticFailedCount: 1 }],
  [
    "DIAGNOSTIC_SUCCESS_REPORTING_PENDING",
    { adsDateRowReturned: false, adsDateConversions: 0 },
  ],
  ["REPORTING_DELTA_CONFIRMED", {}],
  ["RECONCILIATION_REQUIRED", { reconciliationCount: 1 }],
];

for (const [expected, patch] of cases) {
  test(expected, () => {
    assert.equal(
      classifyConversionClosure({ ...base, ...patch }).state,
      expected
    );
  });
}
