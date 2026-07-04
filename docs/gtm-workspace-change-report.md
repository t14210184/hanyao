# 焓耀空調工程 GTM REST API 變更規劃與自訂 OAuth 稽核報告

本文件記錄通用 Client ID 被封鎖後，改走自訂 Google Cloud Desktop Client API 路線的執行計畫與安全性現狀。

---

## 一、 安全與依賴環境現狀

1.  **gcloud ADC 路線暫停**：已安全終止所有 gcloud authentication 進程。
2.  **安全性隔離**：本機已成功使用 [scripts/gtm-oauth-pkce-dry-run.mjs](file:///Users/joy/Documents/air%20web/scripts/gtm-oauth-pkce-dry-run.mjs) 進行認證，**完全不使用 `cloud-platform` scope**。
3.  **依賴檢查與安全保障**：
    *   本機 `.gitignore` 已成功更新，將 `secrets/`、`*oauth*.json`、`*token*.json` 以及 `application_default_credentials.json` 徹底忽略，防止任何密鑰、憑證進入 Git 歷史紀錄。
    *   **嚴禁個資與憑證傳輸**：Access Token 與 Refresh Token 僅在 Node.js 程式運行時暫存在記憶體中，用完即焚，不寫入任何日誌或檔案，亦不要求使用者貼回。

---

## 二、 自訂 OAuth 憑證與認證檢查

*   **目標檔案**：`secrets/gtm-oauth-client.json` (Desktop Application 憑證)
*   **認證結果**：**成功 (oauth-success / access-token-ok)**。
*   **Scopes 限制**：**安全通過**。僅包含 `tagmanager.edit.containers` 與 `tagmanager.readonly`，完全排除 `cloud-platform` 敏感權限。
*   **GTM Workspace 4 寫入套用 (Apply)**：**100% 成功套用** (於 2026-07-04 18:11 順利完成寫入)。

---

## 三、 GTM Workspace 4 實際變更結果

GTM REST API 已成功對 Workspace 4 完成以下變更：

### 1. Variables (變數) ➔ 成功建立 / 沿用
*   **DLV - contact_channel** (資料層：`contact_channel`)
*   **DLV - contact_method** (資料層：`contact_method`)
*   **DLV - lead_id** (資料層：`lead_id`)
*   **DLV - page_path** (資料層：`page_path`)
*   **DLV - event_source** (資料層：`event_source`)
*   **DLV - timestamp** (資料層：`timestamp`)

### 2. Triggers (觸發條件) ➔ 成功建立 / 沿用
*   **CE - line_contact_attempt** (自訂事件：`line_contact_attempt`)
*   **CE - phone_click_attempt** (自訂事件：`phone_click_attempt`)

### 3. GA4 Event Tags (GA4 代碼) ➔ 成功建立
*   **GA4 Event - line_contact_attempt**
    *   事件名稱：`line_contact_attempt`
    *   參數包含上述 6 個 `DLV` 變數 (包含 `lead_id`)
    *   觸發條件：`CE - line_contact_attempt`
*   **GA4 Event - phone_click_attempt**
    *   事件名稱：`phone_click_attempt`
    *   參數包含除 `lead_id` 外的 5 個 `DLV` 變數 (**注意：不含 lead_id**)
    *   觸發條件：`CE - phone_click_attempt`

### 4. 舊代碼暫停與 Deprecated 改名 ➔ 成功完成
*   **`Deprecated - Google Ads Conversion - line_click`** (GTM Tag ID: `12`) ➔ 已改名並成功設置為**暫停 (paused: true)**。
*   **`Deprecated - Google Ads Conversion - phone_click`** (GTM Tag ID: `11`) ➔ 已改名並成功設置為**暫停 (paused: true)**。

---

## 四、 嚴格安全與進程聲明

*   [OK] **GTM 容器未進行任何發布、未建立版本**。
*   [OK] **Google Ads 未進行任何修改**。
*   [OK] **目前無任何程式碼 commit 或 push** (僅保留本地未 commit 追蹤修改)。
*   [OK] **未安裝任何第三方 npm 套件**。
*   [OK] **沒有開啟任何 Chrome UI 自動化或偵錯連接埠**。
*   [OK] **可安全進入 GTM Preview 測試階段**。
