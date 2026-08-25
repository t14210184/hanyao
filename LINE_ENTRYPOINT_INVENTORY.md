# LINE entrypoint inventory — LINE1B-2B

Source scan: 2026-08-25, branch `feat/line-tracking-line1b2b-desktop-qr`, baseline `9c487cbe90cf6db560e5336a5ca82b5ce1dc9d86`.

## Scope and counting rule

This is a source/component inventory, not a claim that a browser or phone has completed a LINE conversation. Each direct CTA source is counted once. Shared component call sites are listed separately so a reusable component is not multiplied by every route that imports it.

The client orchestrator is centralized in `src/components/CTAButton.tsx`, `src/components/LineDesktopQrDialog.tsx`, and `src/lib/line-contact.ts`. Every desktop CTA prepares a server-issued HY token, renders the official `oaMessage` URL as a browser-local QR, and keeps the official profile URL as fail-open. Every mobile CTA keeps the LINE1B-2A `oaMessage` behavior.

## Entrypoints

| Entry point | Current source shape | Mobile | Desktop |
| --- | --- | --- | --- |
| Shared `Header` desktop and drawer | 2 `CTAButton` LINE CTAs | prepare → official `oaMessage` | prepare → local QR; profile fail-open |
| Shared `MobileStickyCTA` | 1 `CTAButton` LINE CTA | prepare → official `oaMessage` | prepare → local QR; profile fail-open |
| Shared `Footer` | 1 `CTAButton` LINE CTA | prepare → official `oaMessage` | prepare → local QR; profile fail-open |
| Shared `LandingHero` | 1 reusable LINE `CTAButton`; 4 route call sites | prepare → official `oaMessage` | prepare → local QR; profile fail-open |
| Shared `FinalCTA` | 1 reusable LINE `CTAButton`; 26 route call sites | prepare → official `oaMessage` | prepare → local QR; profile fail-open |
| Page/service/guides/areas/cases/FAQ `CTAButton` sources | 62 `trackEventName="line_click"` sources across `src/app` and shared components | centralized 2A path | centralized QR path; no page-local QR logic |
| `ContactForm` submit | 13 component call sites; form data stays in React/browser memory | full local form message + HY token in official `oaMessage` | generic fixed message + HY token in local QR; no auto-navigation on success |
| `ContactForm` desktop helper | 1 desktop-only `CTAButton` helper, included in the 62 orchestrated CTA sources and not counted as a second form submit | centralized mobile path | local QR; profile fail-open |

## Counts

- Direct/profile `siteConfig.lineUrl` source instances: 63. All user-facing sources are now routed through `CTAButton`; profile navigation remains only a fallback path.
- Mobile precise source-level LINE intents: 75 = 62 centralized CTA sources + 13 `ContactForm` submit flows.
- Desktop precise QR intent paths: 75 = 62 centralized CTA sources + 13 `ContactForm` submit flows.
- `ContactForm` desktop precise token handoff count: 13 submit flows.
- Remaining desktop pending count: 0. Profile fallback links do not count as pending because their primary desktop path is token → local QR.
- Remaining direct un-orchestrated LINE profile sources: 0.
- QR entrypoints: 75 precise paths; QR payload is generated in the browser by `QRCodeSVG`.

## Required invariants

- Mobile device detection uses user-agent/touch-point signals, including iPadOS desktop-mode detection; viewport width alone is not used.
- New intent IDs are UUID v4. A retry reuses the same ID and exact attribution snapshot; a new click or submit creates a new ID.
- The browser POST body has exactly `request_id` and `attribution`; it never contains name, phone, service, area, or message.
- The client accepts only `{status:"prepared",lead_token:"HY-..."}`. Missing, malformed, timed-out, offline, 404/409/429/500, or blocked-storage conditions fall back to `siteConfig.lineUrl` without inventing a token.
- Desktop QR payload is `buildGenericLineMessage(lead_token)` encoded by `buildLineOaMessageUrl`; it contains only fixed copy plus the server token.
- `LineDesktopQrDialog` uses `QRCodeSVG` with `level="M"`, `marginSize={4}`, an accessibility title, Escape/close controls, and no remote QR image/service.
- `line_contact_attempt` contains only event, contact channel/method, page path, event source, and timestamp. It never emits `lead_id`, HY token, gclid, session_id, or PII.
- No client conversion event is added; verified conversion remains a signed LINE webhook concern for the later stage.
