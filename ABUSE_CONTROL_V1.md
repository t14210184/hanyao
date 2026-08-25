# ABUSE_CONTROL_V1

Status: design and local hook only. No Cloudflare account binding or security rule was created or mutated in C1B1-R1.

## Implemented hook

`enforceAbuseControl(request, env.ATTRIBUTION_RATE_LIMITER)` is called by both attribution POST endpoints. It has an explicit policy:

- no binding configured: fail-open with `REMOTE_BINDING_DEFERRED`;
- binding returns `success: false`: fail-closed with HTTP 429;
- binding errors: fail-open with `BINDING_ERROR_FAIL_OPEN` so a transient control-plane failure does not block normal mobile users;
- the transient key is `CF-Connecting-IP` when present, otherwise an anonymous bucket, and is never written to D1.

This is abuse control, not authentication. Same-origin `Origin` checking remains only a browser-origin signal because a direct script can forge it.

## Options

| Option | Fixed cost / account dependency | Complexity | UX | Anonymous API fit |
|---|---|---|---|---|
| Workers Rate Limiting binding | Requires a real remote namespace/binding; no new D1 PII | Low in code, remote config required | None | Good as an optional in-function limiter; counters are eventually consistent |
| WAF rate limiting rule | Plan availability and zone configuration must be confirmed; no app data storage | Low after rule design | None for log/block; challenge can add friction | Best edge-first control for these two public paths |
| Lightweight server token/bucket | D1 hot-row writes or a distributed storage service are required | Medium/high; correctness and eviction burden | None | Poor as the first control; in-memory buckets are invalid for distributed Functions |
| Turnstile | Requires sitekey/secret and server verification | Medium | Challenge only when shown | Good for a high-risk form fallback, not the default attribution flow |

## Recommendation before production

Use a Cloudflare WAF rate limiting rule scoped to `/api/attribution/v1/session` and `/api/attribution/v1/lead-token`, counted by source IP, with an initial Log/draft phase and a conservative challenge or block threshold after observing normal mobile traffic. Cloudflare documents rate limiting rules as path/request controls and recommends validating thresholds before enforcement. Keep the application hook as a second layer; configure the Worker binding only when the real account namespace and failure policy are approved.

Official references checked on 2026-08-25:

- https://developers.cloudflare.com/waf/rate-limiting-rules/
- https://developers.cloudflare.com/waf/rate-limiting-rules/request-rate/
- https://developers.cloudflare.com/waf/rate-limiting-rules/find-rate-limit/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/turnstile/get-started/
