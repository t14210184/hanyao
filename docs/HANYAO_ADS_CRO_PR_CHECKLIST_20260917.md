# HANYAO Ads CRO PR Checklist — 2026-09-17

BASE_MAIN_SHA=`89a9d37f86407624cdef78517f828ff5d2310e26`
EXPECTED_HEAD_SHA=`e2d0d46882ae0910f6c2b33a9b64484859c85790`

## Required before merge

- [x] Main prestate read back from GitHub.
- [x] Branch created from exact main SHA.
- [x] Mobile repair CTA change committed on isolated branch.
- [x] Branch file content read back from GitHub.
- [x] Baseline evidence artifact committed.
- [x] Static invariant guard committed.
- [ ] Pull request created against `main`.
- [ ] Required CI/build/typecheck checks green on exact head.
- [ ] Preview deployment exists for exact head.
- [ ] Preview smoke inspection passes.
- [ ] `main` still compatible with original merge base.
- [ ] Merge executed with exact expected head SHA.
- [ ] Post-merge `main` readback confirms resulting merge SHA.
- [ ] Production Pages readback confirms deployment from merged source.
- [ ] Production URL smoke test confirms repair CTA behavior.
- [ ] D1 / canonical conversion path remains unchanged.

## Rollback trigger

Any build/typecheck failure, missing preview, broken LINE handoff, tracking regression, unexpected main movement, or Production mismatch blocks merge or triggers rollback to the pre-change source.
