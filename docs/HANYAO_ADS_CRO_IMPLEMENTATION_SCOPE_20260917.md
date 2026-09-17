# HANYAO Ads CRO Implementation Scope — 2026-09-17

This branch is the first bounded Production candidate under `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917`.

## Included

1. Mobile sticky CTA specialization for repair-intent routes.
2. Repair traffic measurement uses `service_type=ac_repair`.
3. LINE handoff is presented first and receives increased visual weight for repair traffic.
4. Phone and full-form alternatives remain available.
5. Existing centralized `CTAButton` and HY preparation path are preserved.
6. Baseline, changelog, merge checklist, and a static invariant guard are included as evidence.

## Excluded from this bounded candidate

- Google Ads budget or bidding changes.
- Search keyword / negative keyword mutations.
- Google Message Asset activation.
- Conversion-action goal changes.
- GTM verified-conversion tags.
- D1 schema or uploader changes.

Those remain separate work packages so their effects can be measured and rolled back independently.
