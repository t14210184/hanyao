# HANYAO Ads → LINE Production Provider Bootstrap

基準日期：2026-09-12（Asia/Taipei）

本文件只記錄第一筆真人 Google Ads → LINE → Data Manager Production E2E 之前的 provider bootstrap。完整施工規格以 `HANYAO Google Ads → LINE 精確轉換追蹤 Production 施工規格 v1.1` 為準。

## 目前已驗證狀態

- `main` hardening 基準：`a6f16de249bc3403fa454cfac7f8bcac500f3484`
- Production release branch：`feat/ads-line-production-release`
- Production D1：`hanyao-attribution-production`
- Production D1 ID：`52453bad-90a3-4495-911b-c3d5b6cefb1f`
- Google Ads customer：`4801404246`（仍需帳號內 live-read）
- conversion action：`7674301565`（仍需帳號內 live-read）
- Production Wrangler env：已建立、dry-run PASS
- Production Cron：刻意保持 `[]`，候選部署不得排程送出 conversion
- GitHub Actions 現有 Cloudflare/Google provider credentials：未發現

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

Workflow 會先使用既有 `auth.ts` 向 Google OAuth token endpoint 換取短效 access token；只輸出 PASS/FAIL，不輸出 token、private key、client assertion 或原始 JSON。

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
2. 完整 `test:line4a`
3. `line4b-production-config.test.mjs`
4. TypeScript typecheck
5. Wrangler Production dry-run
6. provider credential presence
7. Google OAuth credential validation
8. Cloudflare Production D1 name/id readback
9. disarmed Production candidate deploy with `--secrets-file`
10. Worker secret-name readback
11. Production D1 schema readback

任何一步失敗即停止後續 provider mutation。

## 候選部署的不變條件

候選部署時：

```text
UPLOADER_ENVIRONMENT=production
GOOGLE_DATA_MANAGER_VALIDATE_ONLY=false
PRODUCTION_HUMAN_GATE=<encrypted Worker secret>
Production Cron=[]
```

因 Cron 為空，候選 Worker 即使 `validateOnly=false` 也沒有 scheduled trigger，不會自行讀取 outbox 或送 conversion。

在下列 Gate 全部驗證前，禁止把 Cron 改為 `*/5 * * * *`：

- Production D1 schema 完整
- Google Data Manager service-account OAuth PASS
- Google Ads customer/action live-read PASS
- conversion action ENABLED
- BRAID 路徑需要時 Count=`Every`
- conversion action 先維持 Secondary 驗證期
- Data Manager destination/account access 可用
- 真人 E2E 測試計畫就緒

## 官方依據

Cloudflare Workers CI/CD GitHub Actions：
https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

Cloudflare Workers secrets / `--secrets-file`：
https://developers.cloudflare.com/workers/configuration/secrets/

Cloudflare API token permissions：
https://developers.cloudflare.com/fundamentals/api/reference/permissions/

Google Data Manager API：
https://developers.google.com/data-manager/api
