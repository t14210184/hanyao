# C1A side findings

Scope: C1A attribution-foundation implementation only. No side finding below was changed in this branch.

## Consent

`CONSENT_INTEGRATION_PENDING`: the tracked website source has no reusable consent abstraction or consent-state API. C1A does not create a new banner, change Consent Mode, turn denied into granted, or claim consent. The attribution module uses first-party `localStorage` only and does not add a cookie; a consent-aware integration remains a later task.

## Existing tracking boundaries

- Existing `line_contact_attempt`, `phone_click_attempt`, and legacy diagnostic-event behavior remain unchanged.
- Existing `HY-...` browser-generated values remain in the current tracking/form flow and were not redefined as an attribution session ID, lead ID, conversion ID, backend ID, or Google Ads transaction ID.
- No Google Ads conversion event, Google tag, GTM tag, GA4 key event, LINE behavior, or telephone behavior was added or modified.

## Dependency audit observation

The lockfile installation completed, but npm reported the repository's existing Next.js 15.1.7 package as deprecated for a security vulnerability and reported 7 audited vulnerabilities (1 moderate, 5 high, 1 critical). Dependency remediation is outside this C1A atomic task and was not run.
