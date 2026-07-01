# 焓耀空調工程官方網站

本專案為焓耀空調工程有限公司的官方網站，採用 Next.js 進行開發，並透過 Static Export 產生靜態檔案，最終託管於 Cloudflare Pages。

---

## 專案目標

*   **Google Ads 高轉換落地頁**：為四個主廣告活動（冷氣安裝、維修、清洗保養、商用工程）設計獨立且高轉換率的 Landing Pages（`/lp/*`）。
*   **多元轉化管道**：全站以 電話直撥（`tel:087552260`）、LINE 傳照諮詢（官方 LINE）、以及線上預約表單為導向。
*   **Local SEO**：特別優化高雄與屏東各服務區域頁面，鎖定高屏地區在地空調工程搜尋需求。
*   **GEO / AI Overview 內容優化**：針對 Google 搜尋生成式體驗（SGE/AIO）設計專業排查指南（`/guides/*`），包含 H1/H2 分層、摘要結論、比較表格、以及實體結構化資料。
*   **Cloudflare Pages 靜態部署**：將 Next.js 編譯為純靜態 HTML/JS 檔案（`out/`），並託管於 Cloudflare Pages，享受高效能與高可用性。

---

## 技術棧

*   **Core**: Next.js 15.1.7 (App Router), React 19.0.0, TypeScript
*   **Styling**: Tailwind CSS v4.0 (Vanilla CSS configuration)
*   **Export**: Next.js Static Export (`output: "export"`, `trailingSlash: true`)
*   **Hosting**: Cloudflare Pages, Git/GitHub
*   **Structured Data**: JSON-LD (WebPage, Organization, HVACBusiness, Article, BreadcrumbList, FAQPage)
*   **Tracking**: Google Tag Manager (GTM) dataLayer integration

---

## 本地開發

### 安裝依賴
```bash
npm install
```

### 本地開發伺服器
```bash
npm run dev
```
啟動後可在瀏覽器打開 [http://localhost:3000](http://localhost:3000) 預覽。

### 靜態導出編譯
```bash
npm run build
```
編譯完成後，靜態檔案將輸出至專案根目錄下的 `/out/` 資料夾中。

> [!NOTE]
> **Windows 環境編譯說明**：
> 由於 Node.js v22 於 Windows 系統中讀取非 ASCII 字元路徑時可能發生崩潰，本專案提供 `local-build.ps1` 腳本，透過專案內置的 `node20.exe` 進行編譯。
> ```powershell
> .\local-build.ps1
> ```

---

## 廣告政策合規與字詞約束

本專案之全站文案與 structured schema 均遵循 Google Ads 廣告政策與搜尋安全規範：
1.  **無誇大及過度承諾字眼**：全站避開「甲級、24小時、當天、當日、即時到府、即時安排、立即到府、立即安排、快速到府、馬上到府、保證修好、一定修好、評價數、服務年資、幾年保固、固定價格、保證價格、保證改善、保證省電、清洗一定有效、清洗一定解決」等詞彙，改為保守且符合工安規範的陳述（如：*依排程安排檢修*、*先確認需求後安排*）。
2.  **真實且合規的商家資訊**：Structured schema 均使用真實的公司登記事實，不捏造成效數據。
    *   公司名稱：**焓耀空調工程有限公司**
    *   統一編號：**90234660**
    *   冷凍空調業登記：**經冷字第 1120002883 號** (丙等)
    *   營業範圍：**E602011 冷凍空調工程業**
    *   同業公會：**台灣區冷凍空調工程工業同業公會會員**
    *   專業證照：**乙級冷凍空調裝修技術士**
    *   地址：**900 屏東縣屏東市建南路106號**
    *   營業時間：**週一至週五 08:00–17:00**
3.  **禁止包含 ratings schema**：嚴禁於 schema 中注入 `aggregateRating`、`reviewRating` 或 `review` 等無事實憑證的評分結構。

---

## 網站分析與事件追蹤 (GTM)

全站 CTA 按鈕與表單皆整合 `trackEvent` 函數，在使用者點擊或互動時向 GTM `dataLayer` 推送以下事件：
*   `phone_click`：電話撥打點擊
*   `line_click`：LINE 諮詢連結點擊
*   `line_quote_copy`：點擊諮詢表單複製並開啟 LINE

