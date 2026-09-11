# Google Ads → LINE 精確轉換追蹤 Production 施工規格

狀態：施工版

目標 repository：`t14210184/hanyao`

施工分支：`feat/ads-line-production-hardening`

## 1. 唯一業務目標

讓 Google Ads 帶來的使用者進入焓耀網站後，只有在使用者真的向 LINE 官方帳號送出訊息，而且該訊息可可靠回溯至 Google Ads 點擊時，才建立高品質廣告轉換。

第一階段主要轉換候選固定為：

`verified_line_contact`

完整資料流：

```text
Google Ads
  ↓ gclid / gbraid / wbraid
www.xusen.pro
  ↓
第一方 attribution
  ↓
LINE CTA / ContactForm
  ↓
/api/line/prepare
  ↓
HY token
  ↓
LINE 官方帳號
  ↓
真人送出文字訊息
  ↓
LINE Messaging API webhook
  ↓
簽章驗證 + HY token 比對
  ↓
MATCHED_ADS
  ↓
D1 conversion_outbox
  ↓
Cloudflare scheduled uploader
  ↓
Google Data Manager API events:ingest
  ↓ requestId
requestStatus:retrieve
  ↓
SUCCESS / deduplicated
  ↓
Google Ads verified_line_contact
```

## 2. 訊號品質分層

### 觀察訊號

`line_contact_attempt`

用途：GA4/GTM 漏斗、CTA 健康度與渠道觀察。

不得把單純點擊 LINE、開啟 LINE、顯示 QR code 當成主要 Smart Bidding 訊號。

### 第一階段高品質轉換

`verified_line_contact`

成立條件：

1. LINE webhook 收到真人文字事件。
2. `X-Line-Signature` 驗證成功。
3. 訊息含有效 `HY-...` token。
4. token 可回查 `lead_tokens`。
5. token 可回查 attribution session。
6. attribution 至少含 `gclid`、`gbraid`、`wbraid` 其中一種有效 Google Ads identifier。
7. webhook event / message / conversion transaction 通過去重。
8. match status 為 `MATCHED_ADS`。

只有這個條件成立才建立 `conversion_outbox`。

### 後續商機訊號

第二階段增加 `qualified_line_lead`。

第三階段增加 `won_job` 與可稽核 conversion value / margin，之後才評估 Maximize Conversion Value / Target ROAS。

## 3. 保留的既有架構

不得推倒重寫下列模組：

- `src/lib/attribution.ts`
- `src/lib/line-contact.ts`
- `src/components/CTAButton.tsx`
- `src/components/ContactForm.tsx`
- `functions/api/line/prepare.ts`
- `functions/api/line/webhook.ts`
- `functions/_lib/line-webhook.ts`
- `migrations/0003_line_webhook_foundation.sql`
- `migrations/0004_google_uploader_state.sql`
- `workers/google-ads-uploader/`

目前核心設計正確：第一方保存 Google click ID，server-issued HY token 把網站 attribution 與 LINE 真人訊息串起來，只有 `MATCHED_ADS` 才建立 Google conversion outbox。

## 4. D1 的責任

Production D1 是本地稽核帳本，不以 Google Ads 報表取代。

每一筆 conversion 必須能往回追到：

```text
conversion_outbox
→ line_events
→ lead_tokens
→ attribution_sessions
→ Google click identifier
```

並能往後追到：

```text
transaction_id
→ Data Manager requestId
→ diagnostics
→ terminal state
```

必要唯一性：

- LINE webhook event ID unique
- LINE message ID unique
- `transaction_id` unique
- `(lead_token, conversion_type)` unique

## 5. Data Manager API 是正式上傳主路徑

2026 年新施工以 Google Data Manager API 為正式 offline conversion / enhanced conversions for leads ingestion 路徑。

正式 endpoint：

- `POST https://datamanager.googleapis.com/v1/events:ingest`
- `GET https://datamanager.googleapis.com/v1/requestStatus:retrieve`

Cloudflare Workers 保留 REST + `fetch()` transport，不為了使用 Node client library 增加 gRPC / google-gax runtime 依賴。

Google 官方 SDK/sample 用於 schema、fixture、warning、diagnostics 與 contract 對照。

## 6. 已融合的 Production hardening

### 6.1 ingestion `fieldWarnings`

`provider.ts` 必須在 HTTP 200 成功回應中同時讀取：

- `requestId`
- `fieldWarnings[].field`
- `fieldWarnings[].reason`

