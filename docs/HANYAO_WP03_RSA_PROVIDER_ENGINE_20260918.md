# HANYAO WP03 RSA Provider Engine — 2026-09-18

Status: `ENGINE_CANDIDATE / PROVIDER_AUTH_PENDING / RSA_MUTATION_NOT_APPLIED`

Scope: `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917` WP03 only.

## Purpose

Turn the already-merged bounded RSA A/B candidate matrix into a provider-safe
execution path without replacing or pausing the currently serving ads.

The engine uses two explicit stages:

```text
Stage 1
fresh campaign/ad-group/RSA inventory
→ exact target resolution
→ exact A/B create plan
→ plan hash
→ validateOnly=true
→ create candidates as PAUSED only
→ same-source RSA readback

Stage 2
fresh exact candidate readback
→ require both A/B identities
→ require ad_strength = GOOD or EXCELLENT
→ require policy approval = APPROVED
→ exact enable plan hash
→ validateOnly=true
→ update only status=ENABLED
→ same-source RSA readback
```

Existing ads are never paused, removed, replaced, or edited by this engine.

## Targeting contract

Supported Search campaigns remain:

```text
冷氣維修
冷氣清洗保養
冷氣安裝
商用工程
```

Automatic target resolution is allowed only if each campaign has exactly one
enabled ad group.

If any campaign has more than one enabled ad group, the engine fails closed and
requires an explicit exact target manifest:

```json
[
  {"campaignName":"冷氣維修","adGroupId":"1234567890"}
]
```

The manifest can only select a currently enabled ad group that belongs to the
exact campaign. It cannot invent or create campaign/ad-group topology.

## Landing URL boundary

Each candidate uses the already-merged WP03/WP07 promise-matrix landing path:

```text
冷氣維修       → https://www.xusen.pro/services/ac-repair/
冷氣清洗保養   → https://www.xusen.pro/services/ac-cleaning/
冷氣安裝       → https://www.xusen.pro/services/ac-installation/
商用工程       → https://www.xusen.pro/services/commercial-ac/
```

If a target ad group already has enabled RSA final URLs and those URLs do not
converge to the expected WP07 landing URL, create fails closed instead of
silently changing the landing destination.

## Provider readback

Fresh Google Ads v25 inventory reads:

```text
campaign.id/name/status
ad_group.id/name/status
ad_group_ad.resource_name/status
ad_group_ad.ad.id
ad_group_ad.ad_strength
ad_group_ad.action_items
ad_group_ad.policy_summary.approval_status
ad_group_ad.policy_summary.review_status
ad_group_ad.primary_status
ad_group_ad.ad.final_urls
responsive_search_ad.headlines
responsive_search_ad.descriptions
```

Exact-copy identity is based on:

```text
ad_group_id
final_url
ordered headline text
ordered description text
```

An exact existing A/B candidate is idempotently skipped. Duplicate exact
candidate identity fails closed.

## Shared-write protocol

### PAUSED create

```text
fresh read
→ deterministic create plan
→ SHA-256 exact-target plan hash
→ WP03 create gate + expected plan hash
→ fresh prestate re-read
→ same hash required
→ adGroupAds:mutate validateOnly=true
→ exact batch dispatch once, partialFailure=false
→ SearchStream same-source readback
→ CONFIRMED / NOT_APPLIED / PARTIAL_OR_AMBIGUOUS
```

New ads are created with:

```text
status = PAUSED
```

### Enable

Enable is a separate transaction and requires:

```text
exact A candidate exists once
exact B candidate exists once
ad_strength in {GOOD, EXCELLENT}
policy approval = APPROVED
current status in {PAUSED, ENABLED}
```

The only update body allowed is:

```text
resource_name = exact ad-group-ad resource
status = ENABLED
update_mask = status
```

Existing serving ads remain untouched.

## Frozen boundaries

The engine contains no transport for:

```text
campaign budget
campaign settings
bidding strategy
ad-group mutation
keyword / negative-keyword mutation
conversion goal/action
HY canonical conversion
Business Message asset
GTM / GA4
D1 / uploader
broad match
AI Max
```

## Current provider blocker

WP02 same-source evidence already established that the current GitHub Actions
execution surface does not have:

```text
GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON
CLOUDFLARE_API_TOKEN / CF_API_TOKEN
```

Therefore this WP03 increment does not claim a fresh Google Ads inventory read
or RSA Production mutation. The provider engine becomes executable only when a
bounded control surface can obtain the approved Google Cloud project credential
without exposing or copying its private key.

## Official references

- https://developers.google.com/google-ads/api/docs/responsive-search-ads/get-responsive-search-ads
- https://developers.google.com/google-ads/api/docs/responsive-search-ads/create-responsive-search-ads
- https://developers.google.com/google-ads/api/fields/v25/ad_group_ad
- https://developers.google.com/google-ads/api/docs/ads/mutate-ads
- https://developers.google.com/google-ads/api/docs/best-practices/partial-failures
