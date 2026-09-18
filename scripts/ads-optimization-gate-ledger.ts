export const ADS_OPTIMIZATION_GATE_LEDGER_VERSION =
  "hanyao-ads-optimization-gate-ledger-v2";

export const ADS_OPTIMIZATION_GATE_LEDGER = {
  snapshotDate: "2026-09-18",
  baselineMain: "066a9c2f3fabbf5b76c8b4e3d2ce5d9b834949e8",
  authority: {
    providerTruthOverridesRepositorySnapshot: true,
    freshSameSourceReadbackRequiredForProviderClaims: true,
    historicalEvidenceMayOnlyKeepAGateClosed: true,
    unknownSharedEffectsMustBeReadBackBeforeRetry: true,
  },

  workPackages: {
    WP00: {
      state: "PRODUCTION_SOURCE_PASS",
      summary:
        "Baseline/scope evidence is merged; current provider facts must still be refreshed before provider mutations.",
    },

    WP01: {
      state: "PRODUCTION_SOURCE_PASS_PROVIDER_APPLY_PENDING",
      websiteDataLayer: {
        state: "PRODUCTION_PASS",
        safeDimensions: ["service_type", "prepare_status", "handoff_type"],
        canonicalGoogleAdsSenderTouched: false,
      },
      gtmBridge: {
        state: "PRODUCTION_SOURCE_PASS",
        livePublishApplied: false,
        liveProviderReadback: false,
        blocker: "GTM_PROVIDER_AUTH_UNAVAILABLE_IN_CURRENT_EXECUTION_SURFACE",
      },
      ga4: {
        customDimensionsApplied: false,
        blocker:
          "GA4_PROPERTY_AND_AUTHENTICATED_ADMIN_PROVIDER_READBACK_NOT_AVAILABLE",
      },
    },

    WP02: {
      state: "PRODUCTION_SOURCE_PASS_PROVIDER_APPLY_PENDING",
      classificationRules: "PASS",
      exactNegativeEngine: "PASS",
      googleAdsMutationApplied: false,
      freshProviderReadApplied: false,
      boundedMutation:
        "paid-click evidence + Tier A/B + ad-group-scoped EXACT negatives only",
      providerEvidence: {
        googleAdsGitHubProbeRun: "35308912502",
        cloudflareSurfaceProbeRun: "35309818381",
        independentHardeningProbeRun: "35309857197",
        googleCredentialInGitHubActions: false,
        cloudflareControlCredentialInGitHubActions: false,
      },
      blocker: "PROVIDER_CONTROL_CREDENTIAL_UNAVAILABLE_IN_CURRENT_EXECUTION_SURFACE",
    },

    WP03: {
      state: "PRODUCTION_SOURCE_PASS_PROVIDER_APPLY_PENDING",
      rsaCandidateMatrix: "PASS",
      stagedProviderEngine: "PASS",
      pausedCreateMutationApplied: false,
      enableMutationApplied: false,
      rolloutProtocol: [
        "fresh campaign/ad-group/RSA inventory",
        "deterministic A/B exact-copy plan",
        "PAUSED create only",
        "same-source readback",
        "require GOOD/EXCELLENT Ad Strength and APPROVED policy",
        "enable exact candidate resources only",
      ],
      currentServingAdsMutatedByWp03Engine: false,
      blocker: "GOOGLE_ADS_PROVIDER_AUTH_UNAVAILABLE_IN_CURRENT_EXECUTION_SURFACE",
    },

    WP04: {
      state: "PRODUCTION_PASS",
      summary:
        "Repair landing CRO, mobile LINE priority, and service-aware sticky CTA alignment are live.",
    },

    WP05: {
      state: "PRODUCTION_SOURCE_PASS_PROVIDER_UI_PENDING",
      candidateAndIsolationContract: "PASS",
      apiReadonlyPreflight: "PASS",
      uiExecutionContract: "PASS",
      uiEvidenceCliReadiness: "PASS",
      productionPagesReadiness: "PASS",
      authenticatedUiPrestateCaptured: false,
      messageAssetMutationApplied: false,
      messageAssetPilotActive: false,
      exactLineId: "@451vpomq",
      exactCampaign: "冷氣維修",
      blocker:
        "AUTHENTICATED_GOOGLE_ADS_UI_NOT_AVAILABLE_IN_CURRENT_EXECUTION_SURFACE",
    },

    WP06: {
      state: "PRODUCTION_PASS",
      summary:
        "Production mobile performance baseline and system-font improvement are live; later LCP candidates were rejected when contemporaneous A/B did not prove material benefit.",
    },

    WP07: {
      state: "PRODUCTION_PASS",
      summary:
        "Four Search campaign promises and paid landing first-screen actions are aligned and regression-enforced.",
    },

    WP08: {
      state: "PRODUCTION_SOURCE_PASS_OBSERVATION_NOT_STARTED",
      kpiContract: "PASS",
      minimumObservationDays: 14,
      preferredMessageAssetClicks: 100,
      preferredMessageAssetClicksIsGooglePlatformRequirement: false,
      observationStarted: false,
      startCondition:
        "A real provider pilot or canonical conversion cycle is active and its fresh baseline is captured.",
    },

    WP09: {
      state: "PRODUCTION_SOURCE_PASS_GATE_CLOSED",
      smartBiddingAiMaxGateContract: "PASS",
      currentStage: "S1_TRACKING_PROOF_PENDING",
      strategyMutationApplied: false,
      broadMatchExpansionApplied: false,
      aiMaxApplied: false,
      blockedUntil: [
        "genuine canonical Ads-to-HY-to-LINE-to-Data-Manager-to-Ads-reporting proof",
        "duplicate canonical sender/path = 0",
        "stable observation evidence required by the WP09 gate",
      ],
    },

    WP10: {
      state: "CURRENT_LEDGER_CANDIDATE",
      supersedesPullRequest: 49,
      repositoryMutationOnly: true,
      providerMutationAppliedByLedger: false,
    },
  },

  externalProviderBlockers: [
    {
      id: "WP01_GTM_PROVIDER_AUTH",
      blocks: ["WP01_GTM_LIVE_PUBLISH", "WP01_GA4_ADMIN_CONFIGURATION"],
    },
    {
      id: "WP02_GOOGLE_ADS_CONTROL_CREDENTIAL",
      blocks: ["WP02_FRESH_SEARCH_TERM_PRESTATE", "WP02_EXACT_NEGATIVE_MUTATION"],
    },
    {
      id: "WP03_GOOGLE_ADS_CONTROL_CREDENTIAL",
      blocks: ["WP03_FRESH_RSA_INVENTORY", "WP03_PAUSED_CREATE", "WP03_ENABLE"],
    },
    {
      id: "WP05_AUTHENTICATED_GOOGLE_ADS_UI",
      blocks: ["WP05_UI_PRESTATE", "WP05_MESSAGE_ASSET_ASSOCIATION"],
    },
    {
      id: "GENUINE_CANONICAL_E2E_PROVIDER_PROOF",
      blocks: ["WP09_S1_PASS", "WP08_REAL_OBSERVATION_CLOCK", "LATER_STRATEGY_GATES"],
    },
  ],

  currentLegalNextTransitions: [
    "WP01: authenticated GTM live dry-run -> isolated apply -> publish -> live readback; then GA4 Admin readback/config only with exact property identity",
    "WP02: fresh Google Ads Search Term/existing-negative prestate -> validateOnly -> exact-negative dispatch once -> same-source readback",
    "WP03: fresh campaign/ad-group/RSA inventory -> PAUSED exact A/B create -> readback -> policy/Ad Strength gate -> exact enable",
    "WP05: fresh authenticated UI prestate -> exact hash/gate -> one bounded 冷氣維修 LINE Message Asset association -> fresh UI poststate",
    "WP08/WP09: start observation only after a real provider pilot/canonical conversion cycle is active and baseline captured",
  ],

  prohibitedNow: [
    "blind provider retry after ambiguous side effect",
    "treating repository-ready tooling as live Google Ads state",
    "account-wide budget increase",
    "account-wide bidding-strategy switch",
    "Primary promotion of HY - Verified LINE Contact before later gate",
    "account-wide broad match enablement",
    "account-wide AI Max enablement",
    "treating Message Asset click as HY verified contact",
    "creating undocumented LINE Business Message provider payloads",
  ],

  latestRepositoryVerification: {
    main: "066a9c2f3fabbf5b76c8b4e3d2ce5d9b834949e8",
    mainReadiness: "PASS",
    cloudflarePagesProduction: "SUCCESS",
  },

  providerMutationAppliedByLedger: false,
} as const;

export const getWp10BlockingIds = (): readonly string[] =>
  ADS_OPTIMIZATION_GATE_LEDGER.externalProviderBlockers.map((item) => item.id);

export const allWp10RepositoryWorkPackagesRepresented = (): boolean => {
  const keys = Object.keys(ADS_OPTIMIZATION_GATE_LEDGER.workPackages);
  return Array.from({ length: 11 }, (_, index) => `WP${String(index).padStart(2, "0")}`)
    .every((key) => keys.includes(key));
};
