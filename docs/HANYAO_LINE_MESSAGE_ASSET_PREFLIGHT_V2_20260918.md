# HANYAO LINE Message Asset API Preflight v2 — 2026-09-18

Status: `READ_ONLY_CANDIDATE / NO_GOOGLE_ADS_MUTATION`

Base Production main: `01b7f60b4bce362c38110c67928ae3f3e464c71e`

## Purpose

把 WP05 Production 前置檢查中 Google Ads API 能證明的部分自動化，避免每次都靠人工畫面重新抄錄。

本版本不建立、不關聯、不啟用任何 Message Asset，也不改預算、出價、關鍵字、conversion goal、GTM、GA4、D1 或 uploader。

## Fresh official delta checked on 2026-09-18

Google Ads Help 仍把 Message Asset 標示為 Beta，Search 與 Performance Max 可使用。

目前公開設定文件只明列 WhatsApp、SMS、Facebook Messenger、Zalo。Google Ads API v25 的 BusinessMessageProvider 公開 enum 為：

- WHATSAPP
- FACEBOOK_MESSENGER
- ZALO

公開 API / setup Help 均未公開 LINE provider。HANYAO 於 2026-09-17 帳戶 UI 曾看見 `Line` / `Line ID`，因此仍把 LINE 視為帳戶級 Beta/UI evidence；每次 Production association 前必須 fresh UI recheck，禁止由 API payload偽造 LINE。

Official references:

- https://support.google.com/google-ads/answer/14888522
- https://support.google.com/google-ads/answer/16669188
- https://support.google.com/google-ads/answer/16669189
- https://support.google.com/google-ads/answer/16669591
- https://support.google.com/adspolicy/answer/16471781
- https://developers.google.com/google-ads/api/docs/assets/business-message-assets
- https://developers.google.com/google-ads/api/fields/v25/asset
- https://developers.google.com/google-ads/api/fields/v25/campaign_asset
- https://developers.google.com/google-ads/api/fields/v25/campaign_conversion_goal
- https://developers.google.com/google-ads/api/fields/v25/conversion_goal_campaign_config

## Automated API prestate

`scripts/ads-line-message-live-preflight.ts` performs only Google Ads SearchStream reads and reports:

1. exact `冷氣維修` campaign identity/status/channel;
2. current bidding strategy type/system status;
3. conversion goal config level and custom goal pointer;
4. campaign conversion goals and biddability;
5. active Business Message / Call / Lead Form links at customer, campaign and ad-group scopes;
6. existing Business Message asset inventory and public policy/review status;
7. explicit remaining UI-only gates.

Credential contract:

- `GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON`
- optional `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `MESSAGE_ASSET_PREFLIGHT_LIVE_REQUIRED=1` makes missing credential fail closed.

The script contains no Google Ads mutate transport.

## UI-only gates that remain

The public API cannot prove HANYAO's account-specific LINE Beta state. Before any association, the UI still must prove:

1. Advertiser Verification status;
2. Message Asset Beta eligibility remains available;
3. `Line` and `Line ID` fields still exist;
4. `Messages from your ads` can be selected without changing bidding strategy;
5. adding the asset does not alter the frozen campaign optimization set;
6. LINE-specific policy/verification state after save.

## Serving caveat

Current Help states that when the message button serves, call, lead-form and other asset types do not serve at the same time. Therefore the pilot KPI remains total real contacts, not message clicks alone.

Android message ads are globally eligible. Taiwan is not in the current public iOS eligible-country list, so iOS absence must not be misread as campaign failure.

## Stop conditions

No Production association if the UI:

- forces a bidding-strategy change;
- changes the frozen campaign optimization set;
- changes `HY - Verified LINE Contact` identity or Primary/Secondary state;
- no longer exposes LINE;
- cannot verify the message asset;
- presents ambiguous or contradictory provider state.

In those cases, preserve the current Search campaign and report the exact blocker.
