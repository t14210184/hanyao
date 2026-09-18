# HANYAO WP01 Funnel Observability Contract — 2026-09-18

Status: `WEBSITE_PRODUCTION_PASS / GTM_BRIDGE_CANDIDATE / GTM_PROVIDER_APPLY_PENDING / NO_CANONICAL_CONVERSION_MUTATION`

Scope: `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917` WP01 only.

## Purpose

Make the paid-click to real-LINE-message funnel diagnosable without placing PII, HY tokens, click IDs, raw LINE user IDs, names, phone numbers, or message text in GA4.

## Browser observation event

The existing `line_contact_attempt` event remains the only LINE intent analytics event. This work package adds bounded classification fields:

- `event_source`: existing CTA source classification.
- `service_type`: bounded service identifier such as `ac_repair`, `ac_cleaning`, `ac_installation`, `commercial_ac`.
- `prepare_status`: `success` or `fail`.
- `handoff_type`: `oa_message`, `desktop_qr`, or `profile_fallback`.
- `page_path`: existing first-party path.

GA4 native device dimensions remain the source for device category; no custom fingerprinting is added.

Each accepted LINE intent emits one diagnostic event. Fast double taps remain blocked before prepare by the existing CTA/Form in-flight fences; there is no additional 30-second LINE analytics dedupe because that would make `line_contact_attempts / lead_tokens_issued` inconsistent after a legitimate return/retry. Phone-click dedupe remains unchanged.

Forbidden analytics fields remain:

- HY lead token
- request_id
- gclid / gbraid / wbraid
- session_id
- raw LINE userId
- name / phone / form message

## Funnel mapping

The v1.0 ratios remain:

```text
R1 = attribution_sessions / paid_clicks
R2 = lead_tokens_issued / attribution_sessions
R3 = line_contact_attempts / lead_tokens_issued
R4 = token_bearing_line_messages / line_contact_attempts
R5 = MATCHED_ADS / token_bearing_line_messages
R6 = business_conversions / MATCHED_ADS
R7 = DataManager_SUCCESS / conversion_outbox
R8 = Ads_reporting_delta / DataManager_SUCCESS
```

Browser analytics is diagnostic only. D1 / signed LINE webhook / Data Manager / Google Ads provider evidence remains authoritative for R2 and R4-R8.

## Interpretation

- High `prepare_status=fail` => investigate prepare/browser/backend availability before changing landing copy.
- High `prepare_status=success` + low token-bearing LINE messages => investigate post-prepare handoff/send friction.
- Elevated `profile_fallback` => investigate prepare or desktop QR path failures.
- Compare by `service_type`, `event_source`, `page_path`, and GA4 native device category.

## GTM / GA4 boundary

Repository/browser code can expose these fields to `dataLayer`, but they do not become GA4 event parameters until the published GTM `GA4 Event - line_contact_attempt` tag is freshly read, updated, published, and read back.

Therefore:

```text
WEBSITE_DATALAYER_CONTRACT = CANDIDATE
GTM_GA4_PROVIDER_APPLY = REQUIRED
GOOGLE_ADS_CANONICAL_SENDER_CHANGE = 0
```

No browser event may become `HY - Verified LINE Contact`.


## GTM provider bridge

Repository bridge:

`scripts/gtm-wp01-funnel-bridge.mjs`

`scripts/gtm-wp01-funnel-contract.mjs`

The bridge is fail-closed and uses a dedicated workspace named:

`HANYAO WP01 Funnel Observability 20260918`

Modes:

- default / dry-run: reads the live container version and reports the exact required delta; no mutation.
- `--apply`: creates/reuses only the dedicated workspace, creates the three safe DLVs, updates only `GA4 Event - line_contact_attempt` with the tag fingerprint, then performs same-source readback.
- `--publish`: requires the dedicated workspace to contain only WP01 changes and be fully converged, creates an exact container version, publishes it with version fingerprint, then verifies the live version.

Desired GTM event parameters:

- existing: `contact_channel`, `contact_method`, `page_path`, `event_source`, `event_timestamp`
- add: `service_type`, `prepare_status`, `handoff_type`
- remove obsolete mapping: `lead_id`

No Google Ads conversion tag or canonical sender may be changed.

Official GTM API references used by the bridge:

- https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.versions/live
- https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces/list
- https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces/getStatus
- https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces/create_version
- https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.versions/publish
