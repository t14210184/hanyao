import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { RSA_CANDIDATES } from "./ads-rsa-candidates.ts";
import {
  ADS_LANDING_PROMISE_MATRIX,
  ADS_LANDING_PROMISE_MATRIX_VERSION,
  ADS_LANDING_PROMISE_ROLLOUT,
} from "./ads-landing-promise-matrix.ts";
import {
  ADS_EXPERIMENT_KPI_CONTRACT,
  ADS_EXPERIMENT_KPI_VERSION,
  computeGuardrailMetrics,
  computeLaneAMetrics,
  computeLaneBMetrics,
  evaluateObservationReadiness,
  microsToCurrencyUnits,
} from "./ads-landing-experiment-kpi.ts";
import {
  ADS_SMART_BIDDING_GATE_CONTRACT,
  ADS_SMART_BIDDING_GATE_VERSION,
  evaluateSmartBiddingGate,
} from "./ads-landing-smart-bidding-gate.ts";
import {
  ADS_OPTIMIZATION_GATE_LEDGER,
  ADS_OPTIMIZATION_GATE_LEDGER_VERSION,
  getExecutableProviderBlockers,
} from "./ads-optimization-gate-ledger.ts";

const read = (relative: string): string =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const firstHero = (source: string): string => {
  const start = source.indexOf("<section");
  assert.ok(start >= 0, "hero section start not found");
  const end = source.indexOf("</section>", start);
  assert.ok(end > start, "hero section end not found");
  return source.slice(start, end + "</section>".length);
};

test("WP07 defines one bounded promise lane per active Search campaign", () => {
  assert.equal(ADS_LANDING_PROMISE_MATRIX_VERSION, "hanyao-ads-landing-promise-v1");
  assert.equal(ADS_LANDING_PROMISE_MATRIX.length, 4);
  assert.equal(new Set(ADS_LANDING_PROMISE_MATRIX.map((x) => x.campaign)).size, 4);
  assert.equal(ADS_LANDING_PROMISE_ROLLOUT.status, "REPOSITORY_CONTRACT");
  assert.equal(ADS_LANDING_PROMISE_ROLLOUT.googleAdsMutationApplied, false);
});

test("RSA candidate promise and landing first screen stay aligned", () => {
  for (const lane of ADS_LANDING_PROMISE_MATRIX) {
    const source = read(lane.sourceFile);
    const hero = firstHero(source);
    const rsa = RSA_CANDIDATES.find((x) => x.campaign === lane.campaign);
    assert.ok(rsa, `RSA candidate missing for ${lane.campaign}`);
    assert.equal(rsa.landingPath, lane.landingPath);

    for (const token of lane.requiredHeroTokens) {
      assert.ok(hero.includes(token), `${lane.campaign} hero missing: ${token}`);
    }
    assert.match(hero, /trackEventName="line_click"/, `${lane.campaign} hero missing LINE attempt tracking`);

    for (const token of lane.requiredPageTokens) {
      assert.ok(source.includes(token), `${lane.campaign} page proof missing: ${token}`);
    }

    const rsaText = JSON.stringify(rsa);
    for (const token of lane.requiredRsaTokens) {
      assert.ok(rsaText.includes(token), `${lane.campaign} RSA promise missing: ${token}`);
    }
  }
});

test("cleaning hero no longer hides the ad promise behind a generic LINE CTA", () => {
  const source = read("src/app/services/ac-cleaning/AcCleaningServiceClient.tsx");
  const hero = firstHero(source);
  assert.doesNotMatch(hero, />立即 LINE 諮詢</);
  assert.match(hero, /機型銘牌照片/);
  assert.match(hero, /清洗台數/);
  assert.match(hero, /所在地區/);
  assert.match(hero, /傳機型照片／台數先確認/);
});

test("WP07 contract contains no provider mutation transport", () => {
  const source = read("scripts/ads-landing-promise-matrix.ts");
  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /:mutate|mutate[A-Z]|mutate_/i);
  assert.ok(ADS_LANDING_PROMISE_ROLLOUT.frozenLevers.includes("budget"));
  assert.ok(ADS_LANDING_PROMISE_ROLLOUT.frozenLevers.includes("bidding strategy"));
  assert.ok(ADS_LANDING_PROMISE_ROLLOUT.frozenLevers.includes("Primary conversion goal"));
  assert.ok(ADS_LANDING_PROMISE_ROLLOUT.frozenLevers.includes("AI Max"));
});


