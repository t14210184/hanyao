import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  classifySearchTerm,
  classifySearchTermForCampaign,
  inferCampaignIntent,
} from "./ads-search-hygiene-rules.ts";

test("brand-bound customer service query becomes Tier A exact-negative candidate", () => {
  const result = classifySearchTerm("日立 客服 電話");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.tier, "A");
  assert.equal(result.matchedBrand, "日立");
  assert.equal(result.recommendedMatchType, "EXACT");
});

test("brand-bound repair-phone navigation query is excluded exactly", () => {
  const result = classifySearchTerm("東元冷氣維修電話");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.tier, "A");
});

test("brand plus real fault intent is retained", () => {
  const result = classifySearchTerm("大金 冷氣 不冷");
  assert.equal(result.action, "KEEP");
  assert.equal(result.recommendedMatchType, null);
});

test("generic repair phone query is never auto-negative", () => {
  const result = classifySearchTerm("冷氣維修電話");
  assert.equal(result.action, "REVIEW_NAVIGATION");
  assert.equal(result.recommendedMatchType, null);
});

test("price intent remains eligible for conversion review", () => {
  const result = classifySearchTerm("冷氣維修價格");
  assert.equal(result.action, "KEEP_REVIEW");
  assert.equal(result.tier, "C");
});

test("DIY and teaching intent is a Tier B exact-negative candidate", () => {
  const result = classifySearchTerm("冷氣 DIY 教學");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.tier, "B");
  assert.equal(result.recommendedMatchType, "EXACT");
});

test("parts price remains non-service because parts intent dominates", () => {
  const result = classifySearchTerm("冷氣零件價格");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.tier, "B");
});

test("Panasonic original-factory repair is brand-bound navigation", () => {
  const result = classifySearchTerm("Panasonic 原廠 維修");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.tier, "A");
});

test("brand plus actual leak problem remains eligible", () => {
  const result = classifySearchTerm("國際牌 冷氣漏水");
  assert.equal(result.action, "KEEP");
});

test("single phone concept is not a broad exclusion rule", () => {
  const result = classifySearchTerm("冷氣電話");
  assert.notEqual(result.action, "NEGATIVE_EXACT");
  assert.equal(result.recommendedMatchType, null);
});

test("known active campaign names map to deterministic service intent", () => {
  assert.equal(inferCampaignIntent("冷氣維修"), "REPAIR");
  assert.equal(inferCampaignIntent("冷氣清洗保養"), "CLEANING");
  assert.equal(inferCampaignIntent("冷氣安裝"), "INSTALLATION");
  assert.equal(inferCampaignIntent("商用工程"), "COMMERCIAL");
  assert.equal(inferCampaignIntent("其他"), "UNKNOWN");
});

test("repair campaign can exact-negative clear cleaning intent", () => {
  const result = classifySearchTermForCampaign("冷氣維修", "冷氣清洗費用");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.reason, "CROSS_CAMPAIGN_CLEANING_INTENT");
  assert.equal(result.recommendedMatchType, "EXACT");
});

test("repair campaign can exact-negative clear installation intent", () => {
  const result = classifySearchTermForCampaign("冷氣維修", "冷氣安裝價格");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.reason, "CROSS_CAMPAIGN_INSTALLATION_INTENT");
});

test("cleaning campaign can exact-negative clear repair symptom intent", () => {
  const result = classifySearchTermForCampaign("冷氣清洗保養", "冷氣不冷維修");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.reason, "CROSS_CAMPAIGN_REPAIR_INTENT");
});

test("installation campaign can exact-negative clear cleaning intent", () => {
  const result = classifySearchTermForCampaign("冷氣安裝", "洗冷氣推薦");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.reason, "CROSS_CAMPAIGN_CLEANING_INTENT");
});

test("commercial campaign can exact-negative explicit residential intent", () => {
  const result = classifySearchTermForCampaign("商用工程", "家用冷氣維修");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.reason, "CROSS_CAMPAIGN_RESIDENTIAL_INTENT");
});

test("multi-service search stays review-only instead of being auto-killed", () => {
  const result = classifySearchTermForCampaign("冷氣維修", "冷氣清洗後漏水維修");
  assert.equal(result.action, "KEEP_REVIEW");
  assert.equal(result.reason, "MULTI_SERVICE_INTENT_REVIEW");
  assert.equal(result.recommendedMatchType, null);
});

test("campaign routing does not override a global high-confidence exclusion", () => {
  const result = classifySearchTermForCampaign("冷氣安裝", "日立 客服 電話");
  assert.equal(result.action, "NEGATIVE_EXACT");
  assert.equal(result.reason, "BRAND_BOUND_NAVIGATIONAL_INTENT");
});

test("unknown campaign leaves global classification unchanged", () => {
  assert.deepEqual(
    classifySearchTermForCampaign("未知活動", "冷氣維修價格"),
    classifySearchTerm("冷氣維修價格")
  );
});

test("live audit uses Cloud-project OAuth access and stays search-only", async () => {
  const auditSource = await readFile(
    new URL("./ads-search-hygiene-audit.ts", import.meta.url),
    "utf8"
  );

  assert.match(auditSource, /GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON/);
  assert.match(auditSource, /authorization:\s*`Bearer \$\{auth\.accessToken\}`/);
  assert.doesNotMatch(auditSource, /GOOGLE_ADS_DEVELOPER_TOKEN/);
  assert.doesNotMatch(auditSource, /["']developer-token["']\s*:/);
  assert.match(auditSource, /googleAds:searchStream/);
  assert.match(auditSource, /classifySearchTermForCampaign\(campaignName, searchTerm\)/);
  assert.match(auditSource, /hanyao-search-hygiene-v2/);
  assert.match(auditSource, /AUDIT_COMPLETE_NO_MUTATION/);
  assert.doesNotMatch(
    auditSource,
    /googleAds:mutate|adGroupCriteria:mutate|campaignCriteria:mutate/i,
    "search-hygiene audit must not contain a Google Ads mutation endpoint"
  );
});
