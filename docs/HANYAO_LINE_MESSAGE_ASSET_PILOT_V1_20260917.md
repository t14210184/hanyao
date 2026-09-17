# HANYAO LINE Message Asset Pilot v1 — 2026-09-17

Status: `CANDIDATE_ONLY / PREFLIGHT_READY / NO_GOOGLE_ADS_MUTATION`

Base main: `65b5116c69f21025f35bc7134ba8f78131332cc6`

Work package: `WP05 — Google LINE Message Asset Pilot`

## 1. Pilot scope

The first pilot remains bounded to the existing `冷氣維修` Search campaign.

Account-specific plan evidence captured on 2026-09-17 showed:

- Message platform: `Line`
- Line ID: `@451vpomq`

This is historical account-UI evidence, not a fresh provider read. It must be rechecked in Google Ads immediately before any production association.

Starter-message candidates:

1. `您好，我的冷氣有問題，想先傳照片或症狀請協助判斷。`
2. `您好，我想詢問冷氣維修，稍後會傳照片與所在地區，請協助評估。`

The final text remains subject to the actual Google Ads UI policy and field validation at dispatch time.

## 2. Fresh official constraints checked on 2026-09-17

Current Google Ads Help says message assets are Beta and require an eligible advertiser, good policy history and completion of Advertiser Verification. Search and Performance Max are supported.

The current public Help flow says:

- the ad headline still opens the website;
- only the message CTA opens the messaging conversation;
- headlines must not mention the messaging platform;
- an approved asset makes `Leads from Messages` available;
- Search setup exposes `Messages from your ads`;
- current creation guidance directs advertisers toward a Conversions goal/bid flow;
- when the message button serves, calls, lead forms and other asset types do not serve at the same time;
- Android message ads are globally eligible;
- Taiwan is not in the current public iOS eligible-country list.

Verification policy allows either:

- the exact messaging-platform link on the advertised business site / social page, with a verification URL on the same domain as the ad display URL; or
- domain ownership verification through Search Console linking or a Google Ads conversion / remarketing tag.

HANYAO already has the exact official LINE profile link in `src/data/site.ts` and uses `siteConfig.lineUrl` across prominent website CTAs, including Header, Footer and LandingHero.

## 3. Critical LINE / API mismatch

There is an important account-specific Beta mismatch that must not be hidden by automation:

- HANYAO's account UI snapshot exposes `Line` and `Line ID`.
- The current public Google Ads Help pages mainly document WhatsApp, SMS, Facebook Messenger and Zalo.
- Google Ads API v25 exposes `BusinessMessageProvider` values for WhatsApp, Facebook Messenger and Zalo, but not LINE.
- The current API business-message guide is allowlist-oriented and does not provide a documented LINE mutation contract.

Therefore this pilot **must not attempt to manufacture a LINE provider payload through Google Ads API v25**. The Production route is:

`fresh Google Ads UI prestate -> HG-ADS-MESSAGE-PILOT -> bounded UI association once -> same-source Google Ads UI readback`.

## 4. Goal isolation

`HY - Verified LINE Contact` remains the canonical business conversion:

- conversion action `7674301565`
- `primary_for_goal = false`
- Message Asset click is **not** a verified LINE contact
- `Leads from Messages` is **not** renamed or mapped to HY
- no fake HY token is generated for ad-direct messages
- no Google message event writes the canonical HY conversion

Any new Google message goal must remain separately identifiable. If the UI attempts to make it Primary or to alter the campaign optimization set, stop and escalate that exact change as a separate Human Gate.

## 5. Bidding safeguard

The plan snapshot says the current live Search campaigns are in the `TARGET_SPEND / Maximize Clicks` family. Current public Message Asset guidance directs creation toward a Conversions goal flow, so the conflict must be tested in the actual account UI rather than assumed away.

Allowed pilot outcome:

- associate the bounded LINE message asset without changing the existing campaign bidding strategy or frozen conversion identity.

Stop condition:

- if the UI requires conversion-based Smart Bidding, changes the campaign optimization set, or otherwise couples the message asset to a bid-strategy mutation.

Fallback:

- propose an isolated campaign / experiment only after a separate budget and strategy approval. Do not mutate the current `冷氣維修` bidding configuration to make the Beta fit.

## 6. Call-cannibalization guardrail

Google says other asset types do not serve simultaneously when the message button serves. The pilot therefore measures total real contacts, not only message clicks.

Required breakouts include:

- eligible message impressions;
- message clicks;
- message conversations when available;
- Android performance;
- iOS visibility / absence;
- call clicks and tracked calls;
- irrelevant chats;
- cost per real conversation.

A message-click increase with a compensating call-lead decrease is not automatically a win.

## 7. Observation rule

Project-level pilot heuristic, not a Google platform rule:

- minimum observation: 14 days;
- prefer at least 100 Message Asset clicks if traffic permits;
- if sample remains small, report directional evidence only.

## 8. Exact provider prestate required before dispatch

Before the human-gated Production association, same-source Google Ads UI evidence must capture:

1. Advertiser Verification status;
2. Message Asset Beta eligibility is still present;
3. `Line` and `Line ID` fields still exist;
4. current `冷氣維修` bidding strategy;
5. current campaign conversion goals / optimization set;
6. current call and lead-form asset associations;
7. existing message-asset inventory;
8. current message-asset policy / verification status.

No Production dispatch may be inferred from this repository candidate package.

## 9. Frozen boundaries

This package does not change:

- budget;
- bidding strategy;
- keywords or negative keywords;
- `HY - Verified LINE Contact` identity or Primary status;
- GTM / GA4;
- D1;
- uploader;
- broad match;
- AI Max.

## 10. Official references

- https://support.google.com/google-ads/answer/14888522
- https://support.google.com/google-ads/answer/16669188
- https://support.google.com/google-ads/answer/16669189
- https://support.google.com/google-ads/answer/16669591
- https://support.google.com/adspolicy/answer/16471781
- https://developers.google.com/google-ads/api/docs/assets/business-message-assets
- https://developers.google.com/google-ads/api/reference/rpc/v25/BusinessMessageProviderEnum.BusinessMessageProvider