test("WP08 computes Lane A and Lane B business KPIs without treating missing samples as zero", () => {
  assert.equal(ADS_EXPERIMENT_KPI_VERSION, "hanyao-ads-experiment-kpi-v1");

  const laneA = computeLaneAMetrics({
    paidClicks: 200,
    verifiedLineContacts: 10,
    qualifiedConversations: 6,
    wonJobs: 3,
    spendMicros: 20_000_000,
  });
  assert.equal(laneA.verifiedLineContactsPer100PaidClicks, 5);
  assert.equal(microsToCurrencyUnits(laneA.costPerVerifiedLineContactMicros!), 2);
  assert.equal(laneA.qualifiedConversationPerVerifiedLineContact, 0.6);
  assert.equal(laneA.wonJobPerQualifiedConversation, 0.5);

  const laneB = computeLaneBMetrics({
    eligibleMessageImpressions: 1_000,
    messageClicks: 100,
    leadsFromMessages: 20,
    manualRealConversations: 12,
    qualifiedConversations: 6,
    spendMicros: 30_000_000,
  });
  assert.equal(laneB.messageAssetCtr, 0.1);
  assert.equal(microsToCurrencyUnits(laneB.costPerMessageAssetClickMicros!), 0.3);
  assert.equal(laneB.leadsFromMessages, 20);
  assert.equal(microsToCurrencyUnits(laneB.costPerLeadFromMessagesMicros!), 1.5);
  assert.equal(laneB.manualRealConversationRate, 0.12);
  assert.equal(laneB.qualifiedConversationRate, 0.5);

  const empty = computeLaneAMetrics({
    paidClicks: 0,
    verifiedLineContacts: 0,
    qualifiedConversations: 0,
    wonJobs: 0,
    spendMicros: 0,
  });
  assert.equal(empty.verifiedLineContactsPer100PaidClicks, null);
  assert.equal(empty.costPerVerifiedLineContactMicros, null);
  assert.equal(empty.qualifiedConversationPerVerifiedLineContact, null);
  assert.equal(empty.wonJobPerQualifiedConversation, null);
});

test("WP08 guardrails keep message volume, phone leads, waste, and duplicate incidents visible", () => {
  const guardrails = computeGuardrailMetrics({
    phoneLeads: 7,
    irrelevantChats: 2,
    reviewedChats: 10,
    prepareAttempts: 40,
    prepareErrors: 2,
    profileFallbacks: 4,
    totalSearchTermSpendMicros: 100_000_000,
    highConfidenceWasteSpendMicros: 12_000_000,
    canonicalDuplicateSenderCount: 0,
    dataManagerReconciliationIncidents: 1,
  });

  assert.equal(guardrails.phoneLeads, 7);
  assert.equal(guardrails.irrelevantChatRate, 0.2);
  assert.equal(guardrails.prepareErrorRate, 0.05);
  assert.equal(guardrails.profileFallbackRate, 0.1);
  assert.equal(guardrails.searchTermWasteShare, 0.12);
  assert.equal(guardrails.canonicalDuplicateSenderCount, 0);
  assert.equal(guardrails.dataManagerReconciliationIncidents, 1);
});

test("WP08 observation maturity distinguishes minimum window from preferred message sample", () => {
  assert.deepEqual(evaluateObservationReadiness({ observationDays: 13, messageClicks: 150 }), {
    status: "OBSERVATION_WINDOW_INCOMPLETE",
    decisionEligible: false,
    messageSamplePreferredThresholdReached: true,
  });
  assert.deepEqual(evaluateObservationReadiness({ observationDays: 14, messageClicks: 99 }), {
    status: "DIRECTIONAL_ONLY_LOW_MESSAGE_SAMPLE",
    decisionEligible: true,
    messageSamplePreferredThresholdReached: false,
  });
  assert.deepEqual(evaluateObservationReadiness({ observationDays: 14, messageClicks: 100 }), {
    status: "PREFERRED_MESSAGE_SAMPLE_REACHED",
    decisionEligible: true,
    messageSamplePreferredThresholdReached: true,
  });
});