warning 不得把整筆成功 ingestion 判失敗，但必須經 sanitized Worker log 可觀測。

### 6.2 diagnostics `warningInfo`

`requestStatus:retrieve` 即使回 `SUCCESS` 仍可能有 `warningInfo.warningCounts`。

warning 必須可觀測；成功狀態仍保持成功，避免重送已接受的 conversion。

### 6.3 `FAILED` / `FAILURE` defensive normalization

REST reference 的 canonical terminal failure 為 `FAILED`；部分 Google diagnostics 文件使用 `FAILURE` 說明終態。

parser 同時接受兩者並在內部正規化成 `FAILED`，避免文件/版本差異造成 `UNKNOWN`。

### 6.4 TOO_RECENT_CLICK 六小時成熟期

錯誤：

`PROCESSING_ERROR_REASON_TOO_RECENT_CLICK`

不得永久標記 `failed`。

處理：

```text
FAILED + TOO_RECENT_CLICK
→ pending
→ 保留原 transaction_id
→ 清除舊 requestId / diagnostic lifecycle
→ next_retry_at >= conversion event timestamp + 6h
→ 再送同一 conversion identity
```

Google 明確要求 click 發生未滿六小時時，等滿六小時後重新上傳。

### 6.5 stale `processing` recovery

Worker 可能在 claim 後、save terminal/intermediate state 前中斷。

每個 scheduler cycle 在正常 selection 前執行 bounded recovery：

```text
processing + google_request_id IS NULL + stale >= 30m
→ pending

processing + google_request_id IS NOT NULL + stale >= 30m
→ submitted
```

使用單一 bounded D1 update，避免 crash 造成永久漏單。

### 6.6 duplicate transaction

不得用新的 transaction ID 規避重複。

若 Google diagnostics 明確回 duplicate transaction，且可判定屬於相同本地 transaction，標記 `deduplicated` success-equivalent。

## 7. 外部成熟實作採用原則

### 可直接參考/移植小型模式

- Google Data Manager 官方 sample / client：官方 schema、warning、diagnostics、fixture。
- `jitsucom/jitsu`：MIT；click ID retention、Data Manager mapping、consent/user data 模式。
- `stape-io/google-conversion-events-tag`：Apache-2.0；identifier / consent / Data Manager field mapping。
- `line/line-openapi`：Apache-2.0；LINE webhook schema 與 fixture。

### 只借演算法，不搬受限原碼

- Rejourney：stale-claim / outbox recovery 模式；後端授權不適合直接搬入本專案。
- Chatwoot enterprise：客服事件送 Data Manager 的產品模式，只作架構佐證。
- 商用 LINE tracking SaaS：借產品流程，不依賴其封閉 API。

### 不採用為核心

- 舊 Google Ads API offline conversion uploader。
- 需要 legacy developer-token allowlist 的新施工路徑。
- 為此專案全面搬遷 server-side GTM。
- 把 Zapier / Google Sheets 變成正式主 conversion pipeline。

這些可作備援或交叉驗證，不取代已存在的 D1 outbox + Worker。

## 8. Production 上線前 Google Ads Gate

正式非 validate-only upload 前必須重新讀回真實 Ads 設定：

- Google Ads account：目前設定候選 `4801404246`
- conversion action：目前設定候選 `7674301565`
- action 存在且 enabled
- conversion source / action 類型支援 Import from clicks / Data Manager offline conversion
- BRAID 使用情境下 Count 設定符合 Google 現行規則
- enhanced conversions 設定與必要 terms/consent 已完成
- campaign / custom goal 不會把舊低品質 click conversion 誤納入主要出價訊號
- service account 對正確 destination 有權限

Repository 內的 ID 只是設定候選；沒有 live Ads readback 不得把它描述成已驗證 Production 真值。

## 9. Cloudflare Production Gate

部署前確認：

- Pages Production D1 binding 指向 `hanyao-attribution-production`
- migration `0004_google_uploader_state.sql` 已在 Production 套用
- LINE webhook Production route 存活
- `LINE_CHANNEL_SECRET` 存在
- Data Manager API 已在正確 Google Cloud project 啟用
- `GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON` 以 Cloudflare secret 提供
- uploader Worker 綁同一個 Production D1
- Cron Trigger 已設定
- `UPLOADER_ENVIRONMENT=production`
- `GOOGLE_DATA_MANAGER_VALIDATE_ONLY=false`
- `PRODUCTION_HUMAN_GATE=HUMAN_GATE_CONFIRMED`

任何一項缺失均 fail closed。

