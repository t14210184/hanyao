# HANYAO Goal Execution Evidence — 2026-09-21

This is a sanitized execution checkpoint for the user-authorized handoff scope. The two Desktop attachments are treated as construction specification and evidence requirements; fresh provider readback remains authoritative for mutable state.

## Current repository checkpoint

```text
CURRENT_MAIN_SHA=00c04a651b57fa6bf4e238bc085d8fbe149d7f44
CHECKPOINT_OBSERVED_MAIN_SHA=00c04a651b57fa6bf4e238bc085d8fbe149d7f44
MERGED_PR=https://github.com/t14210184/hanyao/pull/77
MERGED_REPAIR_PR=https://github.com/t14210184/hanyao/pull/78
MERGED_EVIDENCE_PR=https://github.com/t14210184/hanyao/pull/80
ACTIVE_BRANCH=docs/hanyao-system-control-matrix-20260921
OPEN_PR_BEFORE_PUSH=NONE
HQ02_HQ06_MAIN_STATE=MERGED
```

## Production D1 checkpoint

```text
LAST_VERIFIED_MIGRATION_DISPATCH_COUNT=1
LAST_VERIFIED_MIGRATION_FILES_APPLIED=0013,0014
LAST_VERIFIED_REMOTE_MIGRATIONS_PENDING=0
LAST_VERIFIED_REMOTE_READBACK_WRITES=0
LAST_VERIFIED_LINE_EVENTS=227
LAST_VERIFIED_BUSINESS_CONVERSIONS=3
LAST_VERIFIED_CONVERSION_OUTBOX=1
LAST_VERIFIED_LEAD_SIGNAL_OBSERVATIONS=0
LAST_VERIFIED_LEAD_USER_IDENTIFIERS=0
LAST_VERIFIED_MESSAGE_ASSET_METRICS_DAILY=0
CURRENT_D1_TARGET_DATE=2026-09-21
LOCAL_CLOUDFLARE_SURFACE=UNAVAILABLE
SYSTEM_WRANGLER_AUTH_ROUTE=IMPLEMENTED_NOT_FRESHLY_VERIFIED
SYSTEM_WRANGLER_AUTH_RESULT=NPX_AND_DIRECT_NODE_TOKEN_TIMEOUT
CURRENT_D1_READBACK=NOT_VERIFIED
D1_CURRENT_STATE=NOT_VERIFIED
CURRENT_D1_READBACK_CLASSIFICATION=SYSTEM_WRANGLER_AUTH_TIMEOUT
CURRENT_LINE_EVENTS=NOT_VERIFIED
CURRENT_BUSINESS_CONVERSIONS=NOT_VERIFIED
CURRENT_CONVERSION_OUTBOX=NOT_VERIFIED
CURRENT_LEAD_SIGNAL_OBSERVATIONS=NOT_VERIFIED
CURRENT_LEAD_USER_IDENTIFIERS=NOT_VERIFIED
CURRENT_MESSAGE_ASSET_METRICS_DAILY=NOT_VERIFIED
```

The migration was additive and did not rewrite the existing canonical tables. The counts above are the last verified checkpoint, not a fresh current-date readback. A fresh SELECT-only readback was gated behind the existing SYSTEM Wrangler auth route; both the `npx` wrapper and direct existing Wrangler Node entrypoint timed out while requesting the token, so `whoami` and D1 were not dispatched. This does not prove that no Cloudflare credential exists; no token was printed or persisted and no D1 write was attempted.

## Factory and host-runtime reconciliation

