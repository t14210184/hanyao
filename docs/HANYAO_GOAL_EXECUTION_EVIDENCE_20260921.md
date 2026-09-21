# HANYAO Goal Execution Evidence — 2026-09-21

This is a sanitized execution checkpoint for the user-authorized handoff scope. The two Desktop attachments are treated as construction specification and evidence requirements; fresh provider readback remains authoritative for mutable state.

## Current repository checkpoint

```text
CHECKPOINT_OBSERVED_MAIN_SHA=ecf66e802da3b2e0690eb1ba5de30af9feb80e4e
MERGED_PR=https://github.com/t14210184/hanyao/pull/77
MERGED_REPAIR_PR=https://github.com/t14210184/hanyao/pull/78
MERGED_EVIDENCE_PR=https://github.com/t14210184/hanyao/pull/79
ACTIVE_BRANCH=docs/hanyao-factory-gcloud-reconciliation-20260921
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
CURRENT_D1_READBACK=NOT_VERIFIED_CLOUDFLARE_CREDENTIAL_SURFACE
CURRENT_D1_READBACK_CLASSIFICATION=HG10_E17_CLOUDFLARE_READ_CREDENTIAL_REQUIRED
```

The migration was additive and did not rewrite the existing canonical tables. The counts above are the last verified checkpoint, not a fresh current-date readback. A fresh SELECT-only readback was attempted for 2026-09-21 and failed closed before dispatch because no Cloudflare read credential surface was present; no D1 write was attempted.

## Factory and host-runtime reconciliation

```text
FACTORY_HOST_EXEC_STATE=RUNNING
FACTORY_HOST_EXEC_ACTIVE_COUNT=1
FACTORY_HOST_EXEC_STALE_COUNT=1
FACTORY_STALE_REQUEST_ID=PRESENT_REDACTED
FACTORY_STALE_RECEIPT_STATE=STARTED
FACTORY_STALE_RECEIPT_EXIT_CODE_PRESENT=false
FACTORY_STALE_RECEIPT_FINISHED_AT_PRESENT=false
FACTORY_STALE_EXACT_PROCESS_TREE=ABSENT
FACTORY_CLEANUP_API=NOT_EXPOSED
GCLOUD_LAUNCHER_CLASSIFICATION=GOOGLE_CLOUD_SDK_RUNTIME_BROKEN
GCLOUD_CLEAN_CONFIG_RESULT=TIMEOUT
GCLOUD_EXISTING_CONFIG_RESULT=TIMEOUT_2_OF_2
GCLOUD_CMD_WRAPPER_RESULT=TIMEOUT_CLEAN_AND_EXISTING
GCLOUD_DIRECT_RUNTIME_RESULT=TIMEOUT_BUNDLED_PYTHON;SYSTEM_PYTHON_NOT_AVAILABLE
ISOLATED_OFFICIAL_RUNTIME_RESULT=TIMED_OUT_NO_RESULT
```

The fresh Factory status still reports one stale broker record. Its receipt remains `STARTED` without completion fields, while an exact request/run process-tree query returned zero matching processes. No cleanup or reaper API is exposed, so the record was not edited directly. The isolated official runtime attempt timed out without a result; its task-created temporary directory was removed by an exact cleanup operation. These are infrastructure classifications, not Google Ads provider responses.

## HQ07 implementation checkpoint

```text
HQ07_CONTRACT=IMPLEMENTED_AND_UNIT_TESTED
HQ07_ACTION_NAME=HY - Qualified LINE Lead
HQ07_CATEGORY=QUALIFIED_LEAD
HQ07_TYPE=UPLOAD_CLICKS
HQ07_COUNTING=ONE_PER_CLICK
HQ07_PRIMARY_FOR_GOAL=false
HQ07_MUTATION_DISPATCH_COUNT=0
HQ07_ACTION_EXISTS=NOT_VERIFIED_HOST_GCLOUD_UNRESPONSIVE
HQ07_PLAN_HASH=NOT_AVAILABLE_HOST_GCLOUD_UNRESPONSIVE
SMART_BIDDING_READY=NOT_READY
```

The runner enforces fresh HQ05 prerequisites, exact duplicate/similar-action inventory, deterministic prestate/plan hashes, `validateOnly`, one create dispatch, and same-source readback. An ambiguous result is read back before any further action and never blindly retried. Existing exact actions are reused; drift and custom-goal bypasses fail closed.

## Provider and runtime status

```text
HQ05_PROVIDER_VERDICT=NOT_VERIFIED_HOST_GCLOUD_UNRESPONSIVE
HQ07_PROVIDER_STATE=NOT_VERIFIED_HOST_GCLOUD_UNRESPONSIVE
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
SYSTEM_HOST_PROVIDER_LIVE_READBACK=NOT_VERIFIED_HOST_GCLOUD_UNRESPONSIVE
SYSTEM_HOST_PROVIDER_MUTATION_COUNT=0
HQ05_READ_ATTEMPT=HANYAO_HOST_RUNNER_GCLOUD_TIMEOUT
HQ07_READ_ATTEMPT=HANYAO_HOST_RUNNER_GCLOUD_TIMEOUT
```

The existing production Worker secret names were read without reading secret values. GitHub Actions has no provider credential surface, but that is not evidence that Google Ads auth is unavailable: the approved existing SYSTEM host runner is available through the Factory broker. No credential or provider body was exposed.

Fresh bounded SYSTEM probes reached the Factory route but the only installed gcloud.cmd timed out on --version, auth list, and impersonated Ads-token acquisition for both discovered config candidates. Direct bundled-Python invocation and explicit cmd.exe wrapping also timed out. This is classified as a host-tool responsiveness blocker; it is not a provider denial, auth absence, or project-authorization gate.

After PR #78 merged the gcloud acquisition guard, one bounded read-only HQ05 attempt and one bounded read-only HQ07 attempt both returned HANYAO_HOST_RUNNER_GCLOUD_TIMEOUT before any provider request. No token, provider response, or mutation was produced.

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
CURRENT_D1_LIVE_READBACK=NOT_VERIFIED_CREDENTIAL_SURFACE
```

## Next executable checkpoint

```text
NEXT_EXECUTABLE_NON_HUMAN_ACTION=RETRY_READ_ONLY_HQ05_HQ07_AFTER_FACTORY_RECOVERY_OR_VALID_ALTERNATE_AUTH_ROUTE;KEEP_HQ08_SHADOW_ONLY
BLOCKED_BRANCH=HQ05_HQ07_SYSTEM_PROVIDER_READBACK_AND_CURRENT_D1_HQ04_PROVIDER_READBACK
BLOCKER=FACTORY_STALE_RECORD_WITH_NO_EXPOSED_CLEANUP_API_AND_EXISTING_SYSTEM_GCLOUD_UNRESPONSIVE
```

No claim of Google Ads action creation, qualified upload, natural E2E, or Smart Bidding readiness is made by this file.
