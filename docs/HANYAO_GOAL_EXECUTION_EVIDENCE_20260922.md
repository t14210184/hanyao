# HANYAO V1.1 Goal Execution Evidence — 2026-09-22

This checkpoint records the fresh repository and execution truth observed while applying the V1.1 construction authority. Attachment text is treated as specification and evidence policy; mutable provider state is classified only from fresh same-source readback.

## Current truth

```text
SPEC_VERSION=HANYAO_HIGH_QUALITY_CONVERSION_SIGNAL_SMART_BIDDING_CONSTRUCTION_SPEC_v1.1_20260922
SPEC_SHA256=06945bcb5fe1e7ee744aeb0d872ecfc77f9d0a5d8a7665869035b4d00b52c82d
PROMPT_SHA256=3d234393ff0368018eb1fe589980eb507b8923dd75fac0e6531de17711c8f973
OBSERVED_AT_UTC=2026-09-22T11:34:57Z
CURRENT_MAIN_SHA=da5f9cad32bcd314e6e33229e45adccc06cc1b42
EVIDENCE_SOURCE_SHA=da5f9cad32bcd314e6e33229e45adccc06cc1b42
ACTIVE_BRANCH=v11-wp02-wp06-hardening
OPEN_PR_BEFORE_PUSH=NONE
LAST_COMPLETED_GATE=V11-WP02-WP06_LOCAL_CODE_HARDENING
CURRENT_GATE=GITHUB_COMMIT_PUSH_PR_CI_EXACT_HEAD_MERGE
BLOCKED_LANES=SYSTEM_PROVIDER_EXECUTION
READY_LANES=V11-WP02-WP06_GITHUB_CI
```

## Provider and infrastructure truth

```text
FACTORY_EXEC_STATE=IDLE_WITH_ORPHANS
FACTORY_ACTIVE_COUNT=0
FACTORY_EFFECTIVE_ACTIVE_COUNT=0
FACTORY_LIVE_JOB_COUNT=0
FACTORY_STALE_COUNT=0
FACTORY_ORPHAN_COUNT=5
FACTORY_HOST_EXEC_PROBE=SYSTEM_CAPABILITY_RUN_DENY
CURRENT_PAGES_SOURCE=NOT_VERIFIED
CURRENT_WORKER_VERSION=NOT_VERIFIED
CURRENT_D1_READBACK=NOT_VERIFIED
HQ05_PROVIDER_VERDICT=NOT_VERIFIED
HQ06_STATE=CODE_PASS_PRODUCTION_DISARMED
HQ07_PROVIDER_STATE=NOT_VERIFIED
HQ08_STATE=SHADOW_ONLY
QUALIFIED_LANE_STATE=CODE_CONTRACT_READY_PROVIDER_NOT_VERIFIED
SMART_BIDDING_STATE=BLOCKED_BY_EVIDENCE_GATE
GOOGLE_ADS_MUTATION_COUNT=0
D1_MUTATION_COUNT=0
CLOUDFLARE_MUTATION_COUNT=0
NATURAL_EVENT_STATUS=NOT_STARTED_NO_SYNTHETIC_EVENTS
```

Factory status shows no active, effective, live, or stale jobs; five orphan records remain shared infrastructure debt. A fresh minimal SYSTEM host execution probe was denied by the host capability layer, so the provider lane is parked without treating that as a Google Ads or Cloudflare provider verdict. No provider mutation, fake click, synthetic conversion, webhook replay, or raw secret was used.

## V1.1 code changes completed in this checkpoint

- WP02: bounded OAuth transport and permanent authentication failures are non-retryable.
- WP03: runtime hot paths only verify schema; DDL is migration-owned.
- WP04: additive click-ID partial indexes and planner assertions.
- WP05: Message Asset v2 metrics and per-customer durable collector checkpoint; zero-row success advances the checkpoint.
- WP06: immutable per-record consent evidence, retention expiry fields, and bounded cleanup that preserves snapshot-referenced identifiers.
- The local HTTP adapter now replays migrations through 0015, so its integration fixture matches the runtime schema verifier.

## Verification

```text
TEST_V11_WP02_WP06=PASS_3_OF_3
TEST_V12_HIGH_INTENT=PASS_6_OF_6_AND_W1_W27_LOCAL_HTTP_D1_PASS
TEST_LINE4A_UNIT=PASS_62_OF_62
TEST_LINE4A_MIGRATION=PASS
TEST_HQ04_MESSAGE_ASSET=PASS_10_OF_10
TEST_HQ05_PREREQ=PASS_5_OF_5
TEST_HQ06_USERDATA=PASS_6_OF_6
TEST_HQ07_QUALIFIED_ACTION=PASS_8_OF_8
TEST_HG10_READBACK_STATIC=PASS
TEST_LINE4A_STATIC=PASS
TYPESCRIPT_TYPECHECK=PASS
NEXT_BUILD=PASS
CI_STATUS=NOT_YET_RUN_FOR_THIS_HEAD
```

## Gate and next action

HQ06 production userData remains disarmed until fresh HQ05/provider and validateOnly evidence exists. HQ07 provider creation/readback, natural qualified-lead E2E, Smart Bidding canary, and scale remain evidence-gated; source tests do not substitute for provider truth.

```text
PROVIDER_READBACK=NOT_VERIFIED_HOST_CAPABILITY_RUN_DENY
NEXT_EXECUTABLE_NON_HUMAN_ACTION=COMMIT_PUSH_CREATE_PR_THEN_RUN_REQUIRED_CI_AND_EXACT_HEAD_MERGE;AFTER_MERGE_RETRY_READ_ONLY_D1_HQ05_HQ07_WHEN_LEGAL_ROUTE_IS_AVAILABLE
```
