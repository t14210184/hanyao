# HANYAO Ads / Website CRO Change Log — 2026-09-17

STATUS=IMPLEMENTATION_IN_PROGRESS
BASE_MAIN_SHA=89a9d37f86407624cdef78517f828ff5d2310e26
BRANCH=feat/ads-cro-repair-20260917

## Change set 01 — Mobile repair CTA prioritization

Scope:

- detect `/services/ac-repair*` and `/lp/ac-repair*` as repair-intent traffic;
- emit `service_type=ac_repair` for sticky CTA observations;
- move LINE handoff to the first mobile sticky action for repair traffic;
- enlarge the LINE action relative to phone/form fallbacks;
- change repair CTA copy from generic `LINE諮詢` to task-oriented `傳照片／症狀`;
- retain phone and full-form fallbacks;
- retain centralized `CTAButton` handoff and existing tracking events.

Non-changes:

- no Google Ads budget change;
- no bidding strategy change;
- no Primary/Secondary conversion mutation;
- no GTM/browser verified-conversion sender;
- no Google Ads uploader mutation;
- no D1 schema mutation;
- no LINE webhook matcher mutation.

Verification artifacts:

- baseline: `docs/HANYAO_ADS_CRO_BASELINE_20260917.md`
- static guard: `scripts/ads-cro-repair-static.test.mjs`
- branch code readback: `src/components/MobileStickyCTA.tsx`

Next gate: GitHub PR CI + Pages Preview, followed by exact-head merge only if all required checks remain green.
