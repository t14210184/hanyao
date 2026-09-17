import test from "node:test";
import assert from "node:assert/strict";
import { classifySearchTerm } from "./ads-search-hygiene-rules.ts";

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