test("WP08 keeps Message Asset signals isolated from canonical HY conversion and freezes later-stage levers", () => {
  assert.equal(ADS_EXPERIMENT_KPI_CONTRACT.status, "REPOSITORY_CONTRACT");
  assert.equal(ADS_EXPERIMENT_KPI_CONTRACT.googleAdsMutationApplied, false);
  assert.equal(ADS_EXPERIMENT_KPI_CONTRACT.canonicalVerifiedConversion, "HY - Verified LINE Contact");
  assert.equal(ADS_EXPERIMENT_KPI_CONTRACT.laneB.messageAssetClickIsVerifiedContact, false);
  assert.equal(
    ADS_EXPERIMENT_KPI_CONTRACT.laneB.leadsFromMessagesMayReplaceCanonicalConversion,
    false
  );
  assert.equal(ADS_EXPERIMENT_KPI_CONTRACT.observationFloorDays, 14);
  assert.equal(ADS_EXPERIMENT_KPI_CONTRACT.preferredMessageAssetClicks, 100);
  assert.equal(
    ADS_EXPERIMENT_KPI_CONTRACT.sampleRuleSource,
    "HANYAO_PLAN_HEURISTIC_NOT_GOOGLE_PLATFORM_RULE"
  );
  assert.ok(ADS_EXPERIMENT_KPI_CONTRACT.frozenLeversUntilLaterGate.includes("budget"));
  assert.ok(ADS_EXPERIMENT_KPI_CONTRACT.frozenLeversUntilLaterGate.includes("bidding strategy"));
  assert.ok(ADS_EXPERIMENT_KPI_CONTRACT.frozenLeversUntilLaterGate.includes("AI Max"));

  const source = read("scripts/ads-landing-experiment-kpi.ts");
  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /:mutate|mutate[A-Z]|mutate_/i);
});


test("WP09 blocks Smart Bidding when genuine canonical E2E proof is missing", () => {
  assert.equal(ADS_SMART_BIDDING_GATE_VERSION, "hanyao-smart-bidding-gate-v1");
  const result = evaluateSmartBiddingGate({
    ...{
    s0MaximizeClicksFamilyPreserved: true,
    phraseExactControlPreserved: true,
    canonicalConversionSecondary: true,
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: true,
    duplicateCanonicalPathCount: 0,
    funnelReproducible: true,
    observedConversionCycles: 2,
    verifiedVolumeObserved: true,
    conversionLagObserved: true,
    costDistributionObserved: true,
    searchTermQualityObserved: true,
    selectedExperimentCampaign: "冷氣維修" as const,
    singleCampaignConversionBiddingExperimentPass: true,
    searchTermDataSufficientForAiMax: true,
    landingDataSufficientForAiMax: true,
    isolatedAiMaxExperimentPlanReady: true,
  },
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: false,
    observedConversionCycles: 0,
    verifiedVolumeObserved: false,
    selectedExperimentCampaign: null,
    singleCampaignConversionBiddingExperimentPass: false,
    searchTermDataSufficientForAiMax: false,
    landingDataSufficientForAiMax: false,
    isolatedAiMaxExperimentPlanReady: false,
  });
  assert.equal(result.stage, "S1_TRACKING_PROOF_PENDING");
  assert.equal(result.eligibleForStrategyMutation, false);
  assert.ok(
    result.missingEvidence.includes(
      "genuine Ads -> HY -> LINE -> Data Manager -> Ads reporting E2E PASS"
    )
  );
});

test("WP09 duplicate canonical path blocks S1 even if provider E2E exists", () => {
  const result = evaluateSmartBiddingGate({
    ...{
    s0MaximizeClicksFamilyPreserved: true,
    phraseExactControlPreserved: true,
    canonicalConversionSecondary: true,
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: true,
    duplicateCanonicalPathCount: 0,
    funnelReproducible: true,
    observedConversionCycles: 2,
    verifiedVolumeObserved: true,
    conversionLagObserved: true,
    costDistributionObserved: true,
    searchTermQualityObserved: true,
    selectedExperimentCampaign: "冷氣維修" as const,
    singleCampaignConversionBiddingExperimentPass: true,
    searchTermDataSufficientForAiMax: true,
    landingDataSufficientForAiMax: true,
    isolatedAiMaxExperimentPlanReady: true,
  },
    duplicateCanonicalPathCount: 1,
  });
  assert.equal(result.stage, "S1_TRACKING_PROOF_PENDING");
  assert.equal(result.eligibleForStrategyMutation, false);
});