```text
FACTORY_HOST_EXEC_STATE=RUNNING
FACTORY_HOST_EXEC_ACTIVE_COUNT=1
FACTORY_HOST_EXEC_STALE_COUNT=1
FACTORY_STALE_RECORD_STATE=FACTORY_BROKER_ORPHAN_RECORD_CONFIRMED
FACTORY_VERSION=v45.hostguard.status.v1
FACTORY_STALE_REQUEST_ID=PRESENT_REDACTED
FACTORY_STALE_CONFIGURED_TIMEOUT_SECONDS=90
FACTORY_STALE_OBSERVED_AGE_SECONDS=39379
FACTORY_STALE_RECEIPT_STATE=STARTED
FACTORY_STALE_RECEIPT_EXIT_CODE_PRESENT=false
FACTORY_STALE_RECEIPT_FINISHED_AT_PRESENT=false
FACTORY_STALE_EXACT_PROCESS_TREE=ABSENT
FACTORY_STALE_EXACT_PROCESS_TREE_COUNT=0
FACTORY_HOST_BOOT_IDENTITY=PRESENT_REDACTED
FACTORY_CLEANUP_API=NOT_EXPOSED
FACTORY_DEPENDENCY_ARTIFACT=docs/HANYAO_FACTORY_INFRA_DEPENDENCY_20260921.md
GENERIC_CMD_CHILD_RESULT=PASS
GENERIC_POWERSHELL_CHILD_RESULT=PASS
GENERIC_NODE_CHILD_RESULT=PASS
PROCESSSTARTINFO_REDIRECT_RESULT=PASS
BUNDLED_PYTHON_MINIMAL_RESULT=TIMEOUT
BUNDLED_PYTHON_VERSION_RESULT=PASS
GCLOUD_LAUNCHER_CLASSIFICATION=PYTHON_RUNTIME_BROKEN
GCLOUD_ROOT_CAUSE_CLASSIFICATION=PYTHON_RUNTIME_BROKEN
GCLOUD_VERSION_RESULT=TIMEOUT
GCLOUD_AUTH_RESULT=PRIOR_TIMEOUT_2_OF_2_CURRENT_NOT_RUN_AFTER_PYTHON_CONTROL_TIMEOUT
GCLOUD_CLEAN_CONFIG_RESULT=TIMEOUT
GCLOUD_EXISTING_CONFIG_RESULT=TIMEOUT_2_OF_2
GCLOUD_CMD_WRAPPER_RESULT=TIMEOUT_CLEAN_AND_EXISTING
GCLOUD_DIRECT_RUNTIME_RESULT=TIMEOUT_BUNDLED_PYTHON_MINIMAL_AND_ENTRYPOINT
NPX_VERSION_RESULT=TIMEOUT
SYSTEM_WRANGLER_AUTH_RESULT=TIMEOUT_NPX_AND_DIRECT_NODE_TOKEN
ISOLATED_OFFICIAL_RUNTIME_RESULT=TIMED_OUT_NO_RESULT
```

The fresh Factory status still reports one stale broker record. Its receipt remains `STARTED` without completion fields, while an exact request/run process-tree query returned zero matching processes, so the dependency is confirmed as an orphan broker record. No cleanup or reaper API is exposed, so the record was not edited directly. Generic child controls all passed; Node code execution passed; the SDK bundled Python version command passed but the minimal `-c` control timed out, and the gcloud entrypoint also timed out. The isolated official runtime attempt timed out without a result; its task-created temporary directory was removed by an exact cleanup operation. These are execution-infrastructure classifications, not Google Ads provider responses.

## HQ07 implementation checkpoint

```text
HQ07_CONTRACT=IMPLEMENTED_AND_UNIT_TESTED
HQ07_ACTION_NAME=HY - Qualified LINE Lead
HQ07_CATEGORY=QUALIFIED_LEAD
HQ07_TYPE=UPLOAD_CLICKS
HQ07_COUNTING=ONE_PER_CLICK
HQ07_PRIMARY_FOR_GOAL=false
HQ07_MUTATION_DISPATCH_COUNT=0
HQ07_ACTION_EXISTS=NOT_VERIFIED_PYTHON_RUNTIME_BROKEN
HQ07_PLAN_HASH=NOT_AVAILABLE_PYTHON_RUNTIME_BROKEN
SMART_BIDDING_READY=NOT_READY
```

The runner enforces fresh HQ05 prerequisites, exact duplicate/similar-action inventory, deterministic prestate/plan hashes, `validateOnly`, one create dispatch, and same-source readback. An ambiguous result is read back before any further action and never blindly retried. Existing exact actions are reused; drift and custom-goal bypasses fail closed.

## Provider and runtime status

