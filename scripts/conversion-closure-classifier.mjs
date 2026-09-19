const n = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const classifyConversionClosure = (input) => {
  const evidence = {
    lineMatchedAdsCount: n(input.lineMatchedAdsCount),
    businessConversionCount: n(input.businessConversionCount),
    eligibleBusinessCount: n(input.eligibleBusinessCount),
    outboxCount: n(input.outboxCount),
    providerAttemptCount: n(input.providerAttemptCount),
    requestIdCount: n(input.requestIdCount),
    diagnosticSuccessCount: n(input.diagnosticSuccessCount),
    diagnosticFailedCount: n(input.diagnosticFailedCount),
    reconciliationCount: n(input.reconciliationCount),
    adsDateRowReturned: input.adsDateRowReturned === true,
    adsDateConversions: n(input.adsDateConversions),
  };

  let state;
  if (evidence.reconciliationCount > 0) {
    state = "RECONCILIATION_REQUIRED";
  } else if (evidence.lineMatchedAdsCount === 0) {
    state = "NO_ELIGIBLE_EVENT";
  } else if (
    evidence.businessConversionCount === 0 ||
    evidence.eligibleBusinessCount === 0 ||
    evidence.outboxCount === 0
  ) {
    state = "ELIGIBLE_NOT_QUEUED";
  } else if (evidence.providerAttemptCount === 0) {
    state = "QUEUED_NOT_DISPATCHED";
  } else if (
    evidence.diagnosticFailedCount > 0 &&
    evidence.diagnosticSuccessCount === 0
  ) {
    state = "DIAGNOSTIC_FAILED";
  } else if (evidence.diagnosticSuccessCount === 0) {
    state = "DISPATCHED_DIAGNOSTIC_PENDING";
  } else if (
    evidence.adsDateRowReturned &&
    evidence.adsDateConversions > 0
  ) {
    state = "REPORTING_DELTA_CONFIRMED";
  } else {
    state = "DIAGNOSTIC_SUCCESS_REPORTING_PENDING";
  }

  return { state, evidence };
};
