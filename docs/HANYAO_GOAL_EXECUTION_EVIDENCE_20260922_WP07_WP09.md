# HANYAO V1.1 Goal Execution Evidence — WP07–WP09A Snapshot — 2026-09-22

This checkpoint records a bounded pre-merge snapshot for WP09A after the merged WP02–WP06 and WP07–WP09 checkpoints. Attachment text is treated as specification and evidence policy; mutable provider state is classified only from fresh same-source readback. Post-merge main is reported from a fresh GitHub ref readback, not backfilled into this snapshot.

## Current truth

```text
SPEC_VERSION=HANYAO_HIGH_QUALITY_CONVERSION_SIGNAL_SMART_BIDDING_CONSTRUCTION_SPEC_v1.1_20260922
PROMPT_VERSION=HANYAO_CODEX_V1.1_GOAL_MODE_CONTINUATION_PROMPT_20260922
EVIDENCE_SOURCE_SHA=e351d2415c861d005b69151b4f16b5d83b5bb3f0
EVIDENCE_GENERATED_AT=2026-09-22T13:52:14Z
EVIDENCE_PR_HEAD_SHA=7bc0467caa22523436d802f3b80d913a53cff58f
EVIDENCE_PHASE=PRE_MERGE_CI_SNAPSHOT
ACTIVE_BRANCH=v11-wp09a-canonical-atomicity
OPEN_PR_BEFORE_PUSH=NONE
LAST_COMPLETED_GATE=V11-WP07-WP09_EXACT_HEAD_MERGED
CURRENT_GATE=V11-WP09A_LOCAL_ATOMICITY_PASS_READY_FOR_PR_CI
BLOCKED_LANES=SYSTEM_PROVIDER_EXECUTION;FRESH_D1_READBACK;HQ05_PROVIDER;HQ07_PROVIDER;MESSAGE_ASSET_PROVIDER
READY_LANES=V11_WP09A_GITHUB_CI
```

## Provider and infrastructure truth

```text
FACTORY_EXEC_STATE=IDLE_WITH_ORPHANS
FACTORY_VM_STATE=Running
FACTORY_SSH22_REACHABLE=TRUE
FACTORY_HOST_EXEC_ACTIVE_COUNT=0
FACTORY_HOST_EXEC_EFFECTIVE_ACTIVE_COUNT=0
FACTORY_HOST_EXEC_LIVE_JOB_COUNT=0
FACTORY_HOST_EXEC_STALE_COUNT=0
FACTORY_HOST_EXEC_ORPHAN_COUNT=5
FACTORY_HOST_EXEC_CAPACITY=4
FACTORY_HOST_EXEC_BROKER_RECORDS=928
FACTORY_HOST_EXEC_LAST_STATE=COMPLETED
FACTORY_HOST_EXEC_LAST_FINISHED_AT_UTC=2026-09-22T12:48:14Z
FACTORY_PLATFORM_AVAILABLE=TRUE
FACTORY_TUNNEL_LIVE=TRUE
FACTORY_TUNNEL_READY=TRUE
FACTORY_CONTROL_PLANE=ok
FACTORY_CONTROL_PLANE_OBSERVED_AT_UTC=2026-09-22T12:49:01Z
FACTORY_HOST_EXEC_PROBE=SYSTEM_CAPABILITY_RUN_DENY
FACTORY_HOST_EXEC_PROBE_OBSERVED_AT_UTC=2026-09-22T12:35:25Z
SYSTEM_CAPABILITY_CLASSIFICATION=SYSTEM_CAPABILITY_POLICY_BLOCKED
PROVIDER_OBSERVED_AT=2026-09-22T12:49:01Z
CURRENT_PAGES_SOURCE=NOT_VERIFIED
CURRENT_WORKER_VERSION=NOT_VERIFIED
CURRENT_D1_READBACK=NOT_VERIFIED
HQ05_PROVIDER_VERDICT=NOT_VERIFIED
HQ06_STATE=CODE_PASS_PRODUCTION_DISARMED
HQ07_PROVIDER_STATE=NOT_VERIFIED
MESSAGE_ASSET_PROVIDER_STATE=NOT_VERIFIED
HQ08_STATE=SHADOW_ONLY
QUALIFIED_LANE_STATE=LOCAL_CONTRACT_READY_PROVIDER_NOT_VERIFIED
SMART_BIDDING_STATE=BLOCKED_BY_EVIDENCE_GATE
GOOGLE_ADS_MUTATION_COUNT=0
D1_MUTATION_COUNT=0
CLOUDFLARE_MUTATION_COUNT=0
NATURAL_EVENT_STATUS=NOT_STARTED_NO_SYNTHETIC_EVENTS
```

