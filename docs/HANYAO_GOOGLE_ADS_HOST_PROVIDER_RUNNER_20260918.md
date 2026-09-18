# HANYAO Google Ads Host Provider Runner — 2026-09-18

Status: `PROVIDER_RUNNER_CANDIDATE / NO_PROVIDER_MUTATION_BY_SOURCE_MERGE`

Scope: `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917`

## Purpose

This runner is the HANYAO-owned bridge between the governed Factory MCP host
execution capability and the already-merged WP02/WP03 Google Ads provider
engines.

It does not implement Google Ads REST mutation itself.

The runtime path is:

```text
fresh HANYAO main SHA
→ governed Factory MCP host_powershell
→ SYSTEM-only HANYAO runner
→ existing gcloud configuration discovery
→ fixed service-account impersonation
→ short-lived adwords-scope access token
→ exact immutable HANYAO source archive
→ existing WP02/WP03 Node provider engine
→ existing validateOnly / plan-hash / one-shot mutation / same-source readback
```

## Fixed provider identity

```text
service account =
xusen-data-manager-uploader@xusen-ads-conversion.iam.gserviceaccount.com

OAuth scope =
https://www.googleapis.com/auth/adwords
```

The runner never prints the access token and never writes it to disk. The token
is injected only into the child Node process through
`GOOGLE_ADS_ACCESS_TOKEN`.

The runner does not ingest, print, or persist the Production service-account
private key.

## Immutable source

`SourceRef` must be exactly a 40-hex Git commit SHA.

The runner downloads:

```text
https://codeload.github.com/t14210184/hanyao/zip/<exact SHA>
```

Branch names and mutable refs are rejected.

## Modes

Read / planning:

```text
WP02_AUDIT
WP02_DRY_RUN
WP03_DRY_RUN_CREATE
WP03_READ_ENABLE
```

Provider validate-only:

```text
WP02_VALIDATE
WP03_VALIDATE_CREATE
WP03_VALIDATE_ENABLE
```

Shared mutation:

```text
WP02_APPLY
WP03_APPLY_PAUSED
WP03_ENABLE
```

All shared-mutation modes require an exact 64-hex expected plan hash.

They reuse the already-merged production gates:

```text
WP02_APPLY
  HANYAO_WP02_APPROVED_20260918

WP03_APPLY_PAUSED
  HANYAO_WP03_PAUSED_CREATE_APPROVED_20260918

WP03_ENABLE
  HANYAO_WP03_ENABLE_APPROVED_20260918
```

## Evidence boundary

WP02 audit detail is written only to the local HANYAO evidence directory:

```text
%ProgramData%\HANYAO\GoogleAds\evidence
```

Default runner output contains:

- mode;
- exact source SHA;
- SYSTEM execution identity;
- fixed service-account identity and scope;
- number of local gcloud configuration candidates;
- selected candidate index, never its path;
- engine exit code;
- bounded engine stdout/stderr;
- local audit evidence path when applicable;
- explicit `access_token_printed=false`;
- explicit `access_token_persisted=false`.

The temporary source archive and extracted source tree are removed in
`finally`.

## Fresh-session prerequisite

Provider execution begins only after the current governed Factory MCP definition
is loaded by ChatGPT and readback proves:

```text
host_powershell is present
attemptEpoch.minimum >= 1
```

HANYAO must consume the governance-owned Factory MCP capability. It must not
create project-specific execution workflows in the governance repository.

## Frozen boundaries

This runner adds no native transport for:

```text
Google Ads SearchStream
adGroupCriteria:mutate
adGroupAds:mutate
campaign budget
bidding strategy
conversion goals/actions
GTM / GA4
Message Asset
D1 / uploader
broad match
AI Max
```

Those provider operations remain exclusively in their existing bounded HANYAO
engines and contracts.
