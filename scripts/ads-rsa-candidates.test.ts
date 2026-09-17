import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  RSA_CANDIDATES,
  RSA_CANDIDATE_VERSION,
  RSA_ROLLOUT_CONTRACT,
} from "./ads-rsa-candidates.ts";

// Google Ads counts each character in double-width languages such as Chinese as
// two characters toward RSA text limits. Treat ASCII as one unit and all
// non-ASCII code points in this bounded Traditional-Chinese copy set as two.
const googleAdsCharacterUnits = (value: string): number =>
  Array.from(value).reduce((total, char) => total + (char.codePointAt(0)! <= 0x7f ? 1 : 2), 0);

const forbiddenClaims = [
  "免費",
  "保證",
  "最低價",
  "24小時",
  "24 小時",
  "立即到場",
  "當天到場",
  "終身保固",
];

const expectedLandingPaths = new Map([
  ["冷氣維修", "/services/ac-repair/"],
  ["冷氣清洗保養", "/services/ac-cleaning/"],
  ["冷氣安裝", "/services/ac-installation/"],
  ["商用工程", "/services/commercial-ac/"],
]);

test("WP03 exposes four bounded campaign templates and remains candidate-only", () => {
  assert.equal(RSA_CANDIDATE_VERSION, "hanyao-rsa-v1");
  assert.equal(RSA_CANDIDATES.length, 4);
  assert.equal(new Set(RSA_CANDIDATES.map((entry) => entry.campaign)).size, 4);
  assert.equal(RSA_ROLLOUT_CONTRACT.status, "CANDIDATE_ONLY");
  assert.equal(RSA_ROLLOUT_CONTRACT.googleAdsMutationApplied, false);
  assert.equal(RSA_ROLLOUT_CONTRACT.publishGate, "HG-ADS-RSA");
});

test("every campaign has differentiated A/B RSA copy within Google text limits", () => {
  for (const campaign of RSA_CANDIDATES) {
    assert.equal(campaign.landingPath, expectedLandingPaths.get(campaign.campaign));
    assert.ok(campaign.landingPromise.length >= 2);
    assert.equal(campaign.variants.length, 2);
    assert.notEqual(campaign.variants[0].valueProposition, campaign.variants[1].valueProposition);

    const campaignHeadlines = new Set<string>();
    for (const variant of campaign.variants) {
      assert.ok(variant.headlines.length >= 8 && variant.headlines.length <= 15);
      assert.ok(variant.descriptions.length >= 2 && variant.descriptions.length <= 4);
      assert.equal(new Set(variant.headlines).size, variant.headlines.length);
      assert.equal(new Set(variant.descriptions).size, variant.descriptions.length);

      for (const headline of variant.headlines) {
        assert.ok(
          googleAdsCharacterUnits(headline) <= 30,
          `${campaign.campaign}/${variant.id} headline too long: ${headline}`
        );
        assert.doesNotMatch(headline, /LINE/i, `${campaign.campaign}/${variant.id} headline must stay Message-Asset compatible`);
        assert.equal(campaignHeadlines.has(headline), false, `${campaign.campaign} A/B duplicate headline: ${headline}`);
        campaignHeadlines.add(headline);
        for (const claim of forbiddenClaims) assert.equal(headline.includes(claim), false, `forbidden claim in headline: ${headline}`);
      }

      for (const description of variant.descriptions) {
        assert.ok(
          googleAdsCharacterUnits(description) <= 90,
          `${campaign.campaign}/${variant.id} description too long: ${description}`
        );
        for (const claim of forbiddenClaims) assert.equal(description.includes(claim), false, `forbidden claim in description: ${description}`);
      }
    }
  }
});

test("candidate source contains no provider mutation or hidden rollout path", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "scripts/ads-rsa-candidates.ts"), "utf8");
  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /:mutate|mutate[A-Z]|mutate_/i);
  assert.doesNotMatch(source, /campaignBudget|targetCpa|primaryForGoal/i);
});

test("rollout contract requires fresh live ad inventory before any publish step", () => {
  assert.deepEqual(RSA_ROLLOUT_CONTRACT.requiredLivePrestate, [
    "enabled ad groups",
    "enabled RSA inventory",
    "Ad Strength and feedback",
    "final URLs",
  ]);
  assert.ok(RSA_ROLLOUT_CONTRACT.prohibitedChanges.includes("budget"));
  assert.ok(RSA_ROLLOUT_CONTRACT.prohibitedChanges.includes("bidding strategy"));
  assert.ok(RSA_ROLLOUT_CONTRACT.prohibitedChanges.includes("Primary conversion goal"));
  assert.ok(RSA_ROLLOUT_CONTRACT.prohibitedChanges.includes("broad match expansion"));
  assert.ok(RSA_ROLLOUT_CONTRACT.prohibitedChanges.includes("AI Max"));
});
