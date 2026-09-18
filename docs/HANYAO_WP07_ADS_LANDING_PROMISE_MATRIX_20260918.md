# HANYAO WP07 — Ads × Landing Promise Matrix

Status: `CANDIDATE / GOOGLE_ADS_MUTATION=0`

Base Production main: `01b7f60b4bce362c38110c67928ae3f3e464c71e`

## Contract

| Campaign | User intent | Ad promise | First-screen action | Primary proof |
|---|---|---|---|---|
| 冷氣維修 | 現在有故障 | 傳症狀／照片先判斷 | 傳照片／症狀快速諮詢 | 持照＋先說明再修 |
| 冷氣清洗保養 | 價格／霉味／風量 | 先確認機型台數 | 傳機型照片／台數先確認 | 清洗前確認＋施工前後測試 |
| 冷氣安裝 | 費用／規劃 | 現場條件先估 | LINE 傳照片諮詢 | 坪數／配管排水規劃 |
| 商用工程 | B2B 規劃／維護 | 設備／場域評估 | LINE 傳平面圖諮詢 | VRF／VRV／冰水系統規劃能力 |

## Fresh source audit

- repair: already aligned after WP04 CRO;
- installation: hero already asks for space photos and explains sizing / piping / drainage;
- commercial: hero already asks for floor plan / site photos and explains system selection / piping / equipment placement;
- cleaning: mismatch found. RSA candidates promise model-photo / unit-count confirmation, but hero CTA was only `立即 LINE 諮詢` and the actual preparation data appeared later in FAQ.

## Bounded correction

Only cleaning first screen changes:

- hero copy now asks for model-nameplate photo, cleaning unit count and location;
- primary CTA becomes `傳機型照片／台數先確認`;
- microcopy repeats the three pieces of information and the next-step expectation.

No CTA destination, event name, HY prepare/handoff, tracking, form, budget, bidding, conversion goal, keyword, Message Asset, broad match or AI Max logic changes.

## Regression

`scripts/ads-landing-promise-matrix.test.ts` verifies:

- exactly four lanes;
- each lane maps to the RSA candidate landing path;
- required ad-promise tokens remain in RSA candidates;
- required first-screen action / promise tokens remain above the fold hero source;
- each hero keeps `line_click` attempt tracking;
- proof tokens remain on the landing page;
- the cleaning hero cannot regress to the generic `立即 LINE 諮詢` label;
- the WP07 contract has no Google Ads mutation transport.