test("WP09 requires observation evidence without inventing a fixed Google conversion threshold", () => {
  const result = evaluateSmartBiddingGate({
    ...{
    s0MaximizeClicksFamilyPreserved: true,
    phraseExactControlPreserved: true,
    canonicalConversionSecondary: true,
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: true,
    duplicateCanonicalPathCount: 0,
    funnelReproducible: true,
    observedConversionCycles: 2,
    verifiedVolumeObserved: true,
    conversionLagObserved: true,
    costDistributionObserved: true,
    searchTermQualityObserved: true,
    selectedExperimentCampaign: "冷氣維修" as const,
    singleCampaignConversionBiddingExperimentPass: true,
    searchTermDataSufficientForAiMax: true,
    landingDataSufficientForAiMax: true,
    isolatedAiMaxExperimentPlanReady: true,
  },
    observedConversionCycles: 0,
    verifiedVolumeObserved: false,
    conversionLagObserved: false,
    costDistributionObserved: false,
    searchTermQualityObserved: false,
    selectedExperimentCampaign: null,
    singleCampaignConversionBiddingExperimentPass: false,
  });
  assert.equal(result.stage, "S2_STABLE_OBSERVATION_PENDING");
  assert.equal(result.eligibleForStrategyMutation, false);
  assert.equal(ADS_SMART_BIDDING_GATE_CONTRACT.fixedGoogleMinimumConversionCount, null);
  assert.equal(
    ADS_SMART_BIDDING_GATE_CONTRACT.fixedMinimumConversionCountRule,
    "DO_NOT_INVENT_PLATFORM_THRESHOLD"
  );
});

test("WP09 only exposes a single-campaign strategy experiment after S1 and S2 pass", () => {
  const noSelection = evaluateSmartBiddingGate({
    ...{
    s0MaximizeClicksFamilyPreserved: true,
    phraseExactControlPreserved: true,
    canonicalConversionSecondary: true,
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: true,
    duplicateCanonicalPathCount: 0,
    funnelReproducible: true,
    observedConversionCycles: 2,
    verifiedVolumeObserved: true,
    conversionLagObserved: true,
    costDistributionObserved: true,
    searchTermQualityObserved: true,
    selectedExperimentCampaign: "冷氣維修" as const,
    singleCampaignConversionBiddingExperimentPass: true,
    searchTermDataSufficientForAiMax: true,
    landingDataSufficientForAiMax: true,
    isolatedAiMaxExperimentPlanReady: true,
  },
    selectedExperimentCampaign: null,
    singleCampaignConversionBiddingExperimentPass: false,
  });
  assert.equal(noSelection.stage, "S3_SINGLE_CAMPAIGN_SELECTION_REQUIRED");
  assert.equal(noSelection.eligibleForStrategyMutation, false);

  const selected = evaluateSmartBiddingGate({
    ...{
    s0MaximizeClicksFamilyPreserved: true,
    phraseExactControlPreserved: true,
    canonicalConversionSecondary: true,
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: true,
    duplicateCanonicalPathCount: 0,
    funnelReproducible: true,
    observedConversionCycles: 2,
    verifiedVolumeObserved: true,
    conversionLagObserved: true,
    costDistributionObserved: true,
    searchTermQualityObserved: true,
    selectedExperimentCampaign: "冷氣維修" as const,
    singleCampaignConversionBiddingExperimentPass: true,
    searchTermDataSufficientForAiMax: true,
    landingDataSufficientForAiMax: true,
    isolatedAiMaxExperimentPlanReady: true,
  },
    selectedExperimentCampaign: "冷氣維修",
    singleCampaignConversionBiddingExperimentPass: false,
  });
  assert.equal(selected.stage, "S3_SINGLE_CAMPAIGN_EXPERIMENT_PENDING");
  assert.equal(selected.eligibleForStrategyMutation, true);
  assert.equal(selected.selectedExperimentCampaign, "冷氣維修");
});

