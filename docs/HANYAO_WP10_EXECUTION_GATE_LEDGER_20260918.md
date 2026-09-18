# HANYAO WP10 — Current Execution / Provider Gate Ledger — 2026-09-18

Status: `CURRENT_STATE_CANDIDATE / PROVIDER_TRUTH_REQUIRES_FRESH_SAME_SOURCE_READBACK`

Baseline main:

`272e7fc513fb4c76de9cf89b92abba42e15d2e4e`

Scope:

`HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917`

This ledger is a repository projection only. It does not replace Google Ads,
Google Tag Manager, Google Analytics, Cloudflare, D1, Data Manager, or the
authenticated Google Ads UI as provider truth.

## Current work-package state

| WP | Current state | What is actually complete | What is not claimed |
|---|---|---|---|
| WP00 | Production source PASS | Baseline/scope evidence and protected CI path exist | Historical provider facts are not treated as current |
| WP01 | Production source PASS / provider apply pending | Website dataLayer diagnostics are live; isolated GTM bridge is merged and regression-gated | GTM live publish and GA4 Admin custom-dimension configuration are not applied |
| WP02 | Production source PASS / provider apply pending | Search-hygiene rules and fail-closed exact-negative mutation engine are merged | No fresh Google Ads provider read or negative-keyword mutation has been applied |
| WP03 | Production source PASS / provider apply pending | Four-campaign RSA A/B matrix and staged PAUSED-create / gated-enable provider engine are merged | No fresh RSA inventory read; no RSA create or enable mutation has been applied |
| WP04 | Production PASS | Repair CRO and service-aware mobile sticky CTA are live | No Ads budget/bidding mutation |
| WP05 | Production source PASS / provider UI pending | Candidate isolation, API read-only preflight, UI evidence contract and post-merge readiness are PASS | No authenticated UI prestate; LINE Message Asset association is not applied |
| WP06 | Production PASS | Mobile performance baseline and system-font improvement are live; unsupported LCP candidates were rejected | No unproven performance candidate is promoted |
| WP07 | Production PASS | Ads-to-landing promise matrix is live and regression-enforced | No provider Ads claim beyond repository/website evidence |
| WP08 | Production source PASS / observation not started | KPI and 14-day observation contract is merged | Observation clock has not started without a real provider pilot/canonical cycle |
| WP09 | Production source PASS / gate closed | Smart Bidding / AI Max fail-closed gate contract is merged | Current stage remains `S1_TRACKING_PROOF_PENDING`; no strategy/broad-match/AI Max mutation |
| WP10 | Current candidate | This current-state ledger and regressions | Ledger itself does not perform provider mutation |

## WP01 — funnel observability / GTM / GA4

Production website diagnostics now expose only bounded analytics dimensions:

```text
service_type
prepare_status
handoff_type
landing_path
campaign_id (only when existing utm_id is numeric)
```

The website path never sends HY token, request ID, raw click IDs, session ID,
raw LINE user ID, name, phone, or message text to the diagnostic analytics
event.

The fail-closed GTM bridge is merged. It supports a dedicated WP01 workspace,
fresh live-container read, exact target tag identity, provider fingerprint
checks, bounded apply/publish, and post-publish live readback.

Current truthful boundary:

```text
WEBSITE_DATALAYER = PRODUCTION_PASS
GTM_BRIDGE_SOURCE = PRODUCTION_PASS
GTM_LIVE_PUBLISH = NOT_APPLIED
GA4_ADMIN_CUSTOM_DIMENSIONS = NOT_APPLIED
BLOCKER = authenticated GTM / GA4 provider control is unavailable in the current execution surface
```

## WP02 — Search Hygiene

Production-source code now contains:

- campaign-aware Search Term classification;
- paid-click evidence requirement;
- Tier A/B exact-negative eligibility only;
- ad-group exact scope only;
- existing negative inventory de-duplication;
- deterministic exact target plan hash;
- `validateOnly=true`;
- one-shot atomic dispatch with `partialFailure=false`;
- same-source `ad_group_criterion` readback;
- explicit `CONFIRMED / NOT_APPLIED / PARTIAL_OR_AMBIGUOUS` handling;
- no blind retry after ambiguous dispatch.

Fresh authorization evidence:

```text
Google Ads GitHub probe = 35324074635
  GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON = absent
  GOOGLE_ADS_LOGIN_CUSTOMER_ID = absent

Cloudflare provider-surface probe = 35324102187
Independent Hardening probe = 35309857197
  CLOUDFLARE_API_TOKEN / CF_API_TOKEN = absent
  CLOUDFLARE_ACCOUNT_ID / CF_ACCOUNT_ID = absent
```

Therefore:

```text
WP02_ENGINE = PRODUCTION_SOURCE_PASS
WP02_FRESH_PROVIDER_READ = NOT_APPLIED
WP02_NEGATIVE_MUTATION = NOT_APPLIED
BLOCKER = provider control credential unavailable in current execution surface
```

No private key or Worker secret value was copied into GitHub or logs.

## WP03 — RSA A/B

The merged provider engine is staged:

### Stage 1

```text
fresh campaign/ad-group/RSA inventory
→ exact target resolution
→ exact A/B plan hash
→ validateOnly
→ create candidates PAUSED only
→ same-source readback
```

