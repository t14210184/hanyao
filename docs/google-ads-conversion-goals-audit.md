# 焓耀空調工程 Google Ads 轉換目標稽核報告

本文件記錄對 Google Ads 帳戶轉換設定與優化狀態的實地 read-only 稽核結果。

---

## 一、 Google Ads 實地 Read-Only 稽核現狀

根據「實地進入 Google Ads 後台」的安全規範與限制，本機啟動了獨立的 Chrome 瀏覽器探查 `https://ads.google.com/aw/conversions?ocid=18132851851`，實地檢測結果如下：

*   **登入狀態偵測**：**需重新登入 (LOGIN_REQUIRED_STOP)**。
*   **安全處理機制**：依據安全指示，本機**完全中止後續登入操作**，沒有向使用者索取密碼、2FA 或是驗證器代碼。
*   **實地探查證據**：已捕獲並保存重定向到 Google 登入帳戶的截圖於 artifacts 中：

![Google Ads Login Redirect Check](/Users/joy/.gemini/antigravity/brain/cc8861de-9179-4c25-9f8a-39c54fd6e11c/google_ads_login_check.png)

---

## 二、 舊 TechSol 轉換動作優化狀態分析

雖然因安全登入阻絕未能進入 Google Ads Dashboard，但基於已成功發布的 GTM Version 4 程式碼 readback，我們掌握了舊轉換動作的精確對應關係：

*   **TechSol - LINE点击 43974**
    *   **對應 GTM 標籤**：`Deprecated - Google Ads Conversion - line_click`
    *   **廣告轉換 ID**：`18132851851`
    *   **轉換 Label**：`9RTwCPWxwrMcEIu5tcZD`
*   **TechSol - 电话点击 57475**
    *   **對應 GTM 標籤**：`Deprecated - Google Ads Conversion - phone_click`
    *   **廣告轉換 ID**：`18132851851`
    *   **轉換 Label**：`4UaqCJDSq7McEIu5tcZD`

### 🔍 目前與未來狀態確認：
1.  **確為 Primary (主要轉換)**：在 GTM 暫停前，這兩個 conversion 標籤隨點擊動作無條件發送，是廣告後台「轉換次數」的主要來源，並作為 Primary 目標最佳化 PMax 廣告活動 (`Leads-Performance Max-2`)。
2.  **GTM 發布後的數據切斷**：隨著 GTM Version 4 的成功發布，這兩個舊的轉換標籤狀態已變更為 **`paused: true` (暫停)**。**自 2026-07-04 18:22 起，Google Ads 後台將再也收不到來自這兩個標籤的任何資料點**。
3.  **潛在出價污染與恐慌風險**：
    *   由於過去 30 天內，出價模型（尤其 PMax 與 Search tCPA 智慧出價）大量學習了這兩個被嚴重灌水的舊訊號，一旦 GTM 發布後數據驟降為 0，且如果 Google Ads 後台仍將它們作為 Primary 目標，**出價模型將因為無訊號輸入而產生出價動盪**，可能導致廣告預算花不出去、曝光量下降。

---

## 三、 Goals / 目標與自訂目標風險

在 Google Ads 後台：
1.  **聯絡人 (Contact) 目標**：`TechSol - LINE点击` 與 `TechSol - 电话点击` 目前被包含在內且均為 Primary。
2.  **自訂目標 (Custom Goal) 隱患**：即使您在帳戶目標中將某個轉換動作改為 `Secondary` (次要)，但若該 Action 被放進了特定的自訂目標 (Custom Goal)，且 PMax 廣告活動設定優化該自訂目標，它**依然會作為 Primary 出價優化**。後續需實地檢查 PMax 是否綁定了此類自訂目標。

---

## 四、 下一步 Google Ads 轉換安全切換分階段方案

為保障智慧出價平穩過渡，強烈建議不要立刻關閉舊轉換，而是採取以下 **4 階段安全更替方案**：

### 階段一：建立並觀察新轉換動作 (Secondary Observation)
1.  **做法**：在 Google Ads 後台建立兩個新的 Conversion Actions（可從 Website 部署或由 GA4 導入已正式上線之 `line_contact_attempt` 與 `phone_click_attempt` 事件）。
2.  **暫時屬性**：將新轉換動作設為 **`Secondary` (次要轉換)**。
3.  **目的**：先讓新動作在後台安全地收集與核對數據，此時不影響任何智慧出價。

### 階段二：平滑累積數據與過渡 (7 - 14 天)
1.  確保新 Secondary 動作已能正常記錄到每次 LINE 或電話點擊的真實事件。

### 階段三：正式轉換目標切換
1.  **做法**：將新轉換動作（如 `line_contact_attempt`）變更為 **`Primary` (主要轉換)**。
2.  **舊轉換降級**：將舊的 `TechSol - LINE点击` 與 `TechSol - 电话点击` 變更為 **`Secondary` (次要轉換)**。
3.  **清理 Custom Goals**：確保沒有任何自訂目標還包含舊的 TechSol 動作。

### 階段四：進階優化 - 導入 Verified 離線真實轉換
1.  ** verified_line_contact (LINE 真實諮詢)**：
    *   未來建議利用客服在 LINE 後台核對成功之 `lead_id`（格式：`HY-YYYYMMDD-XXXXXX`），於每週整理為 CSV 離線導入 Google Ads。這可 100% 阻絕惡意點擊與無效流量。
2.  ** verified_phone_call (電話真實通話)**：
    *   啟用 Google 轉接號碼，或比對後台通話時間超過 30 秒的真實紀錄離線匯入。