The fresh Factory status at `2026-09-22T12:49:01Z` reports no active, effective, live, or stale jobs; five orphan records remain shared infrastructure debt. The bounded SYSTEM read-only probe at `2026-09-22T12:35:25Z` was denied by the host capability layer with `SYSTEM_CAPABILITY_RUN_DENY`. The provider execution branch therefore remains parked as `SYSTEM_CAPABILITY_POLICY_BLOCKED`, without being reclassified as Google Ads or Cloudflare provider failure. No provider mutation, fake click, synthetic conversion, webhook replay, or raw secret was used.

## WP07–WP09A code and schema checkpoint

- WP07 adds the single append-only `lead_stage_events` ledger with structured evidence digest, deterministic idempotency, source-category distinctions, and explicit `QUALIFIED_CANDIDATE`, `QUALIFIED_CONFIRMED`, and `WON_JOB` boundaries.
- Classifier observations remain candidate-only; only gate-passed `QUALIFIED_CONFIRMED` or real-value `WON_JOB` stage records can enter the projection function.
- WP08 widens the existing `business_conversions`, `business_conversion_dedupe_locks`, and `conversion_outbox` contracts to the three typed conversion values while preserving completion, lease, provider-attempt, unique, and FK relationships.
- WP09 adds an exact typed destination resolver. Verified remains pinned to `HY_VERIFIED_LINE_CONTACT` / `7674301565`; later-stage action IDs are unavailable until explicit provider readback configuration. Unknown type/action and disallowed userData-only paths fail closed.
- WP09A makes canonical stage projection prestate-gated and atomic: exact four-part identity is idempotent, non-identical collisions fail closed, ordinary inserts run in one D1 batch, and partial/unknown states require reconciliation.
- WP09A explicitly documents one Qualified and one Won Job outcome per verified inquiry, rejects a later same-type stage with `STAGE_REPEAT_OUTCOME_BLOCKED`, and derives 30-day/365-day stage dedupe fences from stage occurrence time.
- No Production migration was dispatched. `0016`/`0017` were replayed in local SQLite with representative Verified, Qualified, and Won Job rows and foreign-key readback.

## Verification

```text
TEST_V11_WP07_WP09=PASS_3_OF_3
TEST_V13_P1_M03_MIGRATION=PASS_REPLAY_0001_THROUGH_0017
TEST_M03_QUALITY_EVIDENCE=PASS_6_OF_6
TEST_V11_WP02_WP06=PASS_3_OF_3
TEST_V12_HIGH_INTENT=PASS_6_OF_6_AND_W1_W27_LOCAL_HTTP_D1_PASS
TEST_LINE4A_UNIT=PASS_62_OF_62
TEST_LINE4A_MIGRATION=PASS
TEST_LINE4A_STATIC=PASS
TEST_LINE1A_UNIT=PASS_5_OF_5
TEST_HQ04_MESSAGE_ASSET=PASS_10_OF_10
TEST_HQ05_PREREQ=PASS_5_OF_5
TEST_HQ06_USERDATA=PASS_6_OF_6
TEST_HQ07_QUALIFIED_ACTION=PASS_8_OF_8
TEST_HG10_READBACK_STATIC=PASS
TYPESCRIPT_TYPECHECK=PASS
NEXT_BUILD=PASS
TEST_V11_WP09A=PASS_T139_T146_9_OF_9
CI_STATUS=PENDING_FOR_EVIDENCE_PR_HEAD
PR84_HEAD_SHA=e4a031501a57883bd2b22a2f4d3e4e179dbc6594
PR84_MERGE_COMMIT=350cae63278b994dada226c45da5ddd5b2fde1e9
PR84_STATE=CLOSED_MERGED_SAME_SOURCE_READBACK_PASS
PRODUCTION_MIGRATION_0016_0017=FORBIDDEN_UNAPPLIED
REPEAT_STAGE_POLICY=ONE_CANONICAL_OUTCOME_PER_VERIFIED_INQUIRY_AND_STAGE_TYPE
STAGE_DEDUPE_POLICY=OCCURRED_AT_ANCHORED_QUALIFIED_30D_WON_JOB_365D
```

HQ06 production userData remains disarmed until fresh HQ05/provider and validateOnly evidence exists. HQ07 provider creation/readback, natural qualified-lead E2E, Smart Bidding canary, and scale remain evidence-gated; local stage and payload tests do not substitute for provider truth.

```text
PROVIDER_READBACK=NOT_VERIFIED_SYSTEM_CAPABILITY_POLICY_BLOCKED
NEXT_EXECUTABLE_NON_HUMAN_ACTION=CREATE_PR_RUN_REQUIRED_GATE_HARDENING_PRODUCTION_PREFLIGHT_EXACT_HEAD_MERGE_THEN_FRESH_GITHUB_READBACK
```
