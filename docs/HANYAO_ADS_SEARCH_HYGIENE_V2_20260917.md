# HANYAO Ads Search Hygiene v2 — Cross-campaign candidate contract

Status: implementation candidate only; Google Ads mutation count = 0.

## Purpose

Complete WP02 section 8.3 from `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917` without broad negatives or automatic provider writes.

The audit continues to use the visible Search Terms report as evidence, but now classifies a term in the context of its current campaign so clearly misrouted service demand can be proposed as an ad-group scoped exact-negative candidate.

## Campaign routing

- `冷氣維修`: clear cleaning or installation intent can become an exact-negative candidate.
- `冷氣清洗保養`: clear repair/fault or installation intent can become an exact-negative candidate.
- `冷氣安裝`: clear repair/fault or cleaning intent can become an exact-negative candidate.
- `商用工程`: only explicit residential intent such as 家用/住家/住宅/房間/套房冷氣 can become an exact-negative candidate.

## Fail-safe boundaries

- Mixed service intent is `KEEP_REVIEW`, not auto-excluded. Example: a query containing both cleaning and leak/repair signals may represent a genuine diagnostic/replacement need.
- Global Tier A brand-bound navigational and Tier B clearly non-service candidates remain exact-only.
- Tier C price/recommendation/review intent is not globally treated as low quality. It may become a cross-campaign exact candidate only when the service category is unambiguous and mismatched to the current campaign.
- Unknown campaign names preserve the global classifier result.
- Candidate scope remains `AD_GROUP` and match type remains `EXACT`.
- No campaign-level broad negative is generated.
- No Google Ads mutation endpoint exists in the audit tooling.
- Detailed search terms remain file-output-only when explicitly requested; default stdout is metadata/counts only.

## Live execution gate

The production service-account credential remains stored as a Cloudflare Worker Secret. The current ChatGPT tool surface does not expose that secret or a connected Google Ads provider capable of executing the live SearchStream query, so live 14-day candidate generation remains a provider/OAuth connection gate. This document does not claim fresh live search-term results.
