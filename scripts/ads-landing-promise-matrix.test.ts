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
