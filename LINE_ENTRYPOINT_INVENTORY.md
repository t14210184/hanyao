# LINE entrypoint inventory — LINE1B-2A

Baseline source scan: 2026-08-25, branch `feat/line-tracking-line1b2a-client`, parent `a66ed893c5151f8b955bd836106fceaa97d7cf8b`.

## Scope and counting rule

This is a source/component inventory, not a claim that a browser has completed a LINE conversation. Each direct CTA source is counted once. Shared component call sites are listed separately so the inventory does not multiply a reusable component by every route that imports it.

The 2A client orchestrator is centralized in `src/components/CTAButton.tsx` and `src/lib/line-contact.ts`. Existing `siteConfig.lineUrl` values remain the single profile fallback. A mobile LINE intent prepares a server token, then opens the official `oaMessage` URL; all prepare failures fail open to the profile URL.

## Entrypoints

| Entry point | Current source shape | 2A treatment | Desktop state / 2B input |
| --- | --- | --- | --- |
| Shared `Header` desktop and drawer | 2 `CTAButton` LINE CTAs | Central `CTAButton` orchestration | Desktop profile fallback; cross-device handoff remains pending |
| Shared `MobileStickyCTA` | 1 `CTAButton` LINE CTA | Central orchestration | Desktop profile fallback; no QR |
| Shared `Footer` | 1 `CTAButton` LINE CTA | Central orchestration | Desktop profile fallback; no QR |
| Shared `LandingHero` | 1 reusable LINE `CTAButton`; 4 route call sites | Central orchestration | Desktop profile fallback; no QR |
| Shared `FinalCTA` | 1 reusable LINE `CTAButton`; 26 route call sites | Central orchestration | Desktop profile fallback; no QR |
| Page/service/guides/areas/cases/FAQ CTAButton sources | 59 `trackEventName="line_click"` source instances across `src/app` and shared components | Central orchestration; no per-page API changes required | Desktop profile fallback; no QR |
| Services page inline “LINE 傳照片…” link | Direct profile anchor | Converted to central `CTAButton` | Desktop profile fallback |
| Contact page official account ID | Direct profile anchor | Converted to central `CTAButton` | Desktop profile fallback |
| `ContactForm` submit | 13 component call sites; form data stays in React/browser memory | `prepareLineLead()` receives only `{request_id, attribution}`; success message is assembled in browser with server `HY-...` token and form content, then mobile uses official `oaMessage` | Desktop remains `DESKTOP_CROSS_DEVICE_TOKEN_HANDOFF_PENDING`; profile fallback is `DESKTOP_TOKEN_HANDOFF_PENDING_LINE1B2B` |
| `ContactForm` desktop helper link | 1 `md`-only profile anchor | Kept as a desktop-only manual fallback | Explicit 2B cross-device/QR input; not an E2A claim |

## Counts

- Direct/profile LINE URL source instances after conversion: 63 (62 `siteConfig.lineUrl` sources plus the converted Contact page account link).
- Mobile-precise source-level LINE intents: 75 (62 central CTA/link sources plus 13 `ContactForm` submit flows). The reusable `LandingHero` and `FinalCTA` call-site counts above are not added again to this source-level total.
- Desktop-pending paths: all 62 central CTA/link sources retain profile fallback behavior, and all 13 forms retain the desktop pending label; the one explicit desktop-only helper anchor is a manual fallback inside the form rather than a second form intent.
- QR entrypoints: 0. Desktop QR is intentionally not implemented in 2A.

## Required invariants

- Mobile device detection uses user-agent/touch-point signals, including iPadOS desktop-mode detection; viewport width alone is not used.
- New intent IDs are UUID v4. A retry reuses the same ID and exact attribution snapshot; a new click/submit creates a new ID.
- The browser POST body has exactly `request_id` and `attribution`; it never contains name, phone, service, area, or message.
- The client accepts only `{status:"prepared",lead_token:"HY-..."}`. Missing, malformed, timed-out, offline, 404/409/429/500, or blocked-storage conditions fall back to `siteConfig.lineUrl` without inventing a token.
- `line_contact_attempt` has one central emission path per intent and carries only safe diagnostic fields; no LINE message-received or conversion claim is made in 2A.
