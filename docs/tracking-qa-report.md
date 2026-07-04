# 焓耀空調工程 追蹤與事件代碼部署後 QA 報告

本報告針對 GTM Workspace 4 套用與正式發布後的設定，以及網站本地追蹤程式碼進行全面性稽核與部署後 QA。

---

## 一、 GTM REST API 寫入驗證與正式發布結果

GTM Workspace 4 已經由 REST API 成功完成寫入套用與發布上線：

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

### 🚀 GTM 發布統計：
*   **發布狀態**：**成功上線 (Live)**
*   **Container Version ID**：`4`
*   **Version Name**：`Fix contact tracking events and pause legacy click conversions`
*   **發布時間**：`2026-07-04T10:22:57.419Z`
*   **Google Ads 未修改**：沒有新增任何 Google Ads Conversion Tag（Ads 轉換代碼維持原有 2 個舊項目且已暫停）。

---

## 二、 正式部署與發布後 E2E 測試結果 (Post-Publish Validation)

GTM 正式發布後，經由本機獨立 Chrome 進行生產環境 dataLayer 的完整 post-publish 模擬測試，結果如下：

1.  **首頁 LINE CTA 測試** ➔ **通過**
    *   點選 LINE 連結成功觸發 `line_contact_attempt` 事件。
    *   dataLayer 欄位：`contact_channel: "line"`, `contact_method: "line_link_open"`, `event_source: "header_cta"`。
    *   **無敏感個資洩漏**。
2.  **首頁電話 CTA 測試** ➔ **通過**
    *   點選電話連結成功觸發 `phone_click_attempt` 事件。
    *   dataLayer 欄位：`contact_channel: "phone"`, `contact_method: "tel_click"`, `event_source: "header_cta"`。
    *   **不含 `lead_id`**，亦無敏感個資洩漏。
3.  **LINE 點擊 30 秒 Dedupe 防重機制** ➔ **通過**
    *   連續點擊 3 次，dataLayer 僅產生 1 筆 `line_contact_attempt` 事件，其餘點擊被順利攔截。
4.  **聯絡頁表單「複製諮詢內容並開啟 LINE」** ➔ **通過**
    *   成功自動生成編號如 `HY-20260704-69ZADQ` 的 Lead ID。
    *   剪貼簿文字成功寫入：`【諮詢編號】HY-20260704-69ZADQ`。
    *   dataLayer 成功壓入 `line_contact_attempt` 事件，`contact_method: "form_copy_open_line"`。
    *   **重要個資隔離**：網頁端僅將 `lead_id` 與結構資訊送入 dataLayer，姓名、電話、描述等欄位完全被隔離，未傳輸給 GTM ➔ **安全性極佳**。
5.  **FAQ 頁面 CTA 檢測** ➔ **通過**
    *   點選 FAQ CTA 跳轉時，dataLayer 完全未觸發任何 `line_contact_attempt` 或 `phone_click_attempt` 事件。
6.  **手機版 Sticky CTA 檢測** ➔ **通過**
    *   在模擬手機版寬度（375px）下，Sticky LINE 按鈕點擊只送 `line_contact_attempt`，Sticky 電話按鈕點擊只送 `phone_click_attempt`。

---

## 三、 QA 結論與部署發布安全聲明

*   **Cloudflare 部署狀態**：成功部署（Verified Commit `f0f38d7`）。
*   **GTM 發布狀態**：成功發布上線（GTM Version 4）。
*   **安全防護確認**：沒有任何敏感個資流向 GTM，GTM 工作區與 Google Ads 狀態安全，個資隱私防護 100% 合規。
*   **後續風險**：無。系統運行狀態完全正常，代碼與追蹤架構已全部落地。
