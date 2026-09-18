export type SearchCampaignName =
  | "冷氣維修"
  | "冷氣清洗保養"
  | "冷氣安裝"
  | "商用工程";

export type SmartBiddingGateEvidence = {
  s0MaximizeClicksFamilyPreserved: boolean;
  phraseExactControlPreserved: boolean;
  canonicalConversionSecondary: boolean;

  genuineAdsToHyToLineToDataManagerToAdsE2ePass: boolean;
  duplicateCanonicalPathCount: number;
  funnelReproducible: boolean;

  observedConversionCycles: number;
  verifiedVolumeObserved: boolean;
  conversionLagObserved: boolean;
  costDistributionObserved: boolean;
  searchTermQualityObserved: boolean;

  selectedExperimentCampaign: SearchCampaignName | null;
  singleCampaignConversionBiddingExperimentPass: boolean;

  searchTermDataSufficientForAiMax: boolean;
  landingDataSufficientForAiMax: boolean;
  isolatedAiMaxExperimentPlanReady: boolean;
};

export type SmartBiddingGateResult =
  | {
      stage: "S0_INVARIANT_DRIFT_BLOCK";
      eligibleForStrategyMutation: false;
      missingEvidence: readonly string[];
    }
  | {
      stage: "S1_TRACKING_PROOF_PENDING";
      eligibleForStrategyMutation: false;
      missingEvidence: readonly string[];
    }
  | {
      stage: "S2_STABLE_OBSERVATION_PENDING";
      eligibleForStrategyMutation: false;
      missingEvidence: readonly string[];
    }
  | {
      stage: "S3_SINGLE_CAMPAIGN_SELECTION_REQUIRED";
      eligibleForStrategyMutation: false;
      missingEvidence: readonly string[];
    }
  | {
      stage: "S3_SINGLE_CAMPAIGN_EXPERIMENT_PENDING";
      eligibleForStrategyMutation: true;
      selectedExperimentCampaign: SearchCampaignName;
      missingEvidence: readonly string[];
    }
  | {
      stage: "S4_AI_MAX_NOT_READY";
      eligibleForStrategyMutation: false;
      selectedExperimentCampaign: SearchCampaignName;
      missingEvidence: readonly string[];
    }
  | {
      stage: "S4_AI_MAX_EXPERIMENT_ELIGIBLE";
      eligibleForStrategyMutation: false;
      selectedExperimentCampaign: SearchCampaignName;
      missingEvidence: readonly [];
    };

export const ADS_SMART_BIDDING_GATE_VERSION = "hanyao-smart-bidding-gate-v1";

const assertNonNegativeInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`INVALID_NON_NEGATIVE_INTEGER:${name}`);
  }
};

