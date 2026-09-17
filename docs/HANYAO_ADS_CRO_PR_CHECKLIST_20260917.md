# HANYAO Ads CRO PR Checklist — 2026-09-17

BASE_MAIN_SHA=`89a9d37f86407624cdef78517f828ff5d2310e26`
MERGE_HEAD_POLICY=`FETCH_FRESH_PR_HEAD_AND_BIND_EXPECTED_HEAD_SHA_IMMEDIATELY_BEFORE_MERGE`

## Required before merge

- [x] Main prestate read back from GitHub.
- [x] Branch created from exact main SHA.
- [x] Mobile repair CTA change committed on isolated branch.
- [x] Branch file content read back from GitHub.
- [x] Baseline evidence artifact committed.
- [x] Static invariant guard committed.
- [ ] Pull request created against `main`.
- [ ] Required CI/build/typecheck checks green on the current PR head.
- [ ] Preview deployment exists for the current PR head.
- [ ] Preview smoke inspection passes.
- [ ] `main` still compatible with original merge base.
- [ ] PR head is freshly read immediately before merge and bound as `expected_head_sha`.
- [ ] Post-merge `main` readback confirms resulting merge SHA.
- [ ] Production Pages readback confirms deployment from merged source.
- [ ] Production URL smoke test confirms repair CTA behavior.
- [ ] D1 / canonical conversion path remains unchanged.

## Rollback trigger

Any build/typecheck failure, missing preview, broken LINE handoff, tracking regression, unexpected main movement, or Production mismatch blocks merge or triggers rollback to the pre-change source.
