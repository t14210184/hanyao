export interface ReportingSnapshot {
  customerId: string;
  conversionActionId: string;
  allConversions: number;
  lastConversionDate: string | null;
  lastReceivedRequestDateTime: string | null;
}

export type ReportingVerificationState =
  | "BASELINE_REQUIRED"
  | "NO_DELTA"
  | "DELTA_WITHOUT_REQUEST_TIME_ADVANCE"
  | "DELTA_CONFIRMED";

const parseProviderTime = (value: string | null): number | null => {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const evaluateReportingEvidence = (
  current: ReportingSnapshot,
  baseline: ReportingSnapshot | null
) => {
  if (!baseline) {
    return {
      verificationState: "BASELINE_REQUIRED" as const,
      reportingVisible: false,
      conversionDelta: null,
      lastReceivedAdvanced: false,
    };
  }
  if (
    baseline.customerId !== current.customerId ||
    baseline.conversionActionId !== current.conversionActionId
  ) {
    throw new Error("REPORTING_BASELINE_TARGET_MISMATCH");
  }
  const conversionDelta = current.allConversions - baseline.allConversions;
  const currentReceived = parseProviderTime(current.lastReceivedRequestDateTime);
  const baselineReceived = parseProviderTime(baseline.lastReceivedRequestDateTime);
  const lastReceivedAdvanced =
    currentReceived !== null &&
    (baselineReceived === null || currentReceived > baselineReceived);
  const reportingVisible = conversionDelta > 0 && lastReceivedAdvanced;
  const verificationState: ReportingVerificationState = reportingVisible
    ? "DELTA_CONFIRMED"
    : conversionDelta > 0
      ? "DELTA_WITHOUT_REQUEST_TIME_ADVANCE"
      : "NO_DELTA";
  return {
    verificationState,
    reportingVisible,
    conversionDelta,
    lastReceivedAdvanced,
  };
};