export const evaluateSmartBiddingGate = (
  evidence: SmartBiddingGateEvidence
): SmartBiddingGateResult => {
  assertNonNegativeInteger("duplicateCanonicalPathCount", evidence.duplicateCanonicalPathCount);
  assertNonNegativeInteger("observedConversionCycles", evidence.observedConversionCycles);

  const s0Missing = [
    !evidence.s0MaximizeClicksFamilyPreserved ? "Maximize Clicks / TARGET_SPEND family" : null,
    !evidence.phraseExactControlPreserved ? "phrase + exact control lane" : null,
    !evidence.canonicalConversionSecondary ? "canonical conversion remains Secondary" : null,
  ].filter((value): value is string => value !== null);

  if (s0Missing.length > 0) {
    return {
      stage: "S0_INVARIANT_DRIFT_BLOCK",
      eligibleForStrategyMutation: false,
      missingEvidence: s0Missing,
    };
  }

  const s1Missing = [
    !evidence.genuineAdsToHyToLineToDataManagerToAdsE2ePass
      ? "genuine Ads -> HY -> LINE -> Data Manager -> Ads reporting E2E PASS"
      : null,
    evidence.duplicateCanonicalPathCount !== 0
      ? "duplicate canonical path count must equal 0"
      : null,
    !evidence.funnelReproducible ? "reproducible canonical funnel" : null,
  ].filter((value): value is string => value !== null);

  if (s1Missing.length > 0) {
    return {
      stage: "S1_TRACKING_PROOF_PENDING",
      eligibleForStrategyMutation: false,
      missingEvidence: s1Missing,
    };
  }

  const s2Missing = [
    evidence.observedConversionCycles < 1 ? "at least one observed conversion cycle" : null,
    !evidence.verifiedVolumeObserved ? "verified conversion volume observation" : null,
    !evidence.conversionLagObserved ? "conversion lag observation" : null,
    !evidence.costDistributionObserved ? "cost distribution observation" : null,
    !evidence.searchTermQualityObserved ? "search-term quality observation" : null,
  ].filter((value): value is string => value !== null);

  if (s2Missing.length > 0) {
    return {
      stage: "S2_STABLE_OBSERVATION_PENDING",
      eligibleForStrategyMutation: false,
      missingEvidence: s2Missing,
    };
  }

  if (evidence.selectedExperimentCampaign === null) {
    return {
      stage: "S3_SINGLE_CAMPAIGN_SELECTION_REQUIRED",
      eligibleForStrategyMutation: false,
      missingEvidence: ["human-selected single campaign"],
    };
  }

  if (!evidence.singleCampaignConversionBiddingExperimentPass) {
    return {
      stage: "S3_SINGLE_CAMPAIGN_EXPERIMENT_PENDING",
      eligibleForStrategyMutation: true,
      selectedExperimentCampaign: evidence.selectedExperimentCampaign,
      missingEvidence: ["single-campaign Maximize Conversions or Target CPA experiment result"],
    };
  }

  const s4Missing = [
    !evidence.searchTermDataSufficientForAiMax ? "sufficient Search Terms evidence" : null,
    !evidence.landingDataSufficientForAiMax ? "sufficient landing-page evidence" : null,
    !evidence.isolatedAiMaxExperimentPlanReady ? "isolated AI Max experiment plan" : null,
  ].filter((value): value is string => value !== null);

  if (s4Missing.length > 0) {
    return {
      stage: "S4_AI_MAX_NOT_READY",
      eligibleForStrategyMutation: false,
      selectedExperimentCampaign: evidence.selectedExperimentCampaign,
      missingEvidence: s4Missing,
    };
  }

  return {
    stage: "S4_AI_MAX_EXPERIMENT_ELIGIBLE",
    eligibleForStrategyMutation: false,
    selectedExperimentCampaign: evidence.selectedExperimentCampaign,
    missingEvidence: [],
  };
};

export const ADS_SMART_BIDDING_GATE_CONTRACT = {
  status: "REPOSITORY_GATE_CONTRACT",
  s0ExpectedState: {
    bidding: "Maximize Clicks / TARGET_SPEND family",
    matching: "phrase + exact",
    canonicalConversion: "HY - Verified LINE Contact",
    canonicalConversionPrimary: false,
  },
  s1RequiredProof: [
    "genuine Ads -> HY -> LINE -> Data Manager -> Ads reporting E2E PASS",
    "duplicate canonical path count = 0",
    "reproducible canonical funnel",
  ],
  s2RequiredObservation: [
    "verified volume",
    "conversion lag",
    "cost distribution",
    "search-term quality",
  ],
  fixedGoogleMinimumConversionCount: null,
  fixedMinimumConversionCountRule: "DO_NOT_INVENT_PLATFORM_THRESHOLD",
  s3AllowedStrategies: ["Maximize Conversions", "Target CPA"],
  s3Scope: "ONE_HUMAN_SELECTED_CAMPAIGN_ONLY",
  s4Scope: "ISOLATED_AI_MAX_EXPERIMENT_WITH_CONTROL_LANE",
  aiMaxFeaturesRequireSeparateExperiment: [
    "search term matching",
    "text customization",
    "final URL expansion",
  ],
  googleAdsMutationApplied: false,
  automaticStrategyMutationAllowed: false,
  frozenUntilGatePass: [
    "account-wide bidding strategy",
    "Primary conversion goal",
    "HY - Verified LINE Contact identity",
    "account-wide broad match",
    "account-wide AI Max",
  ],
} as const;
