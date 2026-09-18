# HANYAO WP10 Provider Surface Rebase — 2026-09-18

Scope: HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917

Baseline Production main:

`87ebea57b164b22b6477907befa72b738cfa74be`

## State correction

The previous WP10 ledger recorded WP02/WP03 as blocked because provider
credentials were unavailable in the then-current GitHub execution surface.

That historical statement remains true for GitHub-hosted Actions, but it is no
longer a complete description of the current HANYAO execution boundary.

The shared Factory MCP capability has since been formally governed and deployed
outside this repository. HANYAO must consume that governed capability rather
than creating HANYAO-specific execution workflows in the governance project.

The Google Ads short-lived access-token adapter and the HANYAO-owned SYSTEM host
provider runner are now merged into Production. The current Chat session can see
the four-tool Factory MCP surface including `host_powershell`, but the provider
transport readback currently reports that the tunnel client has not been seen
for 300 seconds. The surfaced tool schema also still declares
`attemptEpoch.minimum=0`; HANYAO execution must use epoch >= 1 and still awaits
the governance-side schema correction to minimum 1.

Current truthful state:

```text
WP01 website analytics dimensions = Production PASS
WP01 GTM/GA4 provider apply = NOT_APPLIED

WP02 engine = Production source PASS
WP02 short-lived auth adapter = Production source PASS
WP02 SYSTEM host provider runner = Production source PASS
WP02 fresh provider read = NOT_APPLIED
WP02 exact-negative mutation = NOT_APPLIED

WP03 provider engine = Production source PASS
WP03 short-lived auth adapter = Production source PASS
WP03 SYSTEM host provider runner = Production source PASS
WP03 fresh RSA inventory = NOT_APPLIED
WP03 paused create = NOT_APPLIED
WP03 enable = NOT_APPLIED

WP05 authenticated Google Ads UI prestate = NOT_APPLIED
WP08 observation clock = NOT_STARTED
WP09 stage = S1_TRACKING_PROOF_PENDING
```

The next provider execution begins only after the governed Factory MCP runtime
has a connected transport and an execution attempt uses `attemptEpoch >= 1`.
The HANYAO runner must then be invoked from an exact immutable Production SHA.
Repository readiness alone must not be treated as Google Ads provider
completion.

No Google Ads mutation, GTM publish, GA4 Admin mutation, Message Asset
association, bidding change, broad-match expansion, or AI Max enablement is
performed by this rebase.
