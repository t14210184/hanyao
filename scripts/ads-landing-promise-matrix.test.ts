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
