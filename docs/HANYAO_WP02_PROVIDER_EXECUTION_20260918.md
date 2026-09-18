# HANYAO WP02 Google Ads Provider Execution — 2026-09-18

Status: `ENGINE_CANDIDATE / PROVIDER_AUTH_PENDING / ADS_MUTATION_NOT_APPLIED`

Scope: `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917` WP02 only.

## Fresh provider probe

GitHub Actions run:

`35308912502`

Exact branch head at probe:

`487cedfdc7129d8d116601b581b4772b678a52dc`

Result:

```text
checkout = PASS
node = PASS
npm ci = PASS
GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON = EMPTY
GOOGLE_ADS_LOGIN_CUSTOMER_ID = EMPTY
ADS_HYGIENE_LIVE_REQUIRED = 1
provider probe = FAIL_CLOSED
error = GOOGLE_ADS_CLOUD_PROJECT_CREDENTIAL_REQUIRED
Google Ads request dispatched = 0
Google Ads mutation dispatched = 0
```

This proves the repository Actions environment does not currently expose the
Google Cloud project credential required by the read-only SearchStream probe.
No credential value was logged or copied.

## Mutation engine

Repository candidate:

- `scripts/ads-search-hygiene-mutate-contract.ts`
- `scripts/ads-search-hygiene-mutate.ts`
- `scripts/ads-search-hygiene-mutate.test.ts`
- `scripts/ads-search-hygiene-mutate-static.test.mjs`

The engine is not attached to push, pull_request, schedule, or cron execution.

### Eligibility

A candidate is mutation-eligible only when all of these are true:

- current Production Search Term evidence exists;
- paid clicks > 0;
- existing campaign-aware classifier returns `NEGATIVE_EXACT`;
- tier is A or B;
- recommended match type is exactly `EXACT`;
- target scope is a numeric ad group;
- search term is not already excluded;
- an active ad-group exact negative with the same normalized text does not
  already exist.

Tier C research/commercial intent remains review-only. Brand + fault intent
remains eligible traffic and is not automatically excluded.

### Shared-write protocol

```text
fresh Search Term read
+ fresh existing-negative read
→ deterministic exact candidate plan
→ SHA-256 exact-target plan hash
→ explicit WP02 Production gate + expected plan hash
→ fresh prestate re-read
→ require same plan hash
→ adGroupCriteria:mutate validateOnly=true
→ dispatch exact batch once with partialFailure=false
→ same-source ad_group_criterion readback
→ CONFIRMED / NOT_APPLIED / PARTIAL_OR_AMBIGUOUS
```

A Production mutate is never automatically retried after dispatch uncertainty.

### Mutation boundary

Allowed:

```text
AdGroupCriterion CREATE
negative = true
keyword.matchType = EXACT
status = ENABLED
adGroup = exact provider resource
```

Forbidden:

```text
campaign budget
bidding strategy
campaign status/settings
positive keyword
conversion goals/actions
HY canonical conversion
broad match
AI Max
Message Asset
GTM/GA4
D1/uploader
```

## Current blocker

The engine still requires a provider execution surface that can obtain the
approved Google Cloud project credential without copying a long-lived private
key into repository code or public logs.

The Production uploader Wrangler contract names
`GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON` as a required Production secret,
but this document does not infer live secret presence from configuration alone.
Provider secret presence and Google Ads authorization must be confirmed by a
fresh same-source execution before any WP02 Ads mutation.

## Official Google Ads API references

- https://developers.google.com/google-ads/api/reference/rpc/v25/MutateAdGroupCriteriaRequest
- https://developers.google.com/google-ads/api/docs/mutating/service-mutates
- https://developers.google.com/google-ads/api/fields/v25/ad_group_criterion