### Stage 2

```text
exact A/B identity
+ Ad Strength GOOD/EXCELLENT
+ policy APPROVED
→ exact enable plan hash
→ validateOnly
→ update exact resource status only
→ same-source readback
```

The engine never pauses, removes, edits or replaces current serving ads.

Current truthful boundary:

```text
WP03_CANDIDATE_MATRIX = PRODUCTION_SOURCE_PASS
WP03_PROVIDER_ENGINE = PRODUCTION_SOURCE_PASS
WP03_FRESH_RSA_INVENTORY = NOT_APPLIED
WP03_PAUSED_CREATE = NOT_APPLIED
WP03_ENABLE = NOT_APPLIED
BLOCKER = Google Ads provider credential unavailable in current execution surface
```

## WP04 / WP07 — website conversion promise

The paid-service website now has:

- repair high-intent mobile LINE CTA priority;
- simplified repair first screen;
- cleaning model-photo / unit-count first-screen promise;
- service-aware mobile sticky CTA for repair, cleaning, installation and commercial;
- Ads-to-landing promise regression covering all four Search campaign lanes.

These website changes are already in Production.

## WP05 — LINE Message Asset pilot

Repository-side preparation is complete:

- pilot isolation contract;
- read-only API preflight v2;
- exact `冷氣維修` campaign scope;
- exact Line ID `@451vpomq`;
- authenticated-UI evidence schema;
- fresh prestate hash/gate;
- frozen bidding / optimization-set / Call+Lead-Form association / HY canonical-conversion checks;
- post-save policy + LINE verification state;
- exact rollback identity preserving reporting history.

After the WP05 merge, Production readiness initially failed on TypeScript
control-flow narrowing. The bounded repair sequence completed and the final
main readback is:

```text
main baseline before this ledger refresh = 272e7fc513fb4c76de9cf89b92abba42e15d2e4e
readiness = PASS
Cloudflare Pages Production = SUCCESS
```

This does **not** mean the Message Asset itself is live.

Current truthful boundary:

```text
WP05_UI_CONTRACT = PRODUCTION_SOURCE_PASS
WP05_AUTHENTICATED_UI_PRESTATE = NOT_APPLIED
WP05_MESSAGE_ASSET_ASSOCIATION = NOT_APPLIED
WP05_MESSAGE_ASSET_PILOT_ACTIVE = false
BLOCKER = authenticated Google Ads UI is unavailable in current execution surface
```

## WP06 — performance

The system-font change that removed the large CJK webfont burden was accepted
into Production. Later LCP candidates were not merged when same-window
immutable A/B failed to prove material benefit.

Therefore WP06 does not keep optimizing merely to create code churn.

## WP08 — KPI / observation

The KPI contract is merged for:

- verified LINE contacts / 100 paid clicks;
- cost / verified LINE contact;
- qualified / verified;
- won job / qualified;
- Message Asset CTR;
- cost / Message Asset click;
- Leads from Messages;
- manual real-conversation rate;
- qualified-conversation rate;
- phone-lead, irrelevant-chat, prepare-failure, profile-fallback, search-waste and reconciliation guardrails.

Observation:

```text
minimum window after real start = 14 days
preferred Message Asset clicks = 100 when traffic permits
100 clicks = HANYAO planning heuristic, not a Google platform hard rule
current observation state = NOT_STARTED
```

The clock starts only after a real provider pilot or canonical conversion cycle
is active and a fresh baseline is captured.

## WP09 — Smart Bidding / AI Max

Current stage remains:

`S1_TRACKING_PROOF_PENDING`

Current forbidden promotions:

- account-wide bidding-strategy switch;
- tCPA rollout without its later gate;
- Primary promotion of `HY - Verified LINE Contact` before later gate;
- account-wide broad-match expansion;
- account-wide AI Max enablement.

Repository completion alone cannot advance WP09.

## Current external provider blockers

```text
WP01_GTM_PROVIDER_AUTH
WP02_GOOGLE_ADS_CONTROL_CREDENTIAL
WP03_GOOGLE_ADS_CONTROL_CREDENTIAL
WP05_AUTHENTICATED_GOOGLE_ADS_UI
GENUINE_CANONICAL_E2E_PROVIDER_PROOF
```

These are external control/provider gates, not unresolved repository coding
tasks.

## Legal next transitions

1. WP01: authenticated GTM live dry-run → isolated apply → publish → live readback; then GA4 Admin readback/config with exact property identity.
2. WP02: fresh Search Terms + existing-negative prestate → validateOnly → exact-negative dispatch once → same-source readback.
3. WP03: fresh campaign/ad-group/RSA inventory → PAUSED exact A/B create → readback → policy/Ad Strength gate → exact enable.
4. WP05: fresh authenticated Google Ads UI prestate → exact hash/gate → one bounded 冷氣維修 LINE Message Asset association → fresh UI poststate.
5. WP08/WP09: only after a real provider pilot/canonical cycle starts, capture baseline and begin observation.

## Supersession

PR #49 was created against old main
`14669a8f5107c42b5f1e6ed148480aa58fa0b094` and is no longer authoritative.

This WP10 v2 ledger supersedes it and must be read against fresh provider truth,
not used to overwrite provider state.
