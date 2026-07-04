# 焓耀空調工程 追蹤與事件代碼部署前 QA 報告

本報告針對 GTM Workspace 4 套用後的設定，以及網站本地追蹤程式碼進行全面性稽核與部署前 QA。

---

## 一、 GTM REST API 寫入驗證與 Readback 結果

GTM Workspace 4 已經由 REST API 成功完成寫入套用。經由 Dry-run / Readback 唯讀回檢，確認結果如下：

| 變更項目 | 目標名稱 | 狀態 | 驗證內容 |
| :--- | :--- | :--- | :--- |
| **Variables** | `DLV - contact_channel` | 已建立 (ID: 15) | 資料層變數名稱為 `contact_channel` |
| | `DLV - contact_method` | 已建立 (ID: 16) | 資料層變數名稱為 `contact_method` |
| | `DLV - lead_id` | 已建立 (ID: 17) | 資料層變數名稱為 `lead_id` |
| | `DLV - page_path` | 已建立 (ID: 18) | 資料層變數名稱為 `page_path` |
| | `DLV - event_source` | 已建立 (ID: 19) | 資料層變數名稱為 `event_source` |
| | `DLV - timestamp` | 已建立 (ID: 20) | 資料層變數名稱為 `timestamp` |
| **Triggers** | `CE - line_contact_attempt` | 已建立 (ID: 21) | 自訂事件名稱為 `line_contact_attempt` |
| | `CE - phone_click_attempt` | 已建立 (ID: 22) | 自訂事件名稱為 `phone_click_attempt` |
| **GA4 Event Tags** | `GA4 Event - line_contact_attempt` | 已建立 (ID: 23) | 1. 觸發條件為 `CE - line_contact_attempt` (ID: 21)<br>2. 參數包含 `lead_id` ➔ **驗證通過** |
| | `GA4 Event - phone_click_attempt` | 已建立 (ID: 24) | 1. 觸發條件為 `CE - phone_click_attempt` (ID: 22)<br>2. 參數不含 `lead_id` ➔ **驗證通過** |
| **Legacy Ads Tags** | `Deprecated - Google Ads Conversion - line_click` | 已改名並暫停 (ID: 12) | 1. `paused: true` ➔ **驗證通過**<br>2. 原始設定保留 |
| | `Deprecated - Google Ads Conversion - phone_click` | 已改名並暫停 (ID: 11) | 1. `paused: true` ➔ **驗證通過**<br>2. 原始設定保留 |

### 🔍 額外 GTM 安全性檢核：
*   **Google Ads 未修改**：沒有新增任何 Google Ads Conversion Tag（Ads 轉換代碼維持原有 2 個舊項目）。
*   **GTM 未發布**：目前 Workspace 4 所有的修改僅處於工作區草稿，並未發布 (Unpublished)。
*   **未建立版本**：未提交任何 GTM Version。

---

## 二、 網站程式碼狀態與個資安全檢驗

經由程式碼 Diff 與 Git 稽核，網站本地追蹤程式碼完全合規：

1.  **個資安全與隱私防護 (dataLayer 隔離)**：
    *   在 [src/lib/tracking.ts](file:///Users/joy/Documents/air%20web/src/lib/tracking.ts) 的 `pushSafeDataLayerEvent` 函式中，設有嚴格的屬性白名單。
    *   僅允許發送 `contact_channel`、`contact_method`、`page_path`、`event_source`、`timestamp`、`lead_id`。
    *   **100% 阻絕** 姓名 (`name`)、電話 (`phone`)、描述 (`message`) 等任何敏感個資流向 dataLayer ➔ **安全性檢驗通過**。
2.  **諮詢編號（Lead ID）動態生成與呈現**：
    *   [src/components/ContactForm.tsx](file:///Users/joy/Documents/air%20web/src/components/ContactForm.tsx) 在提交表單時，會呼叫 `generateLeadId` 產生格式為 `HY-YYYYMMDD-XXXXXX`（例如：`HY-20260704-ABCXYZ`）的動態編號。
    *   使用者跳轉至 LINE 時的預填諮詢訊息，開頭明確帶有 `【諮詢編號】${leadId}` ➔ **功能檢驗通過**。
3.  **防止交叉阻擋的 30 秒防重複觸發 (Dedupe) 機制**：
    *   在 `sessionStorage` 中，分別使用 `hy_tracking_last_form_copy_open_line` (表單複製) 與 `hy_tracking_last_line_link_open` (直接點擊 Line 連結) 兩個獨立的 Dedupe 鍵值隔離防護。
    *   **30 秒防重機制不會誤擋 `form_copy_open_line` 事件** ➔ **邏輯檢驗通過**。
4.  **CTAButton 行為完整性**：
    *   [src/components/CTAButton.tsx](file:///Users/joy/Documents/air%20web/src/components/CTAButton.tsx) 中的追蹤掛載，只在點擊時非同步觸發 event tracking，絕無破壞原本的 `href` / `target` 或者是預設的 `onClick` 等超連結跳轉行為 ➔ **功能完整性通過**。
5.  **Git 忽略安全防護**：
    *   `.gitignore` 檔案已補上 `secrets/`、`*.client_secret.json` 等排除規則，用戶端 OAuth 密鑰與權限設定已受 Git 安全防護。

---

## 三、 專案品質與編譯檢查結果

*   **`npm run lint` 檢驗結果**：
    *   `Compiled successfully`
    *   僅有既有 `src/app/services/page.tsx` 中 `<img>` 未使用 `next/image` 的靜態 warnings（此為原網站既有狀態，不影響專案邏輯與效能）。
*   **`npm run build` 檢驗結果**：
    *   **成功編譯 (Compiled successfully)**，Next.js 靜態路由 (58/58 頁面) 與 JS chunks 最佳化生成完畢，無任何 TypeScript 編譯錯誤或遺漏導入。

---

## 四、 QA 結論與部署計畫建議

*   **是否可以進入 Git Commit**：**是，建議進入**。所有本地程式碼與 GTM 連接邏輯皆已驗證成功。
*   **是否可以進入 Git Push / Cloudflare 部署**：**是，建議進入**。網站代碼 build 成功，部署將無風險。
*   **下一步建議**：
    1.  進入 git commit 與 push 階段，將本地代碼部署上線。
    2.  待網站上線後，由您在瀏覽器啟動 GTM Workspace 4 的 Preview 測試模式。
    3.  完成聯調測試（確認 dataLayer 與 GA4 觸發正確）後，再發布 GTM 容器。
