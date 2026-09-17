# HANYAO Ads RSA Candidate Package v1 — 2026-09-17

Status: `CANDIDATE_ONLY / NO_GOOGLE_ADS_MUTATION`

Base main: `12596305962dc82440cdae18e9904f86663bccd8`

Work package: `WP03 — RSA 廣告素材重構`

## Objective

Prepare two materially different responsive search ad directions for each active Search campaign while preserving the existing conversion and bidding contract.

- RSA-A: symptom / immediate-need or concrete use-case intent.
- RSA-B: trust / transparent process intent.
- Headline copy avoids the platform name `LINE` so the same RSA can coexist with a separately governed Message Asset pilot without promising that a headline click opens a messaging app.
- Copy must match the current landing-page promise and must not invent price, arrival-time, warranty or free-service claims.

## Current landing promise anchors

| Campaign | Landing | Promise anchors |
|---|---|---|
| 冷氣維修 | `/services/ac-repair/` | 不冷／滴水／漏水／異音／跳電；可先傳照片與症狀；確認原因與報價後施工 |
| 冷氣清洗保養 | `/services/ac-cleaning/` | 霉味／風量變小／滴水／冷房變差；依機型與髒污評估；可先提供機型照片與台數 |
| 冷氣安裝 | `/services/ac-installation/` | 新屋／舊換新／裝潢前；坪數、冷房能力、配管排水與室內外機位置；先提供現場照片 |
| 商用工程 | `/services/commercial-ac/` | 辦公室／店面／餐飲／廠房；系統選型、配管風管、設備配置與維護；先提供平面圖與照片 |

The executable candidate copy is stored in `scripts/ads-rsa-candidates.ts` and guarded by `scripts/ads-rsa-candidates.test.ts`.

## Static acceptance now enforced

- exactly four campaign templates;
- exactly two differentiated RSA variants per campaign template;
- 8–15 headlines per variant;
- 2–4 descriptions per variant;
- headline length <= 30 characters;
- description length <= 90 characters;
- no `LINE` in headlines;
- no duplicated headlines across A/B within the same campaign;
- no unsupported `免費`, `保證`, `最低價`, 24-hour, same-day-arrival or lifetime-warranty claims;
- candidate source contains no Google Ads endpoint or mutation path;
- rollout contract explicitly keeps budget, bidding, Primary conversion, broad match and AI Max frozen.

## Provider gate before publication

Publication is intentionally not encoded in this branch. Before any RSA create/replace action, the controller must obtain a fresh same-source Google Ads prestate for:

1. enabled ad groups;
2. enabled RSA inventory;
3. Ad Strength and Google feedback;
4. exact final URLs.

Only after that inventory can these campaign templates be mapped to exact ad groups without guessing. Publication remains `HG-ADS-RSA`; dispatch must be bounded and followed by same-source readback.

Current ChatGPT tool surface does not expose the production Google Ads account or its scoped credential, so this package does **not** claim live ad-group assignment, Ad Strength, or provider publication.

## Frozen boundaries

This package does not change:

- Google Ads budget;
- bidding strategy or target CPA;
- keywords or negative keywords;
- `HY - Verified LINE Contact` identity or Primary status;
- GTM / GA4 conversion sending;
- Data Manager uploader;
- D1 schema;
- Message Asset association;
- AI Max or broad match.
