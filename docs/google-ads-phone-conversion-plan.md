# 焓耀空調工程 Google Ads 電話真實轉換追蹤方案

目前網站上的電話撥打追蹤僅能記錄「點擊 `tel:` 連結的嘗試點擊（phone_click_attempt）」，並不能代表使用者真正撥打出去、接通與通話。若將此點擊事件直接做為 Google Ads 主要轉換（Primary Conversion），將會導致 PMax / Leads 智慧出價系統受到極大污染（因大量誤點或未接通的電話會被視為有效轉換）。

本方案規劃如何利用 Google Ads 官方電話轉換追蹤功能，實現「通話時間超過指定秒數才算一次轉換」的精準追蹤。

---

## 1. 核心追蹤機制：Google 轉接號碼 (Google Forwarding Number)

若要在網站上精準記錄「撥打且通話成功」的行為，我們應建立 **Calls to a phone number on your website** 轉換動作：
*   **運作原理**：當使用者透過 Google Ads 廣告點擊進入網站後，Google 的 script 會動態將網站上的公司電話號碼（`08-7552260`）替換成一個臨時的 **Google 轉接號碼**。
*   **通話篩選**：當使用者撥打該轉接號碼時，通話會轉接至您的公司電話。Google Ads 會記錄通話的開始時間、結束時間與通話長度。
*   **轉換門檻**：我們可以在 Google Ads 後台設定「最短通話時間」（建議設定為 **60 秒**）。只有通話時間超過 60 秒的來電，才會被計為一次「主要轉換（Primary Conversion）」，低於 60 秒的騷擾電話或誤撥將不會列入出價信號。

---

## 2. 實作步驟

### 步驟 A：在 Google Ads 後台建立轉換動作
1.  登入 Google Ads 帳戶，點選「工具與設定」>「轉換（Conversions）」。
2.  新增轉換動作，選擇 **電話撥打 (Phone calls)**。
3.  選擇 **網站上的電話號碼撥打次數 (Calls to a phone number on your website)**。
4.  設定轉換名稱（例如：`Verified Phone Call - 60s`）。
5.  在「通話長度」設定中，輸入 **60** 秒。
6.  在「計算方式」設定中，選取 **僅限一次 (One)**（因為同一個客人的多次來電應視為同一個 Lead）。
7.  儲存並取得程式碼。

### 步驟 B：在 GTM / 網站中安裝電話替換 Snippet
若要讓 Google 轉接號碼生效，網站需要載入 Google 的電話替換腳本。
1.  GTM 中應確保已安裝 **Conversion Linker**。
2.  如果台灣帳戶或該號碼格式在 Google Ads 支援轉接，則需要使用 Google Ads 的專屬電話替換程式碼（Phone Snippet）。
3.  或可於 GTM 內新增一個 Google Ads Call from Website Conversion Tag，並輸入對應的 Conversion ID、Label 以及要替換的電話號碼 `08-7552260`。

---

## 3. 台灣地區的潛在限制與替代方案

> [!WARNING]
> **台灣地區的限制：**
> Google 轉接號碼目前在台灣的支援程度可能因電信業者或帳戶類型而有所不同。如果您的 Google Ads 帳戶不支援台灣號碼的 Google 轉接號碼，建議使用以下替代方案：

### 替代方案一：公司內部通話紀錄每日人工核對 (推薦)
1.  網站端僅將 `phone_click_attempt` 作為**次要轉換（Secondary Conversion）**進行觀察，不用作智慧出價。
2.  客服人員每日記錄公司來電，並記錄有效詢價的通話。
3.  未來如果需要，可透過 Google Ads **離線轉換匯入 (Offline Conversion Import, OCI)** 功能，在每日或每週將真正成交/有效諮詢的電話（對應 GCLID 或是經過 Enhanced Conversions 匹配的電話號碼與時間）手動匯入 Google Ads 作為主要轉換。

### 替代方案二：使用第三方電話追蹤服務
1.  採用支援台灣市場的第三方 Call Tracking 系統。
2.  該系統會自動動態替換網站上的電話，並在通話結束後，自動將通話秒數及廣告歸因數據回傳至 Google Analytics 4 或 Google Ads。
