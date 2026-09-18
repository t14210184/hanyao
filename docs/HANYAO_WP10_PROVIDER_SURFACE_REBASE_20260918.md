# HANYAO WP10 Provider Surface Rebase — 2026-09-18

Scope: HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917

Baseline Production main:

`5f03bdfd4728b46c25931972ac8a1bfdcbdb2488`

## State correction

The previous WP10 ledger recorded WP02/WP03 as blocked because provider
credentials were unavailable in the then-current GitHub execution surface.

That historical statement remains true for GitHub-hosted Actions, but it is no
longer a complete description of the current HANYAO execution boundary.

The shared Factory MCP capability has since been formally governed and deployed
outside this repository. HANYAO must consume that governed capability rather
than creating HANYAO-specific execution workflows in the governance project.

The current Chat session still exposes the stale three-tool MCP schema and
therefore cannot yet perform the fresh Google Ads provider readback required by
WP02/WP03.

Current truthful state:

```text
WP01 website analytics dimensions = Production PASS
WP01 GTM/GA4 provider apply = NOT_APPLIED

WP02 engine = Production source PASS
WP02 fresh provider read = NOT_APPLIED
WP02 exact-negative mutation = NOT_APPLIED

WP03 provider engine = Production source PASS
WP03 fresh RSA inventory = NOT_APPLIED
WP03 paused create = NOT_APPLIED
WP03 enable = NOT_APPLIED

WP05 authenticated Google Ads UI prestate = NOT_APPLIED
WP08 observation clock = NOT_STARTED
WP09 stage = S1_TRACKING_PROOF_PENDING
```

The next provider execution must begin only after a fresh Chat session loads the
current governed Factory MCP definition. Repository readiness alone must not be
treated as Google Ads provider completion.

No Google Ads mutation, GTM publish, GA4 Admin mutation, Message Asset
association, bidding change, broad-match expansion, or AI Max enablement is
performed by this rebase.
