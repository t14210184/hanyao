# PR summary

This candidate applies the first bounded CRO increment for high-intent mobile cold-air repair traffic.

## Why

Fresh 30-day Google Ads diagnostics showed recurring `post_click_quality_score=BELOW_AVERAGE` on the highest-spend repair / cleaning / installation keywords while ad relevance was often average or above average. Production D1 continued receiving LINE webhook events without new verified Ads conversions. This supports reducing post-click contact friction before increasing spend or widening targeting.

## What changed

- repair routes are identified in `MobileStickyCTA`;
- repair sticky CTA emits `service_type=ac_repair`;
- LINE handoff becomes the first and strongest mobile action;
- task-oriented copy becomes `傳照片／症狀`;
- phone and full-form fallbacks remain;
- centralized `CTAButton` / HY handoff remains unchanged.

## Safety boundaries

No budget, bidding, conversion-goal, GTM verified-conversion sender, D1 schema, uploader, or webhook-matcher changes are included.

## Gates

Merge only after current-head CI/build/typecheck and Preview pass, followed by fresh main/head readback and exact-head merge.
