# DEPENDENCY_SECURITY_GATE

Snapshot: 2026-08-25, `npm audit --json`, no remediation performed.

## Current classification

- Total: 7 advisories: 1 moderate, 5 high, 1 critical.
- Direct vulnerable packages: `next@15.1.7` (critical aggregate) and `@tailwindcss/postcss` (moderate).
- Transitive vulnerable packages: `brace-expansion`, `js-yaml`, `nanoid`, `postcss`, and `sharp`.
- The audit report's non-major remediation for the Next-related chain is `next@15.5.23`; npm did not authorize or perform that upgrade in this task.
- Vulnerability source: the npm audit advisory graph resolved from `package-lock.json`; the direct Next warning also points to https://nextjs.org/blog/CVE-2025-66478.

## Static-export impact

The repository uses `next.config.mjs` with `output: "export"`. The deployed Pages artifact is static `out` plus Pages Functions; it does not run `next start`, Next Server Actions, or the Next image optimization server in the Pages runtime. Therefore many Next server/RSC/image-server advisories have reduced direct exposure in the intended static deployment.

The risk is not zero: `next build` and local Next tooling still execute the vulnerable package, and any future self-hosted/server deployment would expose a larger surface. PostCSS, sharp, nanoid, js-yaml, and brace-expansion remain build/dependency supply-chain or denial-of-service concerns depending on the invoked tool path.

## Decision

Do not run `npm audit fix --force` and do not change Next during C1B1-R1. Schedule a dedicated `C1B1-R2_DEPENDENCY_PATCH` before production, pinning and validating the smallest supported Next patch/minor (currently audit-suggested `15.5.23`) with `npm ci`, unit/HTTP/D1 tests, lint, typecheck, build, and static-output comparison. Review the existing React/third-party compatibility before accepting the minor upgrade. A static-only preview may be technically lower exposure, but the critical build-tool finding remains an explicit release gate for production.