```text
HQ05_PROVIDER_VERDICT=NOT_VERIFIED
HQ07_PROVIDER_STATE=NOT_VERIFIED
HQ06_PRODUCTION_USERDATA=DISARMED
HQ06_PRODUCTION_CONSENT=UNSPECIFIED
GOOGLE_ADS_MUTATION_COUNT=0
NATURAL_CONVERSION_SYNTHESIS=NONE
GITHUB_ACTIONS_PROVIDER_CREDENTIAL_SURFACE=UNAVAILABLE
SYSTEM_HOST_PROVIDER_ROUTE=AVAILABLE_VIA_EXISTING_FACTORY_SYSTEM_RUNNER
SYSTEM_HOST_GCLOUD_CONFIG_COUNT=2
SYSTEM_HOST_GCLOUD_VARIANT=gcloud.cmd_ONLY
SYSTEM_HOST_GCLOUD_VERSION_PROBE=TIMEOUT
SYSTEM_HOST_GCLOUD_AUTH_LIST_PROBE=TIMEOUT_2_OF_2
SYSTEM_HOST_GCLOUD_IMPERSONATED_ADS_TOKEN_PROBE=TIMEOUT_2_OF_2
GOOGLE_ADS_PROVIDER_REQUEST_OBSERVED=NO
SYSTEM_HOST_PROVIDER_LIVE_READBACK=NOT_VERIFIED_PYTHON_RUNTIME_BROKEN
SYSTEM_HOST_PROVIDER_MUTATION_COUNT=0
HQ05_READ_ATTEMPT=HANYAO_HOST_RUNNER_GCLOUD_TIMEOUT
HQ07_READ_ATTEMPT=HANYAO_HOST_RUNNER_GCLOUD_TIMEOUT
```

The existing production Worker secret names were read without reading secret values. GitHub Actions has no provider credential surface, but that is not evidence that Google Ads auth is unavailable: the approved existing SYSTEM host runner is available through the Factory broker. No credential or provider body was exposed.

Fresh bounded SYSTEM probes reached the Factory route and generic child execution was healthy. The exact bundled Python executable passed `--version` but timed out on a no-network `-c print(...)` control; direct gcloud entrypoint and gcloud launcher version probes also timed out. This is classified as `PYTHON_RUNTIME_BROKEN`, not as a Google-specific provider denial.

The existing SYSTEM Wrangler route was then probed independently. `node.exe -e` passed, but `npx.cmd --version`, `wrangler auth token --json` through npx, and the same token command through the existing direct Wrangler Node entrypoint all timed out. No token, `whoami` result, D1 response, provider response, or mutation was produced. HQ05/HQ07 were not retried while the proven Python/launcher layer remains degraded.

The HQ04 Message Asset contract tests passed 9/9, HQ06 userData tests passed 6/6, WP10 ledger tests passed 6/6, and HQ08/HQ02 shadow tests passed 5/5 with the local LINE adapter PASS. The provider-side HQ04 readback remains unverified because the same current credential surface is absent. HQ08 remains shadow-only and its natural observation clock has not started; no synthetic conversion or provider event was created.

## Verification

```text
NPM_CI=PASS
NEXT_BUILD=PASS
TYPESCRIPT_TYPECHECK=PASS
TEST_HQ07=PASS
TEST_HQ02_V12=PASS
TEST_HQ04=PASS
TEST_HQ05=PASS
TEST_HQ06=PASS
TEST_HQ04_MESSAGE_ASSET=PASS_9_OF_9
TEST_HQ06_USERDATA=PASS_6_OF_6
TEST_WP10_LEDGER=PASS_6_OF_6
TEST_HQ08_SHADOW=PASS_5_OF_5
TEST_HG10_STATIC=PASS
CURRENT_D1_LIVE_READBACK=NOT_VERIFIED_SYSTEM_WRANGLER_AUTH_TIMEOUT
```

## Next executable checkpoint

```text
NEXT_EXECUTABLE_NON_HUMAN_ACTION=REPAIR_OR_ISOLATE_BUNDLED_PYTHON_AND_WRANGLER_LAUNCH_LAYERS_THEN_RETRY_SYSTEM_WRANGLER_D1_AND_READ_ONLY_HQ05_HQ07;KEEP_HQ08_SHADOW_ONLY
BLOCKED_BRANCH=SYSTEM_PROVIDER_EXECUTION_ONLY
BLOCKER=FACTORY_BROKER_ORPHAN_RECORD_CONFIRMED_PLUS_PYTHON_RUNTIME_BROKEN_PLUS_NPX_AND_DIRECT_WRANGLER_AUTH_TIMEOUT
```

No claim of Google Ads action creation, qualified upload, natural E2E, or Smart Bidding readiness is made by this file.
