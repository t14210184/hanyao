import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("WP02 provider engine is bounded to ad-group negative keyword mutation", async () => {
  const source = await readFile("scripts/ads-search-hygiene-mutate.ts", "utf8");
  const contract = await readFile(
    "scripts/ads-search-hygiene-mutate-contract.ts",
    "utf8"
  );

  assert.match(source, /adGroupCriteria:mutate/);
  assert.match(contract, /partialFailure:\s*false/);
  assert.match(contract, /validateOnly/);
  assert.match(source, /ADS_HYGIENE_EXPECTED_PLAN_HASH/);
  assert.match(source, /ADS_HYGIENE_PRODUCTION_GATE/);
  assert.match(source, /WP02_MUTATION_PARTIAL_OR_AMBIGUOUS/);
  assert.match(source, /retryAllowed:\s*false/);

  assert.doesNotMatch(source, /campaignBudgets:mutate/i);
  assert.doesNotMatch(source, /campaigns:mutate/i);
  assert.doesNotMatch(source, /adGroups:mutate/i);
  assert.doesNotMatch(source, /conversionActions:mutate/i);
  assert.doesNotMatch(source, /campaignConversionGoals:mutate/i);
  assert.doesNotMatch(source, /customerConversionGoals:mutate/i);
  assert.doesNotMatch(source, /biddingStrategies:mutate/i);
  assert.doesNotMatch(source, /assetGroups:mutate/i);
  assert.doesNotMatch(source, /AI_MAX|broad match expansion/i);
});

test("WP02 live probe workflow is manual evidence tooling, never push-triggered mutation", async () => {
  const source = await readFile(
    ".github/workflows/wp02-live-provider-probe.yml",
    "utf8"
  );
  assert.match(source, /workflow_dispatch:/);
  assert.doesNotMatch(source, /\n\s*push:/);
  assert.match(source, /ADS_HYGIENE_LIVE_REQUIRED:\s*"1"/);
  assert.match(source, /ads-search-hygiene-audit\.ts/);
  assert.doesNotMatch(source, /ads-search-hygiene-mutate\.ts/);
  assert.doesNotMatch(source, /--apply/);
});
