# HANYAO WP02 Cloudflare Provider Surface Evidence — 2026-09-18

Status: `BLOCKED_NO_GITHUB_CLOUDFLARE_CONTROL_CREDENTIAL / NO_PROVIDER_MUTATION`

Scope: `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917` WP02 provider execution only.

## Purpose

Determine whether the approved Google Cloud project credential already stored as a
Production Worker secret can be reused without copying the long-lived service-account
private key into GitHub Actions.

The intended safe route was:

```text
GitHub Actions Cloudflare control credential
→ read Production Worker secret names only
→ confirm GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON exists
→ upload an un-deployed Worker version / preview
→ reuse env secret inside Worker
→ Google Ads fresh read-only provider probe
→ only then consider bounded WP02 mutation
```

No step may expose a secret value.

## Same-source evidence

### Probe A — dedicated provider-surface workflow

Workflow run: `35309818381`

Job: `105489338751`

```text
Checkout = PASS
Node setup = PASS
npm ci = PASS
Cloudflare auth resolver = FAIL
error = WP02_CF_PROVIDER_SURFACE=FAIL:CLOUDFLARE_API_TOKEN_MISSING
wrangler secret list dispatched = 0
Google credential value read = 0
Google Ads request dispatched = 0
Google Ads mutation dispatched = 0
```

### Probe B — existing Hardening workflow temporary read-only hook

Workflow run: `35309857197`

Job: `105489458000`

```text
WP02 read Production Worker secret names only = FAIL
error = WP02_CF_PROVIDER_SURFACE=FAIL:CLOUDFLARE_API_TOKEN_MISSING
Cloudflare Worker mutation = 0
Google Ads mutation = 0
```

The temporary Hardening hook was removed immediately after evidence collection.

## Current authorization topology

Fresh evidence proves:

```text
GitHub Actions:
  GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON = absent
  CLOUDFLARE_API_TOKEN / CF_API_TOKEN = absent

Production uploader Worker:
  configuration declares GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON as required
  but live secret presence was NOT independently read in this run
```

A Wrangler configuration declaration is not accepted as proof that a live secret
currently exists.

## Safety decision

Do not:

- copy a service-account private key into repository code;
- print or export Worker secret values;
- create a public diagnostic endpoint on the currently deployed Production version;
- replace or redeploy the active uploader Worker merely to obtain credentials;
- blind-run Google Ads mutation without fresh provider prestate.

The repository keeps a manual-only workflow:

`.github/workflows/wp02-cloudflare-provider-surface.yml`

It can be re-run after a bounded Cloudflare API token/account ID becomes available.
The workflow reads secret names only and performs no mutation.

## WP02 state

```text
WP02_CLASSIFICATION_RULES = PRODUCTION_SOURCE_PASS
WP02_MUTATION_ENGINE = PRODUCTION_SOURCE_PASS
WP02_PROVIDER_LIVE_READ = BLOCKED_BY_CONTROL_CREDENTIAL
WP02_GOOGLE_ADS_MUTATION = NOT_APPLIED
WP02_SAME_SOURCE_READBACK = NOT_APPLICABLE_UNTIL_DISPATCH
```

The blocking requirement is control-plane authorization, not a code defect.
