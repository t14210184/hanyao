# 焓耀空調工程 xusen.pro 轉換追蹤現狀稽核報告

本報告針對「焓耀空調工程」網站目前（截至 2026 年 7 月 4 日）在 LINE 與電話相關轉換追蹤的程式碼實作、GTM 設定以及潛在數據污染風險進行完整稽核。

## 稽核結果摘要

針對第一階段要求的十項稽核項目，分析如下：

### 1. 哪些檔案會觸發 LINE 相關事件？
全站共有多處檔案會觸發 `line_click` 或 `line_quote_copy`：
*   **中央表單**：[ContactForm.tsx](file:///Users/joy/Documents/air%20web/src/components/ContactForm.tsx#L198-L223)
    *   點擊「複製諮詢內容並開啟 LINE」時，會連續觸發：
        *   `line_quote_copy`（表單內容複製）
        *   `line_open_attempt`（嘗試開啟 LINE）
        *   `line_click`（一般 LINE 點擊）
*   **全站共用元件**：
    *   [Header.tsx](file:///Users/joy/Documents/air%2520web/src/components/Header.tsx)（頂部導覽列 LINE 按鈕）
    *   [MobileStickyCTA.tsx](file:///Users/joy/Documents/air%2520web/src/components/MobileStickyCTA.tsx)（行動版底部 Sticky CTA 的 LINE 按鈕，`service_type` 參數依頁面不同而異）
    *   [Footer.tsx](file:///Users/joy/Documents/air%2520web/src/components/Footer.tsx)（頁尾 LINE 連結）
    *   [FinalCTA.tsx](file:///Users/joy/Documents/air%2520web/src/components/FinalCTA.tsx)（內頁尾部 CTA 區塊的 LINE 按鈕）
*   **特定頁面與 Landing Page**：
    *   首頁 [HomeClient.tsx](file:///Users/joy/Documents/air%2520web/src/app/HomeClient.tsx)、關於我們 [AboutClient.tsx](file:///Users/joy/Documents/air%2520web/src/app/about/AboutClient.tsx)、聯絡我們 [ContactClient.tsx](file:///Users/joy/Documents/air%2520web/src/app/contact/ContactClient.tsx)
    *   商用空調 LP [CommercialAcLpClient.tsx](file:///Users/joy/Documents/air%2520web/src/app/lp/commercial-ac/CommercialAcLpClient.tsx)
    *   所有服務內頁、地區內頁、FAQ 頁與指南文章頁（詳見原始碼中大量使用 `trackEventName="line_click"` 的區塊）

### 2. 哪些檔案會觸發電話相關事件？
所有 href 為 `tel:` 的撥號按鈕，或標示 `trackEventName="phone_click"` 的元件：
*   [MobileStickyCTA.tsx](file:///Users/joy/Documents/air%2520web/src/components/MobileStickyCTA.tsx)（行動版底部撥號按鈕）
*   [Header.tsx](file:///Users/joy/Documents/air%2520web/src/components/Header.tsx)（頂部電話按鈕）
*   [Footer.tsx](file:///Users/joy/Documents/air%2520web/src/components/Footer.tsx)（頁尾電話連結）
*   [LandingHero.tsx](file:///Users/joy/Documents/air%2520web/src/components/LandingHero.tsx)（各版 Hero 區塊的電話撥號）
*   [ContactClient.tsx](file:///Users/joy/Documents/air%2520web/src/app/contact/ContactClient.tsx)（聯絡資訊中的撥號連結）
*   多個服務與指南頁面。

### 3. 哪些按鈕是直接 LINE 連結？
*   Header、Footer、Mobile Sticky CTA 裡的 LINE 按鈕，以及聯絡頁面上的直接 LINE 連結（`https://line.me/R/ti/p/@451vpomq`）。
*   這些按鈕點擊後會直接轉址到 LINE 官方帳號好友頁面。

### 4. 哪些按鈕是表單填寫後複製文字再打開 LINE？
*   僅有聯絡表單 [ContactForm.tsx](file:///Users/joy/Documents/air%20web/src/components/ContactForm.tsx) 的提交按鈕（「複製諮詢內容並開啟 LINE」）。

### 5. 哪些電話按鈕使用 `tel:`？
*   全站所有電話按鈕皆正確綁定了 `tel:087552260` 連結（經由 `siteConfig.phone1Link` 統一配置）。

### 6. 是否存在同一個點擊同時觸發 GA4 Event 與 Google Ads Conversion 的狀況？
*   **是**。GTM 中目前的 `GA4 Event - line_click` / `phone_click` 與 `Google Ads Conversion - line_click` / `phone_click` 分別由相同的 Trigger（即 `line_click` 和 `phone_click` 事件）觸發，這代表一次點擊會同時向 GA4 與 Google Ads 發送追蹤。

### 7. 是否存在同一個 LINE 行為被拆成 `line_click` 與 `line_quote_copy` 並重複送 Google Ads 的風險？
*   **是，且風險極高**。在聯絡表單 [ContactForm.tsx](file:///Users/joy/Documents/air%20web/src/components/ContactForm.tsx#L198-L223) 的 `handleSubmit` 函式中，點擊提交後會**同時**按順序觸發：
    1.  `trackEvent("line_quote_copy", ...)`
    2.  `trackEvent("line_open_attempt", ...)`
    3.  `trackEvent("line_click", ...)`
    *   如果 GTM 同時為 `line_quote_copy` 與 `line_click` 綁定了 Google Ads 轉換（或在 GA4 裡都標示為 Conversion），該行為將被**重複計算 2~3 次**，嚴重污染轉換成效。

### 8. 是否存在 FAQ / Sticky CTA / ContactForm / service pages 的 CTA 被誤算成 LINE 或電話轉換的可能？
*   **FAQ / Sticky CTA 的「預約估價」**：FAQ 中的「預約估價」僅是頁面跳轉錨點；Mobile Sticky CTA 中的「預約估價」則只觸發了 `sticky_cta_scroll`，並未觸發 LINE 或電話事件。因此**沒有**被誤算的風險。
*   **主要問題在於 ContactForm 提交**：如第 7 點所述，送出表單的行為因程式碼設計同時發送了 `line_click`，導致「表單提交」被誤算進了「普通 LINE 按鈕點擊」的轉換數據中。

### 9. 是否有任何個資被送入 dataLayer 或 GA4 event parameter？
*   **目前沒有**。檢查目前的 `ContactForm.tsx`：
    ```typescript
    trackEvent("line_quote_copy", {
      form_location: formLocation,
      service_type: formData.service,
      area: formData.area,
      has_phone: formData.phone.trim().length > 0,
      has_description: formData.message.trim().length > 0,
    });
    ```
    程式碼僅發送了布林值（`has_phone`、`has_description`），並未將 `name`、`phone`、`message` 的具體內容送入 dataLayer。因此目前無個資洩露風險，此優良做法應繼續維持。

### 10. 是否有舊 Google Ads Conversion - line_click / phone_click 仍直接觸發 Google Ads 主要轉換？
*   **是**。目前舊的 `Google Ads Conversion - line_click` 和 `Google Ads Conversion - phone_click` 仍為 Active 狀態並作為 Primary 轉換，這正是導致 Google Ads 數據被嚴重污染的主要原因。

---

## 結論與改善方向

目前追蹤架構的主要問題在於：
1.  **轉換定義過於寬鬆**：把「點擊 LINE」和「點擊 tel:」直接做為 Google Ads 主要轉換（Primary Conversion）。
2.  **表單提交事件重疊**：表單提交時同時觸發 `line_click`，導致表單轉換與普通點擊轉換混雜在一起，難以區分。
3.  **缺乏防重複機制**：容易因為使用者雙擊、React 重新渲染 (hydration) 或手機連點而重複計數。

我們將在下一階段建立統一的事件語意並重新配置 GTM。
