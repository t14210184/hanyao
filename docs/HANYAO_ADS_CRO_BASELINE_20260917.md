# HANYAO Ads / Website CRO Baseline — 2026-09-17

PROJECT=HANYAO_ADS_LINE_PROD
WORK_PACKAGE=ADS_WEBSITE_OPTIMIZATION_V1
STATUS=BASELINE_LOCKED
BASE_MAIN_SHA=89a9d37f86407624cdef78517f828ff5d2310e26
CRO_BRANCH=feat/ads-cro-repair-20260917

## 1. Fresh production readback

Cloudflare Pages production deployment observed before this change:

- deployment_id: `97cf1a8e-4f14-4d4b-bc5f-bccb4ed5bb7c`
- environment: `Production`
- branch: `main`
- source: `89a9d37`

Production D1 readback before CRO mutation:

- attribution_sessions: 17
- lead_tokens: 20
- line_events: 199+
- business_conversions: 2
- conversion_outbox: 0
- provider_attempts: 0
- provider_attempt_events: 0

A later same-session D1 count observed 201 LINE events while business conversions remained at 2, confirming webhook intake continued without creating new verified Ads conversions.

## 2. Google Ads diagnostic baseline

30-day diagnostic window: 2026-08-18 through 2026-09-16.

High-spend enabled keywords showed a recurring Landing Page Experience signal:

- `冷氣維修`: Quality Score 5; ad relevance ABOVE_AVERAGE; post-click quality BELOW_AVERAGE.
- `冷氣清洗`: Quality Score 5; ad relevance ABOVE_AVERAGE; post-click quality BELOW_AVERAGE.
- `冷氣安裝`: Quality Score 3; ad relevance ABOVE_AVERAGE; post-click quality BELOW_AVERAGE.
- Multiple related repair and cleaning queries also showed post-click quality BELOW_AVERAGE.

Interpretation for this work package: ad relevance is not the only bottleneck; landing-page / post-click experience is a justified priority for controlled CRO work.

## 3. CRO invariant

This work package MUST NOT weaken or bypass the canonical conversion chain.

- `HY - Verified LINE Contact` remains the canonical verified conversion.
- Browser/GTM `line_click` remains an observation event, not the verified business conversion.
- No duplicate browser sender for the canonical Google Ads conversion action is introduced.
- No budget, bidding strategy, Primary/Secondary conversion status, or uploader semantics are changed by this first CRO increment.

## 4. First bounded increment

`MobileStickyCTA` is specialized for repair traffic (`/services/ac-repair*` and `/lp/ac-repair*`):

- LINE handoff becomes the first and visually strongest mobile action.
- repair `service_type` becomes `ac_repair` instead of generic.
- copy changes from generic `LINE諮詢` to `傳照片／症狀`.
- phone and full-form fallbacks are retained.
- existing `CTAButton` attribution / HY preparation path remains unchanged.

## 5. Acceptance

Before Production merge:

1. branch content same-source readback matches intended code;
2. pull request CI/build gates pass;
3. preview deployment is produced and inspected;
4. main has not moved incompatibly;
5. merge uses exact PR head SHA;
6. Production Pages source is read back after merge;
7. canonical tracking invariants remain unchanged.
