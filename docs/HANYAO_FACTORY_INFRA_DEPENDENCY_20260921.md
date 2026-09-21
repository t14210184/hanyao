# HANYAO Factory Infrastructure Dependency — 2026-09-21

This is a sanitized, read-only dependency record for the HANYAO goal-mode
execution lane. It does not contain secrets, tokens, credential bodies, or
provider payloads. Request, run, task, and boot identities are represented by
presence plus SHA-256 fingerprints so the record can be correlated without
publishing raw infrastructure identifiers.

## Fresh Factory observation

```text
OBSERVED_AT_UTC=2026-09-21T04:10:41Z
FACTORY_VERSION=v45.hostguard.status.v1
HOST_IDENTITY=PRESENT_REDACTED
HOST_BOOT_IDENTITY=PRESENT_REDACTED
HOST_BOOT_IDENTITY_SHA256=d10695cf0953f376d5d4da8107f4121ffe55bee6ef8b82a4f511d84b57852be5
VM_STATE=Running
RUN_AS=NT_AUTHORITY_SYSTEM
TUNNEL_READY=true
```

## Orphaned broker record

```text
REQUEST_ID=PRESENT_REDACTED
REQUEST_ID_SHA256=4ebf2d1d938231e24bb68113433efa761eb3885e1b24b55985192e721aedc67f
RUN_ID=PRESENT_REDACTED
RUN_ID_SHA256=0d712ba161dd8cb18d3bbf1ad563ed03610f3e43b5deb31d987d75f5e8e6d06f
TASK_ID=PRESENT_REDACTED
TASK_ID_SHA256=7f0a90a8d4f9d80d6daa156943a67d728a40de3d58625e6580ce8c171e38033a
CONFIGURED_TIMEOUT_SECONDS=90
OBSERVED_AGE_SECONDS=40257
BROKER_JOB_STATE=Running
RECEIPT_STATE=STARTED
RECEIPT_EXIT_CODE_PRESENT=false
RECEIPT_FINISHED_AT_PRESENT=false
EXACT_PROCESS_TREE_COUNT=0
BROKER_ACTIVE_COUNT=1
BROKER_STALE_COUNT=1
FACTORY_BROKER_ORPHAN_RECORD_CONFIRMED=true
FACTORY_CLEANUP_API=NOT_EXPOSED
```

The record is classified as an external infrastructure dependency: the
broker reports it as active and stale, the receipt has no completion fields,
and a same-request/run process query found no exact matching process. The
HANYAO repository does not edit the shared Factory MCP state or receipt.

```text
BUSINESS_PROJECT_BLOCKED_BRANCH=SYSTEM_PROVIDER_EXECUTION_ONLY
SHARED_INFRA_OWNER=CHATGPT_GLOBAL_SKILL_GOVERNANCE / Factory MCP
NEXT_ACTION=WAIT_FOR_OR_RECONCILE_SHARED_FACTORY_BROKER_THEN_RETRY_READ_ONLY_PROVIDER_LANES
```
