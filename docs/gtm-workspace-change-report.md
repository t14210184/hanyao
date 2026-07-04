# 焓耀空調工程 GTM REST API 變更規劃與自訂 OAuth 稽核報告

本文件記錄通用 Client ID 被封鎖後，改走自訂 Google Cloud Desktop Client API 路線的執行計畫與安全性現狀。

---

## 一、 安全與依賴環境現狀

1.  **gcloud ADC 路線暫停**：已安全終止所有 gcloud authentication 進程。
2.  **安全性隔離**：本機已成功使用 [scripts/gtm-oauth-pkce-dry-run.mjs](file:///Users/joy/Documents/air%20web/scripts/gtm-oauth-pkce-dry-run.mjs) 進行認證，**完全不使用 `cloud-platform` scope**。
3.  **依賴檢查與安全保障**：
    *   本機 `.gitignore` 已成功更新，將 `secrets/`、`*oauth*.json`、`*token*.json` 以及 `application_default_credentials.json` 徹底忽略，防止 any 密鑰、憑證進入 Git 歷史紀錄。
    *   **嚴禁個資與憑證傳輸**：Access Token 與 Refresh Token 僅在 Node.js 程式運行時暫存在記憶體中，用完即焚，不寫入任何日誌或檔案，亦不要求使用者貼回。

---

## 二、 自訂 OAuth 憑證與認證檢查

*   **目標檔案**：`secrets/gtm-oauth-client.json` (Desktop Application 憑證)
*   **認證結果**：**成功 (oauth-success / access-token-ok)**。
*   **Scopes 限制**：**安全通過**。僅包含 `tagmanager.readonly`, `tagmanager.edit.containers`, `tagmanager.edit.containerversions`, `tagmanager.publish`，完全排除 `cloud-platform` 敏感權限。
*   **GTM Workspace 4 寫入套用 (Apply)**：**100% 成功套用**。
*   **GTM REST API 自動化發布**：**100% 發布成功 (Live: YES)**。

---

## 三、 GTM Container Version 發布明細

*   **Container Version ID**：`4`
*   **Version Name**：`Fix contact tracking events and pause legacy click conversions`
*   **Version Notes**：
    - Add GA4 line_contact_attempt event tracking
    - Add GA4 phone_click_attempt event tracking
    - Add Data Layer Variables for contact_channel, contact_method, lead_id, page_path, event_source, timestamp
    - Add Custom Event triggers for line_contact_attempt and phone_click_attempt
    - Pause deprecated Google Ads conversion tags for line_click and phone_click
    - No Google Ads account changes
    - No new Google Ads conversion tags
    - No PII in dataLayer / GA4 parameters
*   **發布狀態**：`SUCCESS`
*   **發布時間**：`2026-07-04T10:22:57.419Z`

---

## 四、 發布後正式環境 dataLayer 驗證結果

*   [OK] **首頁 LINE CTA 驗證**：成功送出 `line_contact_attempt` 事件，無敏感個資洩漏。
*   [OK] **首頁電話 CTA 驗證**：成功送出 `phone_click_attempt` 事件，不含 `lead_id`，無個資洩漏。
*   [OK] **Dedupe 30秒防重驗證**：連續點擊僅觸發 1 次事件，防止 GA4 事件灌水。
*   [OK] **聯絡表單 Lead ID 驗證**：成功自動產出 `HY-20260704-69ZADQ` 動態編號，且剪貼簿諮詢格式無敏感個資流入 dataLayer。
*   [OK] **FAQ CTA 驗證**：跳轉不觸發追蹤。
*   [OK] **手機版 Sticky CTA 驗證**：LINE/電話點擊獨立觸發對應事件，預防交叉誤觸。

---

## 五、 嚴格安全與進程聲明

*   [OK] **GTM 容器已成功發布上線**。
*   [OK] **Google Ads 未進行任何修改**。
*   [OK] **沒有建立任何新的 Google Ads 轉換代碼，原有的 2 個舊代碼已成功更名並設置為暫停 (paused)**。
*   [OK] **無 commit / push 新的變更**。
*   [OK] **無個資進入 dataLayer / GA4**。
