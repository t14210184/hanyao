# HANYAO Ads → LINE Production Provider Bootstrap

基準日期：2026-09-12（Asia/Taipei）

本文件只記錄第一筆真人 Google Ads → LINE → Data Manager Production E2E 之前的 provider bootstrap。完整施工規格以 `HANYAO Google Ads → LINE 精確轉換追蹤 Production 施工規格 v1.1` 為準。

## 目前已驗證狀態

- `main` hardening 基準：`a6f16de249bc3403fa454cfac7f8bcac500f3484`
- Production release branch：`feat/ads-line-production-release`
- Production D1：`hanyao-attribution-production`
- Production D1 ID：`52453bad-90a3-4495-911b-c3d5b6cefb1f`
- Google Ads customer：`4801404246`（已建立自動 live-read gate；待 provider credential 執行）
- conversion action：`7674301565`（已建立自動 live-read gate；待 provider credential 執行）
- Production Wrangler env：已建立、精確 `--secrets-file` dry-run 已納入 CI
- Production Cron：刻意保持 `[]`，候選部署不得排程送出 conversion
- Production HTTP 零寫入安全探針：已建立，驗證 cross-origin prepare 與未簽章 webhook 在 D1 前拒絕
- GitHub Actions 現有 Cloudflare/Google provider credentials：未發現

## Google Ads API 2026-09 存取模型

Developer Token 已於 2026-09-09 淘汰為 API access-management 機制。現行存取層級綁定產生 OAuth credential 的 Google Cloud Project。API request 可停止傳送 `developer-token` header；Google 官方表示目前送出也會被忽略，未來 major version 會拒絕。

HANYAO 不需要 Adspirer 或第三方 MCP 來完成 Production live-read。相同的 Google service account 可分別取得：

- Data Manager scope：用於 conversion delivery 與 validate-only destination probe。
- Google Ads scope `https://www.googleapis.com/auth/adwords`：用於 Google Ads API v25 唯讀 GAQL live gate。

service account 所屬 Google Cloud Project 必須：

1. 啟用 Google Ads API。
2. 對 Production 帳戶取得至少 Explorer Access。
3. service account 本身必須被授權存取 Google Ads customer `4801404246`，或可經具權限的 manager account 存取。

Explorer Access 對 Production 帳戶提供 2,880 operations／滑動 24 小時，足以支應本專案少量唯讀驗證。

若 service account 是透過 manager account 存取 customer，可設定可選 GitHub Variable/Secret：

```text
GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

若 service account 已直接加入 `4801404246`，保持未設定即可。舊 MCC `9401096633` 只有在實際授權拓撲需要 manager context 時才應填入，不因歷史存在而強制傳送。

## GitHub 需要的三項 provider material

### 1. `CLOUDFLARE_API_TOKEN`

類型：GitHub Actions Secret。

禁止使用 Cloudflare Global API Key。

建議建立自訂 API Token，資源只限 HANYAO 所在 Cloudflare account，權限採最小集合：

- Account / Workers Scripts / Edit
- Account / D1 / Edit
- Account / Account Settings / Read
- Account / Workers Tail / Read

目前流程不需要 DNS、Workers KV、R2、Billing、API Token management 或 Zone write 權限。

若 Cloudflare/Wrangler 未來實際回應顯示某個唯讀 metadata 權限不足，才依同來源錯誤增補，不先擴權。

### 2. `CLOUDFLARE_ACCOUNT_ID`

類型：優先使用 GitHub Repository Variable；也接受 Secret。

Account ID 不是 bearer credential，不需與 API token 混在同一 secret。

Workflow 亦相容歷史別名：

- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`

### 3. `GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON`

類型：GitHub Actions Secret。

必須是完整 Google service-account JSON，且該 service account 對目標 Google Ads account / Data Manager ingestion path 有必要存取權。

同一份 credential 會被 CI 分成三層驗證：

1. Data Manager OAuth token exchange。
2. Data Manager `validateOnly=true` destination/request probe。
3. Google Ads API v25 `SearchStream` 唯讀 live-read。

所有 preflight 僅輸出非敏感 PASS/FAIL、必要 enum/計數與固定 account/action ID，不輸出 access token、private key、JWT assertion 或原始 service-account JSON。

## Google Ads live-read Gate

`line4b-google-ads-live-preflight.ts` 使用 Google Ads API v25 直接查：

```text
conversion_action.id
conversion_action.resource_name
conversion_action.name
conversion_action.status
conversion_action.type
conversion_action.category
conversion_action.origin
conversion_action.primary_for_goal
conversion_action.counting_type
```

針對 action `7674301565` 的硬性啟用前條件：