test("WP09 keeps AI Max isolated and never auto-dispatches provider mutation", () => {
  const notReady = evaluateSmartBiddingGate({
    ...{
    s0MaximizeClicksFamilyPreserved: true,
    phraseExactControlPreserved: true,
    canonicalConversionSecondary: true,
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: true,
    duplicateCanonicalPathCount: 0,
    funnelReproducible: true,
    observedConversionCycles: 2,
    verifiedVolumeObserved: true,
    conversionLagObserved: true,
    costDistributionObserved: true,
    searchTermQualityObserved: true,
    selectedExperimentCampaign: "冷氣維修" as const,
    singleCampaignConversionBiddingExperimentPass: true,
    searchTermDataSufficientForAiMax: true,
    landingDataSufficientForAiMax: true,
    isolatedAiMaxExperimentPlanReady: true,
  },
    searchTermDataSufficientForAiMax: false,
  });
  assert.equal(notReady.stage, "S4_AI_MAX_NOT_READY");
  assert.equal(notReady.eligibleForStrategyMutation, false);

  const eligible = evaluateSmartBiddingGate({
    s0MaximizeClicksFamilyPreserved: true,
    phraseExactControlPreserved: true,
    canonicalConversionSecondary: true,
    genuineAdsToHyToLineToDataManagerToAdsE2ePass: true,
    duplicateCanonicalPathCount: 0,
    funnelReproducible: true,
    observedConversionCycles: 2,
    verifiedVolumeObserved: true,
    conversionLagObserved: true,
    costDistributionObserved: true,
    searchTermQualityObserved: true,
    selectedExperimentCampaign: "冷氣維修" as const,
    singleCampaignConversionBiddingExperimentPass: true,
    searchTermDataSufficientForAiMax: true,
    landingDataSufficientForAiMax: true,
    isolatedAiMaxExperimentPlanReady: true,
  });
  assert.equal(eligible.stage, "S4_AI_MAX_EXPERIMENT_ELIGIBLE");
  assert.equal(eligible.eligibleForStrategyMutation, false);
  assert.equal(ADS_SMART_BIDDING_GATE_CONTRACT.googleAdsMutationApplied, false);
  assert.equal(ADS_SMART_BIDDING_GATE_CONTRACT.automaticStrategyMutationAllowed, false);
  assert.equal(ADS_SMART_BIDDING_GATE_CONTRACT.s3Scope, "ONE_HUMAN_SELECTED_CAMPAIGN_ONLY");
  assert.equal(ADS_SMART_BIDDING_GATE_CONTRACT.s4Scope, "ISOLATED_AI_MAX_EXPERIMENT_WITH_CONTROL_LANE");

  const source = read("scripts/ads-landing-smart-bidding-gate.ts");
  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /:mutate|mutate[A-Z]|mutate_/i);
});


test("WP10 ledger never promotes repository readiness into provider completion", () => {
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER_VERSION,
    "hanyao-ads-optimization-gate-ledger-v1"
  );
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.googleAdsMutationAppliedByLedger, false);
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.providerExecution.adsSearchHygiene.mutationApplied,
    false
  );
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.providerExecution.rsaRollout.mutationApplied, false);
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.providerExecution.lineMessageAssetPilot.mutationApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.canonicalE2E.state,
    "BLOCKED_GENUINE_E2E_PROOF"
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.smartBiddingAndAiMax.gate,
    "S1_TRACKING_PROOF_PENDING"
  );
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.observation.state, "NOT_STARTED");
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.adjudication.state, "NOT_READY");
});

test("WP10 ledger keeps historical provider evidence explicitly non-current", () => {
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.canonicalE2E.latestVerifiedHistoricalEvidence
      .classification,
    "HISTORICAL_PROVIDER_EVIDENCE_REQUIRES_FRESH_READBACK"
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.evidencePolicy.providerTruthRequiresFreshSameSourceReadback,
    true
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.evidencePolicy.unknownSideEffectsMustBeReadBackBeforeRetry,
    true
  );
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.canonicalE2E.resendUnknownProviderEffectAllowed, false);
});

test("WP10 exposes the exact provider blockers and keeps high-risk levers frozen", () => {
  assert.deepEqual(getExecutableProviderBlockers(), [
    "ADS_SEARCH_HYGIENE_FRESH_PROVIDER_PRESTATE",
    "RSA_FRESH_PROVIDER_PRESTATE",
    "LINE_MESSAGE_ASSET_FRESH_UI_PRESTATE",
    "GENUINE_CANONICAL_E2E_PROOF",
  ]);

  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.smartBiddingAndAiMax.maxConversionsAllowedNow, false);
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.smartBiddingAndAiMax.targetCpaAllowedNow, false);
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.smartBiddingAndAiMax.broadMatchExpansionAllowedNow, false);
  assert.equal(ADS_OPTIMIZATION_GATE_LEDGER.smartBiddingAndAiMax.aiMaxAllowedNow, false);

  const source = read("scripts/ads-optimization-gate-ledger.ts");
  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /:mutate|mutate[A-Z]|mutate_/i);
});
