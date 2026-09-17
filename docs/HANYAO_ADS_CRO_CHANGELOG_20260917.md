# HANYAO Ads / Website CRO Change Log — 2026-09-17

STATUS=IMPLEMENTATION_IN_PROGRESS
ORIGINAL_BASE_MAIN_SHA=89a9d37f86407624cdef78517f828ff5d2310e26
WP04_STEP1_PRODUCTION_SHA=fab6cf050dcd06c177e3491fa150e9b1d6d7d3d1
CURRENT_BRANCH=feat/ads-cro-repair-hero-20260917

## Change set 01 — Mobile repair CTA prioritization

Scope:

- detect `/services/ac-repair*` and `/lp/ac-repair*` as repair-intent traffic;
- emit `service_type=ac_repair` for sticky CTA observations;
- move LINE handoff to the first mobile sticky action for repair traffic;
- enlarge the LINE action relative to phone/form fallbacks;
- change repair CTA copy from generic `LINE諮詢` to task-oriented `傳照片／症狀`;
- retain phone and full-form fallbacks;
- retain centralized `CTAButton` handoff and existing tracking events.

Result:

- PR #20 exact-head gates passed;
- merged to `main` as `fab6cf050dcd06c177e3491fa150e9b1d6d7d3d1`;
- Cloudflare Pages Production deployment `024d739f-33c6-42df-b896-1c37432cbd13` succeeded.

## Change set 02 — Repair landing hero hierarchy

Scope:

- lead the first screen with the high-intent fault states: 不冷、滴水、漏水、異音、跳電;
- make `傳照片／症狀快速諮詢` the dominant primary action;
- keep phone as secondary action and the detailed quote form as tertiary action;
- tell visitors exactly what to send: brand/model, fault symptom/photo, and area;
- keep the LINE handoff cue: preserve inquiry ID and explicitly press Send;
- surface three verifiable trust/process signals near the action: licensed technician, registered/association business, explain cause and quote before work;
- leave long-form symptoms, trust section, process, pricing factors, FAQ, and geo content below the hero.

Safety invariants:

- centralized `CTAButton` and HY preparation path remain unchanged;
- `line_click` and `phone_click` remain observation events;
- no browser sender for `HY - Verified LINE Contact`;
- no Ads budget, bidding, Primary/Secondary conversion, uploader, D1 schema, or webhook matcher mutation.

Verification:

- hero source read back from GitHub after mutation;
- `scripts/ads-cro-repair-hero-static.test.mjs` guards the conversion hierarchy and tracking invariants;
- `Ads LINE hardening` now explicitly covers the repair hero source and hero static guard.

Next gate: PR CI + Pages Preview on the fresh branch head, then exact-head merge and Production same-source readback.
