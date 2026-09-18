export const ADS_OPTIMIZATION_GATE_LEDGER_VERSION =
  "hanyao-ads-optimization-gate-ledger-v1";

export type GateState =
  | "PASS"
  | "READY_NO_PROVIDER_MUTATION"
  | "BLOCKED_FRESH_PROVIDER_PRESTATE"
  | "BLOCKED_GENUINE_E2E_PROOF"
  | "NOT_STARTED"
  | "NOT_READY";

export const ADS_OPTIMIZATION_GATE_LEDGER = {
  snapshotDate: "2026-09-18",
  baselineMain: "14669a8f5107c42b5f1e6ed148480aa58fa0b094",
  evidencePolicy: {
    providerTruthRequiresFreshSameSourceReadback: true,
    repositoryEvidenceDoesNotOverrideProviderTruth: true,
    historicalProviderEvidenceMayOnlyDefineAConservativeBlock: true,
    unknownSideEffectsMustBeReadBackBeforeRetry: true,
  },
  completedRepositoryAndWebsiteWork: [
    {
      workPackage: "WP06",
      state: "PASS",
      summary:
        "System-font payload elimination is live; later LCP micro-optimizations were rejected when same-window A/B did not prove material benefit.",
    },
    {
      workPackage: "WP07",
      state: "PASS",
      summary: "Ads-to-landing promise matrix is merged and enforced by regression.",
    },
    {
      workPackage: "WP08",
      state: "PASS",
      summary: "Lane A/Lane B KPI and observation contract is merged.",
    },
    {
      workPackage: "WP09",
      state: "PASS",
      summary:
        "Fail-closed Smart Bidding / AI Max entry gate contract is merged; current evidence disposition remains S1 pending.",
    },
    {
      workPackage: "WP05_API_PREFLIGHT_V2",
      state: "PASS",
      summary:
        "Read-only Google Ads Message Asset API preflight capability is merged; LINE Beta remains UI-only.",
    },
    {
      workPackage: "MOBILE_STICKY_CRO",
      state: "PASS",
      summary:
        "Paid service landing mobile sticky CTA is service-aware and aligned to each landing promise.",
    },
  ],
  providerExecution: {
    adsSearchHygiene: {
      state: "BLOCKED_FRESH_PROVIDER_PRESTATE",
      mutationApplied: false,
      requiredBeforeDispatch: [
        "fresh Search Terms window",
        "fresh campaign/ad-group identity",
        "fresh existing negative-keyword inventory",
      ],
      boundedMutation: "high-confidence exact negatives only",
    },
    rsaRollout: {
      state: "BLOCKED_FRESH_PROVIDER_PRESTATE",
      mutationApplied: false,
      requiredBeforeDispatch: [
        "fresh enabled ad groups",
        "fresh enabled RSA inventory",
        "fresh Ad Strength / feedback",
        "fresh final URLs",
      ],
      boundedMutation: "one controlled RSA candidate lane at a time",
    },
    lineMessageAssetPilot: {
      state: "BLOCKED_FRESH_PROVIDER_PRESTATE",
      mutationApplied: false,
      requiredBeforeDispatch: [
        "fresh Advertiser Verification state",
        "fresh Message Asset Beta eligibility",
        "fresh LINE + Line ID UI fields",
        "fresh campaign bidding strategy",
        "fresh campaign conversion-goal optimization set",
        "fresh Call / Lead Form / Message asset associations",
      ],
      boundedMutation:
        "one 冷氣維修 LINE Message Asset association through the account UI only",
    },
  },
  canonicalE2E: {
    state: "BLOCKED_GENUINE_E2E_PROOF",
    latestVerifiedHistoricalEvidence: {
      source: "PR #44 HG09 production readback",
      classification: "HISTORICAL_PROVIDER_EVIDENCE_REQUIRES_FRESH_READBACK",
      singleWriterTopologyPass: true,
      failedOutboxCount: 1,
      providerAttempts: 0,
      providerAttemptEvents: 0,
      providerLeases: 0,
      googleRequestIdObserved: false,
    },
    requiredToPass: [
      "fresh target D1 readback",
      "genuine Ads -> HY -> LINE business conversion",
      "Data Manager provider request + terminal success-equivalent diagnostics",
      "Google Ads reporting delta attributable to the new genuine event",
      "duplicate canonical sender/path count = 0",
    ],
    resendUnknownProviderEffectAllowed: false,
  },
  smartBiddingAndAiMax: {
    state: "BLOCKED_GENUINE_E2E_PROOF",
    gate: "S1_TRACKING_PROOF_PENDING",
    maxConversionsAllowedNow: false,
    targetCpaAllowedNow: false,
    broadMatchExpansionAllowedNow: false,
    aiMaxAllowedNow: false,
  },
  observation: {
    state: "NOT_STARTED",
    startCondition:
      "Provider pilot or canonical conversion cycle is actually active with fresh baseline captured.",
    minimumDaysAfterStart: 14,
    preferredMessageClicks: 100,
    preferredMessageClicksRuleSource: "HANYAO_PLAN_HEURISTIC_NOT_GOOGLE_PLATFORM_RULE",
  },
  adjudication: {
    state: "NOT_READY",
    requires: [
      "observation window complete",
      "Lane A / Lane B metrics computed",
      "phone-lead cannibalization guardrail reviewed",
      "irrelevant-chat and search-term-waste guardrails reviewed",
      "canonical E2E provider evidence reconciled",
    ],
  },
  currentLegalNextTransitions: [
    "fresh provider readback for canonical E2E reconciliation",
    "fresh Google Ads Search hygiene prestate before exact-negative dispatch",
    "fresh Google Ads RSA inventory before bounded RSA rollout",
    "fresh Google Ads UI prestate before LINE Message Asset association",
  ],
  prohibitedWithoutFreshGate: [
    "blind provider resend",
    "account-wide budget increase",
    "account-wide bidding-strategy switch",
    "Primary promotion of HY - Verified LINE Contact",
    "account-wide broad match enablement",
    "account-wide AI Max enablement",
    "treating Message Asset click as HY verified contact",
  ],
  googleAdsMutationAppliedByLedger: false,
} as const;

export const getExecutableProviderBlockers = (): readonly string[] => {
  const blockers = new Set<string>();

  if (
    ADS_OPTIMIZATION_GATE_LEDGER.providerExecution.adsSearchHygiene.state !==
    "READY_NO_PROVIDER_MUTATION"
  ) {
    blockers.add("ADS_SEARCH_HYGIENE_FRESH_PROVIDER_PRESTATE");
  }
  if (
    ADS_OPTIMIZATION_GATE_LEDGER.providerExecution.rsaRollout.state !==
    "READY_NO_PROVIDER_MUTATION"
  ) {
    blockers.add("RSA_FRESH_PROVIDER_PRESTATE");
  }
  if (
    ADS_OPTIMIZATION_GATE_LEDGER.providerExecution.lineMessageAssetPilot.state !==
    "READY_NO_PROVIDER_MUTATION"
  ) {
    blockers.add("LINE_MESSAGE_ASSET_FRESH_UI_PRESTATE");
  }
  if (ADS_OPTIMIZATION_GATE_LEDGER.canonicalE2E.state !== "PASS") {
    blockers.add("GENUINE_CANONICAL_E2E_PROOF");
  }

  return [...blockers];
};