- action 唯一存在。
- `status=ENABLED`。
- `counting_type=MANY_PER_CLICK`，對應 UI 的 Every；BRAID 路徑不得使用 One-per-click。
- `primary_for_goal=false`，對應 Google Ads UI 的 Secondary，避免驗證期直接污染 Smart Bidding。
- 若有 Enabled `CustomConversionGoal` 包含該 action，還會查 `conversion_goal_campaign_config`；只要任何未移除 campaign 正在使用該 custom goal，就阻擋，因 custom goal 可繞過 `primary_for_goal=false` 仍使該 action 可出價。

建議但不是 Data Manager transport 的硬失敗：

- `category=QUALIFIED_LEAD` 或 `CONVERTED_LEAD`。

若類別不是上述兩者，preflight 會列 advisory；是否在正式 E2E 前修改依實際既有 action 與 Google Ads 帳號資料判定，不在沒有 live-read 的情況下猜測。

`customer_conversion_goal.biddable` 會一併讀回作後續切換 Primary 的依據，但在 `primary_for_goal=false` 時，正常 customer/campaign goals 不會令該 action 進入出價；CustomConversionGoal 例外已由上述獨立 Gate 攔截。

## 不需要人工建立的 secret

`PRODUCTION_HUMAN_GATE` 不要求另外保存在 GitHub。

目前人類已明確授權同一 HANYAO Mission 持續施工至 Production E2E，因此候選部署 workflow 在所有 provider preflight PASS 後，會在 `/tmp` 內建立 mode `0600` 的短暫 secrets JSON，加入：

```text
PRODUCTION_HUMAN_GATE=HUMAN_GATE_CONFIRMED
```

並與 `GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON` 一起使用 Wrangler `--secrets-file` 首次部署。暫存檔於 deploy step 結束時刪除；不得寫入 repository、artifact 或 log。

## 自動候選部署 Gate

`.github/workflows/ads-line-production-preflight.yml` 必須依序通過：

1. `npm ci`
2. 完整 `test:line4a`，包含 scoped OAuth regression
3. `line4b-production-config.test.mjs`
4. TypeScript typecheck
5. Wrangler Production `--secrets-file` 精確 dry-run
6. provider credential presence
7. Google Data Manager OAuth credential validation
8. Data Manager `validateOnly=true` destination/request validation
9. Google Ads API v25 conversion action + goal live-read Gate
10. Cloudflare Production D1 name/id readback
11. Production D1 schema prestate
12. 缺 0004 schema 時才套用 pending remote migrations
13. Production D1 完整欄位與 `line_events` readback
14. disarmed Production candidate deploy with `--secrets-file`
15. Worker secret-name readback

任何一步失敗即停止後續 provider mutation。

## 候選部署的不變條件

候選部署時：

```text
UPLOADER_ENVIRONMENT=production
GOOGLE_DATA_MANAGER_VALIDATE_ONLY=false
PRODUCTION_HUMAN_GATE=<encrypted Worker secret>
Production Cron=[]
```

因 Cron 為空，候選 Worker 即使 `validateOnly=false` 也沒有 scheduled trigger，不會自行讀取 outbox 或送 conversion。Cloudflare Wrangler 目前定義明確的空 cron 陣列會移除既有 Cron Trigger，而不是保留舊值。

在下列 Gate 全部驗證前，禁止把 Cron 改為 `*/5 * * * *`：

- Production D1 schema 完整
- Google Data Manager service-account OAuth PASS
- Data Manager validate-only destination PASS
- Google Ads customer/action live-read PASS
- conversion action ENABLED
- BRAID 路徑 Count=`Every` / API `MANY_PER_CLICK`
- conversion action 維持 Secondary / API `primary_for_goal=false`
- 沒有 CustomConversionGoal 繞過 Secondary 進入出價
- Production candidate Worker secret 名稱讀回 PASS
- 真人 E2E 測試計畫就緒

## 官方依據

Google Ads Developer Token sunset：
https://developers.google.com/google-ads/api/docs/api-policy/developer-token

Google Ads API access levels：
https://developers.google.com/google-ads/api/docs/api-policy/access-levels

Google Ads API v25 conversion action fields：
https://developers.google.com/google-ads/api/fields/v25/conversion_action

Google Ads conversion goals：
https://developers.google.com/google-ads/api/docs/conversions/goals/overview

Google Ads campaign/custom goals：
https://developers.google.com/google-ads/api/docs/conversions/goals/campaign-goals

Cloudflare Workers CI/CD GitHub Actions：
https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

Cloudflare Workers secrets / `--secrets-file`：
https://developers.cloudflare.com/workers/configuration/secrets/

Cloudflare API token permissions：
https://developers.cloudflare.com/fundamentals/api/reference/permissions/

Google Data Manager API：
https://developers.google.com/data-manager/api
