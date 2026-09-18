export const ADS_OPTIMIZATION_GATE_LEDGER_VERSION =
  "hanyao-ads-optimization-gate-ledger-v5";

export const ADS_OPTIMIZATION_GATE_LEDGER = {
  snapshotDate: "2026-09-18",
  baselineMain: "87ebea57b164b22b6477907befa72b738cfa74be",
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
        safeDimensions: [
          "service_type",
          "prepare_status",
          "handoff_type",
          "landing_path",
          "campaign_id",
        ],
        landingPathContainsQuery: false,
        campaignIdSource: "numeric utm_id only; never inferred from Google click IDs",
        canonicalGoogleAdsSenderTouched: false,
      },
      gtmBridge: {
        state: "PRODUCTION_SOURCE_PASS",
        livePublishApplied: false,
        liveProviderReadback: false,
        mutationGate: "FRESH_LIVE_AND_WORKSPACE_FINGERPRINT_BOUND",
        applyGate: "HANYAO_WP01_GTM_APPLY_APPROVED_20260918",
        publishGate: "HANYAO_WP01_GTM_PUBLISH_APPROVED_20260918",
        blocker:
          "GTM_AUTHENTICATED_PROVIDER_CONTROL_REQUIRES_FRESH_EXECUTION_SURFACE",
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
        googleAdsGitHubProbeRun: "35324074635",
        cloudflareSurfaceProbeRun: "35324102187",
        independentHardeningProbeRun: "35309857197",
        evidenceRefreshDate: "2026-09-18",
        googleCredentialInGitHubActions: false,
        cloudflareControlCredentialInGitHubActions: false,
        factoryMcpHostPowerShellGovernanceState: "AUTHORIZED_AND_DEPLOYED",
        shortLivedAccessTokenAdapter: "PRODUCTION_SOURCE_PASS",
        hostProviderRunner: "PRODUCTION_SOURCE_PASS",
        hostProviderRunnerMain:
          "87ebea57b164b22b6477907befa72b738cfa74be",
        currentChatFactoryMcpHostPowerShellLoaded: true,
        currentChatObservedFactoryMcpTools: [
          "factory_status",
          "worker_prepare",
          "worker_start",
          "host_powershell",
        ],
        currentChatObservedAttemptEpochMinimum: 0,
        governanceRequiredAttemptEpochMinimum: 1,
        currentChatFactoryMcpTransport:
          "TUNNEL_CLIENT_NOT_SEEN_FOR_300_SECONDS",
        executionSurfaceRefreshDate: "2026-09-18",
      },
      blocker:
        "FRESH_GOVERNED_FACTORY_MCP_RUNTIME_TRANSPORT_REQUIRED_BEFORE_GOOGLE_ADS_READBACK",
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
      blocker:
        "FRESH_GOVERNED_FACTORY_MCP_RUNTIME_TRANSPORT_REQUIRED_BEFORE_GOOGLE_ADS_READBACK",
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
      publicProviderEvidence: {
        checkedAt: "2026-09-18",
        apiFamily: "v25/v25.1",
        publicProviders: ["WHATSAPP", "FACEBOOK_MESSENGER", "ZALO"],
        lineExposedByPublicApi: false,
        messageAssetsBeta: true,
        taiwanOfficialPartner: "Crescendo Lab",
        taiwanOfficialPartnerEngaged: false,
      },
      blocker:
        "AUTHENTICATED_GOOGLE_ADS_UI_PRESTATE_PENDING_FOR_ACCOUNT_SPECIFIC_LINE_BETA",
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
    "WP02: fresh governed Factory MCP runtime proves connected transport and uses attemptEpoch >= 1 -> exact Production HANYAO host runner -> existing gcloud service-account impersonation -> short-lived access token -> fresh Google Ads Search Term/existing-negative prestate -> validateOnly -> exact-negative dispatch once -> same-source readback",
    "WP03: on the same governed HANYAO host runner path -> fresh campaign/ad-group/RSA inventory -> PAUSED exact A/B create -> readback -> policy/Ad Strength gate -> exact enable",
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
    main: "87ebea57b164b22b6477907befa72b738cfa74be",
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