Secrets 不得 commit GitHub。

## 10. 測試 Gate

目前 branch 必須通過：

```bash
npm run test:line4a
npm run typecheck
```

LINE4A hardening regression 至少覆蓋：

1. ingestion `fieldWarnings`
2. diagnostic `warningInfo`
3. `FAILURE → FAILED` normalization
4. `SUCCESS + warningInfo` 仍保持 success
5. TOO_RECENT_CLICK requeue
6. same transaction ID preservation
7. stale-claim scheduler hook
8. bounded D1 stale recovery SQL
9. 既有 auth / retry / validateOnly / duplicate / diagnostics regression

GitHub Actions：`.github/workflows/ads-line-hardening.yml`

CI 紅燈不得進 Production。

## 11. 第一筆真人 E2E 驗收

禁止用自家付費廣告人為製造漂亮 conversion 數字。

等待真實 Google Ads 使用者：

```text
Google Ads click
→ landing page 保存 click ID
→ /api/line/prepare 建立 HY token
→ 使用者在 LINE 真正送訊息
→ webhook signature PASS
→ HY token MATCH
→ MATCHED_ADS
→ verified_line_contact outbox pending
→ Data Manager ingest
→ requestId persisted
→ diagnostics terminal success/deduplicated
→ Google Ads 報表出現 conversion
```

只有這條鏈完整通過才可宣告：

`ADS_LINE_PRODUCTION_E2E_PASS`

HTTP 200、Worker deployed、unit test PASS 都不是單獨的完成定義。

## 12. Smart Bidding 切換

第一筆與後續資料穩定前，`verified_line_contact` 先作觀察/驗證。

資料品質、數量、延遲與 Ads/D1 對帳穩定後：

```text
verified_line_contact
→ Primary
→ Maximize Conversions
→ 累積穩定 CPA / conversion volume
→ Target CPA
```

舊的 LINE click / phone click 保持 Secondary，並檢查 custom goals，避免 Secondary signal 被間接拿去出價。

後續有 `qualified_line_lead` / `won_job` 與可信 value 後，再評估 value-based bidding。

不得承諾一定降低廣告成本；工程目標是提高 bidding signal 的真實性與商業品質，讓 Google Ads 有條件把預算往真正會聯絡、詢價與成交的使用者移動。

## 13. 第一個 E2E PASS 前暫緩項目

- GA4 dashboard 美化
- 舊 GTM `lead_id` 清理
- server-side GTM migration
- Cloudflare Queue / Workflows 重構
- BigQuery
- CRM 重寫
- n8n / Zapier 主路徑
- 電話 conversion 大改
- Target ROAS/value bidding
- AI lead scoring

這些不得阻塞第一筆真人 Ads → LINE → Ads 閉環。

## 14. 後續施工 AI 的固定操作順序

1. 先讀本文件與目前 branch HEAD。
2. 讀 CI 結果；紅燈先修，不重做架構研究。
3. 完成 Google Ads live-read Gate。
4. 完成 Cloudflare Production prestate readback。
5. 若 Production 設定缺失，只做最小必要變更。
6. 部署 uploader Worker / Cron。
7. 部署後讀回 Worker、binding、Cron 與 sanitized health evidence。
8. 等第一筆真人 conversion，沿 D1 → requestId → diagnostics → Ads 報表逐節驗收。
9. E2E PASS 後才處理 Primary / Smart Bidding 切換。

不得用 WIN11 作 `hanyao` 開發機。不得把另一個專案或治理 repo 當成本專案施工面。

## 15. 參考來源

Google：

- Data Manager API: https://developers.google.com/data-manager/api
- Send events: https://developers.google.com/data-manager/api/devguides/events/send-events
- Diagnostics: https://developers.google.com/data-manager/api/devguides/diagnostics
- requestStatus.retrieve: https://developers.google.com/data-manager/api/reference/rest/v1/requestStatus/retrieve
- Offline conversion troubleshooting: https://support.google.com/google-ads/answer/13321563
- Upgrade offline imports: https://support.google.com/google-ads/answer/15479791

可借用 OSS：

- https://github.com/googleads/data-manager-node
- https://github.com/jitsucom/jitsu
- https://github.com/stape-io/google-conversion-events-tag
- https://github.com/line/line-openapi

本文件的功能範圍以目前 `hanyao` repository 與 Google 2026 Data Manager API 現行規格為準；若 Google API schema 之後變更，先以官方 REST reference / release notes 重新驗證，再做最小相容修改。
