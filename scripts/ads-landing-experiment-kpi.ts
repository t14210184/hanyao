export type NullableMetric = number | null;

export type LaneAObservationInput = {
  paidClicks: number;
  verifiedLineContacts: number;
  qualifiedConversations: number;
  wonJobs: number;
  spendMicros: number;
};

export type LaneBObservationInput = {
  eligibleMessageImpressions: number;
  messageClicks: number;
  leadsFromMessages: number;
  manualRealConversations: number;
  qualifiedConversations: number;
  spendMicros: number;
};

export type GuardrailObservationInput = {
  phoneLeads: number;
  irrelevantChats: number;
  reviewedChats: number;
  prepareAttempts: number;
  prepareErrors: number;
  profileFallbacks: number;
  totalSearchTermSpendMicros: number;
  highConfidenceWasteSpendMicros: number;
  canonicalDuplicateSenderCount: number;
  dataManagerReconciliationIncidents: number;
};

export const ADS_EXPERIMENT_KPI_VERSION = "hanyao-ads-experiment-kpi-v1";

const assertCount = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`INVALID_NON_NEGATIVE_VALUE:${name}`);
  }
};

const ratio = (numerator: number, denominator: number): NullableMetric => {
  if (denominator === 0) return null;
  return numerator / denominator;
};

export const microsToCurrencyUnits = (micros: number): number => {
  assertCount("micros", micros);
  return micros / 1_000_000;
};

export const computeLaneAMetrics = (input: LaneAObservationInput) => {
  for (const [name, value] of Object.entries(input)) assertCount(name, value);

  return {
    verifiedLineContactsPer100PaidClicks:
      input.paidClicks === 0 ? null : (input.verifiedLineContacts / input.paidClicks) * 100,
    costPerVerifiedLineContactMicros: ratio(input.spendMicros, input.verifiedLineContacts),
    qualifiedConversationPerVerifiedLineContact: ratio(
      input.qualifiedConversations,
      input.verifiedLineContacts
    ),
    wonJobPerQualifiedConversation: ratio(input.wonJobs, input.qualifiedConversations),
  } as const;
};

export const computeLaneBMetrics = (input: LaneBObservationInput) => {
  for (const [name, value] of Object.entries(input)) assertCount(name, value);

  return {
    messageAssetCtr: ratio(input.messageClicks, input.eligibleMessageImpressions),
    costPerMessageAssetClickMicros: ratio(input.spendMicros, input.messageClicks),
    leadsFromMessages: input.leadsFromMessages,
    costPerLeadFromMessagesMicros: ratio(input.spendMicros, input.leadsFromMessages),
    manualRealConversationRate: ratio(input.manualRealConversations, input.messageClicks),
    qualifiedConversationRate: ratio(
      input.qualifiedConversations,
      input.manualRealConversations
    ),
  } as const;
};

export const computeGuardrailMetrics = (input: GuardrailObservationInput) => {
  for (const [name, value] of Object.entries(input)) assertCount(name, value);

  return {
    phoneLeads: input.phoneLeads,
    irrelevantChatRate: ratio(input.irrelevantChats, input.reviewedChats),
    prepareErrorRate: ratio(input.prepareErrors, input.prepareAttempts),
    profileFallbackRate: ratio(input.profileFallbacks, input.prepareAttempts),
    searchTermWasteShare: ratio(
      input.highConfidenceWasteSpendMicros,
      input.totalSearchTermSpendMicros
    ),
    canonicalDuplicateSenderCount: input.canonicalDuplicateSenderCount,
    dataManagerReconciliationIncidents: input.dataManagerReconciliationIncidents,
  } as const;
};

export const evaluateObservationReadiness = (input: {
  observationDays: number;
  messageClicks: number;
}) => {
  assertCount("observationDays", input.observationDays);
  assertCount("messageClicks", input.messageClicks);

  if (input.observationDays < 14) {
    return {
      status: "OBSERVATION_WINDOW_INCOMPLETE",
      decisionEligible: false,
      messageSamplePreferredThresholdReached: input.messageClicks >= 100,
    } as const;
  }

  if (input.messageClicks < 100) {
    return {
      status: "DIRECTIONAL_ONLY_LOW_MESSAGE_SAMPLE",
      decisionEligible: true,
      messageSamplePreferredThresholdReached: false,
    } as const;
  }

  return {
    status: "PREFERRED_MESSAGE_SAMPLE_REACHED",
    decisionEligible: true,
    messageSamplePreferredThresholdReached: true,
  } as const;
};

export const ADS_EXPERIMENT_KPI_CONTRACT = {
  status: "REPOSITORY_CONTRACT",
  observationFloorDays: 14,
  preferredMessageAssetClicks: 100,
  sampleRuleSource: "HANYAO_PLAN_HEURISTIC_NOT_GOOGLE_PLATFORM_RULE",
  canonicalBusinessKpi: "TOTAL_REAL_CONTACTS",
  canonicalVerifiedConversion: "HY - Verified LINE Contact",
  laneA: {
    name: "WEBSITE_CANONICAL",
    metrics: [
      "Verified LINE Contact / 100 paid clicks",
      "Cost / Verified LINE Contact",
      "Qualified conversation / Verified LINE Contact",
      "Won job / Qualified conversation",
    ],
  },
  laneB: {
    name: "GOOGLE_MESSAGE_ASSET",
    metrics: [
      "Message Asset CTR",
      "Cost / Message Asset click",
      "Leads from Messages",
      "Cost / Leads from Messages",
      "manual/CRM real conversation count",
      "qualified conversation count",
    ],
    messageAssetClickIsVerifiedContact: false,
    leadsFromMessagesMayReplaceCanonicalConversion: false,
  },
  guardrails: [
    "phone leads",
    "irrelevant chat rate",
    "prepare error rate",
    "profile fallback rate",
    "Ads search term waste share",
    "landing bounce / engagement as diagnostic only",
    "Data Manager duplicate/reconciliation incidents",
    "GTM/GA4 duplicate canonical sender = 0",
  ],
  forbiddenDecisionShortcuts: [
    "CTR only",
    "Ad Strength only",
    "line_click only",
    "LINE friend-add only",
    "Goals page green status only",
    "historical allConversions total only",
  ],
  manualTruthRequiredFor: [
    "manual/CRM real conversation count",
    "qualified conversation count",
    "won job count",
  ],
  frozenLeversUntilLaterGate: [
    "budget",
    "bidding strategy",
    "Primary conversion goal",
    "HY - Verified LINE Contact identity",
    "broad match expansion",
    "AI Max",
  ],
  googleAdsMutationApplied: false,
} as const;
