import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("WP03 provider engine is bounded to staged RSA AdGroupAd mutation", async () => {
  const source = await readFile("scripts/ads-rsa-provider.ts", "utf8");
  const contract = await readFile("scripts/ads-rsa-provider-contract.ts", "utf8");

  assert.match(source, /adGroupAds:mutate/);
  assert.match(source, /googleAds:searchStream/);
  assert.match(source, /ADS_RSA_EXPECTED_PLAN_HASH/);
  assert.match(source, /ADS_RSA_PRODUCTION_GATE/);
  assert.match(source, /WP03_RSA_CREATE_PARTIAL_OR_AMBIGUOUS/);
  assert.match(source, /WP03_RSA_ENABLE_PARTIAL_OR_AMBIGUOUS/);
  assert.match(source, /retryAllowed:\s*false/);

  assert.match(contract, /status:\s*"PAUSED"/);
  assert.match(contract, /status:\s*"ENABLED"/);
  assert.match(contract, /partialFailure:\s*false/);
  assert.match(contract, /validateOnly/);
  assert.match(contract, /updateMask:\s*"status"/);
  assert.match(contract, /"GOOD",\s*"EXCELLENT"/);
  assert.match(contract, /approvalStatus !== "APPROVED"/);

  const combined = source + "\n" + contract;
  assert.doesNotMatch(combined, /campaignBudgets:mutate/i);
  assert.doesNotMatch(combined, /campaigns:mutate/i);
  assert.doesNotMatch(combined, /adGroups:mutate/i);
  assert.doesNotMatch(combined, /adGroupCriteria:mutate/i);
  assert.doesNotMatch(combined, /conversionActions:mutate/i);
  assert.doesNotMatch(combined, /campaignConversionGoals:mutate/i);
  assert.doesNotMatch(combined, /customerConversionGoals:mutate/i);
  assert.doesNotMatch(combined, /biddingStrategies:mutate/i);
  assert.doesNotMatch(combined, /assets:mutate/i);
  assert.doesNotMatch(combined, /campaignAssets:mutate/i);
  assert.doesNotMatch(combined, /AI_MAX|broad match expansion/i);
  assert.doesNotMatch(combined, /\bremove\s*:/i);
});

test("WP03 never automatically enables a newly created RSA in the create body", async () => {
  const contract = await readFile("scripts/ads-rsa-provider-contract.ts", "utf8");
  const createStart = contract.indexOf("export const buildWp03CreateMutateBody");
  const enableStart = contract.indexOf("export const buildWp03EnablePlan");
  assert.ok(createStart >= 0 && enableStart > createStart);
  const createSection = contract.slice(createStart, enableStart);
  assert.match(createSection, /status:\s*"PAUSED"/);
  assert.doesNotMatch(createSection, /status:\s*"ENABLED"/);
});
