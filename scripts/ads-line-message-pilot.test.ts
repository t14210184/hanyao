import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { MESSAGE_PILOT, MESSAGE_PILOT_VERSION } from "./ads-line-message-pilot.ts";

const read = (relative: string): string =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

test("WP05 stays candidate-only and bounded to 冷氣維修", () => {
  assert.equal(MESSAGE_PILOT_VERSION, "hanyao-line-message-pilot-v1");
  assert.equal(MESSAGE_PILOT.status, "CANDIDATE_ONLY");
  assert.equal(MESSAGE_PILOT.pilotCampaign, "冷氣維修");
  assert.equal(MESSAGE_PILOT.landingPath, "/services/ac-repair/");
  assert.equal(MESSAGE_PILOT.googleAdsMutationApplied, false);
  assert.equal(MESSAGE_PILOT.dispatchGate, "HG-ADS-MESSAGE-PILOT");
});

test("LINE beta route is explicitly UI-gated because v25 API does not expose LINE provider", () => {
  assert.equal(MESSAGE_PILOT.provider.uiPlatform, "LINE");
  assert.equal(MESSAGE_PILOT.provider.lineId, "@451vpomq");
  assert.equal(MESSAGE_PILOT.provider.apiV25LineProviderSupported, false);
  assert.equal(MESSAGE_PILOT.provider.mutationRoute, "GOOGLE_ADS_UI_ONLY_AFTER_HUMAN_GATE");
  assert.match(MESSAGE_PILOT.provider.evidenceClass, /REQUIRES_FRESH_RECHECK/);
});

test("site keeps an exact LINE verification link on the advertised domain", () => {
  const site = read("src/data/site.ts");
  assert.match(site, /lineUrl:\s*"https:\/\/line\.me\/R\/ti\/p\/@451vpomq"/);

  const header = read("src/components/Header.tsx");
  const footer = read("src/components/Footer.tsx");
  const hero = read("src/components/LandingHero.tsx");
  assert.match(header, /siteConfig\.lineUrl/);
  assert.match(footer, /siteConfig\.lineUrl/);
  assert.match(hero, /siteConfig\.lineUrl/);
});

test("starter candidates are bounded service messages without unsupported promises", () => {
  assert.equal(MESSAGE_PILOT.starterMessageCandidates.length, 2);
  for (const message of MESSAGE_PILOT.starterMessageCandidates) {
    assert.ok(message.length > 0);
    assert.ok(message.length <= 100, `starter candidate unexpectedly long: ${message}`);
    assert.match(message, /冷氣/);
    assert.doesNotMatch(message, /免費|保證|最低價|立即到場|當天到場|24\s*小時|終身保固/);
  }
});

test("Message goals remain isolated from canonical HY conversion", () => {
  assert.equal(MESSAGE_PILOT.canonicalConversion.name, "HY - Verified LINE Contact");
  assert.equal(MESSAGE_PILOT.canonicalConversion.conversionActionId, "7674301565");
  assert.equal(MESSAGE_PILOT.canonicalConversion.mustRemainPrimary, false);
  assert.equal(MESSAGE_PILOT.canonicalConversion.messageAssetEventsMayWriteCanonicalConversion, false);
  assert.equal(MESSAGE_PILOT.googleMessageGoal.mayReplaceCanonicalIdentity, false);
  assert.equal(MESSAGE_PILOT.googleMessageGoal.mayBecomePrimaryWithoutSeparateHumanApproval, false);
  assert.equal(MESSAGE_PILOT.googleMessageGoal.mayChangeCampaignOptimizationSetWithoutSeparateHumanApproval, false);
});

test("pilot fails closed on bid-strategy coercion and preserves frozen levers", () => {
  assert.equal(MESSAGE_PILOT.biddingSafeguard.allowedToChangeBiddingInPilotSetup, false);
  assert.equal(MESSAGE_PILOT.biddingSafeguard.stopIfUiRequiresConversionBasedBidding, true);
  assert.match(MESSAGE_PILOT.biddingSafeguard.fallback, /REQUIRES_SEPARATE_BUDGET_AND_STRATEGY_APPROVAL/);

  for (const frozen of [
    "budget",
    "bidding strategy",
    "HY - Verified LINE Contact identity",
    "HY - Verified LINE Contact Primary status",
    "broad match expansion",
    "AI Max",
    "fake HY token",
    "message click -> HY verified conversion",
  ]) {
    assert.ok(MESSAGE_PILOT.prohibitedMutations.includes(frozen as never));
  }
});

test("serving and measurement caveats prevent inflated pilot claims", () => {
  assert.equal(MESSAGE_PILOT.servingCaveats.android, "GLOBALLY_ELIGIBLE");
  assert.equal(MESSAGE_PILOT.servingCaveats.iosTaiwan, "NOT_IN_CURRENT_ELIGIBLE_COUNTRY_LIST");
  assert.equal(MESSAGE_PILOT.servingCaveats.otherAssetsCanServeWithMessageButtonAtSameTime, false);
  assert.equal(MESSAGE_PILOT.measurement.messageClicksAreVerifiedContacts, false);
  assert.equal(MESSAGE_PILOT.measurement.canonicalKpi, "TOTAL_REAL_CONTACTS");
  assert.equal(MESSAGE_PILOT.measurement.sampleRuleSource, "HANYAO_PLAN_HEURISTIC_NOT_GOOGLE_PLATFORM_RULE");
  assert.ok(MESSAGE_PILOT.measurement.requiredBreakouts.includes("call clicks / tracked calls"));
  assert.ok(MESSAGE_PILOT.measurement.requiredBreakouts.includes("iOS visibility or absence"));
});

test("provider prestate must be fresh before the human-gated dispatch", () => {
  assert.ok(MESSAGE_PILOT.providerPrestateRequired.includes("advertiser verification status"));
  assert.ok(MESSAGE_PILOT.providerPrestateRequired.includes("message asset beta eligibility still present"));
  assert.ok(MESSAGE_PILOT.providerPrestateRequired.includes("current campaign bidding strategy"));
  assert.ok(MESSAGE_PILOT.providerPrestateRequired.includes("current campaign conversion goals and optimization set"));
  assert.ok(MESSAGE_PILOT.providerPrestateRequired.includes("current call / lead-form asset associations"));
  assert.ok(MESSAGE_PILOT.providerPrestateRequired.includes("existing message asset inventory"));
});

test("candidate module contains no Google Ads mutation transport", () => {
  const source = read("scripts/ads-line-message-pilot.ts");
  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /:mutate|mutate[A-Z]|mutate_/i);
});
