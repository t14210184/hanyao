# 焓耀空調工程官方網站 - 最終 QA 稽核報告

本報告彙整全站開發完成度、SEO 結構、Google Ads 廣告政策合規性、網頁追蹤埋點（GTM），以及 Cloudflare Pages 部署前之最終檢測結果。

---

## 一、專案完成摘要

*   **靜態編譯結果**：Next.js Static Export 順利通過，成功產出 **30 個靜態頁面**。
*   **路由收錄狀態**：`sitemap.xml` 共收錄 **26 個正式使用者路由**（排除系統 404 與 Next.js 系統頁面）。
*   **工作目錄狀態**：Git 狀態良好，全站程式碼與資源均已提交。
*   **政策字詞合規**：全站程式碼及 public 靜態資源完成禁止詞檢測，回報 **0 筆違規**。

---

## 二、30 個靜態編譯頁面與 26 個正式路由對照

### 26 個正式使用者路由 (收錄於 Sitemap)
1.  首頁：`/`
2.  關於我們：`/about/`
3.  預約諮詢：`/contact/`
4.  工程實績：`/cases/`
5.  常見問題：`/faq/`
6.  服務總覽：`/services/`
7.  冷氣安裝服務：`/services/ac-installation/`
8.  冷氣舊換新服務：`/services/ac-replacement/`
9.  冷氣故障維修：`/services/ac-repair/`
10. 冷氣清洗保養：`/services/ac-cleaning/`
11. 商用空調工程：`/services/commercial-ac/`
12. 冰水主機維護：`/services/chiller-maintenance/`
13. 冷氣移機規劃：`/services/ac-relocation/`
14. 全熱交換器規劃：`/services/erv/`
15. 高雄服務區：`/areas/kaohsiung/`
16. 屏東服務區：`/areas/pingtung/`
17. 高雄冷氣維修專區：`/areas/kaohsiung-ac-repair/`
18. 屏東冷氣安裝專區：`/areas/pingtung-ac-installation/`
19. 廣告 LP - 冷氣安裝：`/lp/ac-installation/`
20. 廣告 LP - 冷氣維修：`/lp/ac-repair/`
21. 廣告 LP - 冷氣清洗：`/lp/ac-cleaning/`
22. 廣告 LP - 商用工程：`/lp/commercial-ac/`
23. GEO 指南 - 冷氣不冷排查：`/guides/ac-not-cold/`
24. GEO 指南 - 冷氣滴水漏水排查：`/guides/ac-leaking-water/`
25. GEO 指南 - 冷氣安裝費用因素：`/guides/ac-installation-cost-factors/`
26. GEO 指南 - 霉味與出風小清洗：`/guides/ac-smell-cleaning/`

### 靜態編譯產生之系統路由 (共 30 個 HTML 節點)
編譯過程中除了上述 26 個路由對應之 `index.html` 外，另包含系統 `404.html`、`404/index.html` 等 Next.js prerender 產物。

---

## 三、Sitemap & Robots 檢查結果

*   **Robots.txt** (`out/robots.txt`)：
    *   內容包含標準搜尋引擎抓取權限：
        ```text
        User-agent: *
        Allow: /
        ```
    *   明確指向 Sitemap 位址：`Sitemap: https://www.hanyao.com.tw/sitemap.xml`
    *   **檢查結果**：✅ **正常且完全合規**。
*   **Sitemap.xml** (`out/sitemap.xml`)：
    *   所列 URL 均使用統一之官方網域名稱 `https://www.hanyao.com.tw`。
    *   所有連結均結尾帶有斜線 (`/`)，符合 `trailingSlash: true` 配置，防止搜尋引擎索引到跳轉網址。
    *   **檢查結果**：✅ **正常且完全合規**。

---

## 四、4 個 Google Ads 主 Landing Pages 與 Sitelinks 對照

網站為配合 Google Ads 廣告活動，完整提供 4 個核心 LP，並已於 `src/data/sitelinks.ts` 中映射各廣告活動對應之 Sitelinks：

### 1. 冷氣安裝 (Installation)
*   **Landing Page**：`/lp/ac-installation/`
*   **Sitelinks 映射對照**：
    *   冷氣舊換新 ➔ `/services/ac-replacement/`
    *   安裝費用因素 ➔ `/guides/ac-installation-cost-factors/`
    *   高雄服務區 ➔ `/areas/kaohsiung/`
    *   屏東服務區 ➔ `/areas/pingtung/`
    *   資格憑證 ➔ `/about/`
    *   聯絡估價 ➔ `/contact/`

### 2. 冷氣維修 (Repair)
*   **Landing Page**：`/lp/ac-repair/`
*   **Sitelinks 映射對照**：
    *   高雄冷氣維修 ➔ `/areas/kaohsiung-ac-repair/`
    *   屏東服務區 ➔ `/areas/pingtung/`
    *   冷氣不冷怎麼辦 ➔ `/guides/ac-not-cold/`
    *   冷氣滴水原因 ➔ `/guides/ac-leaking-water/`
    *   常見問題 ➔ `/faq/`
    *   聯絡檢修 ➔ `/contact/`

### 3. 冷氣清洗保養 (Cleaning)
*   **Landing Page**：`/lp/ac-cleaning/`
*   **Sitelinks 映射對照**：
    *   清洗保養服務 ➔ `/lp/ac-cleaning/`
    *   高雄服務區 ➔ `/areas/kaohsiung/`
    *   屏東服務區 ➔ `/areas/pingtung/`
    *   霉味風量變小 ➔ `/guides/ac-smell-cleaning/`
    *   常見問題 ➔ `/faq/`
    *   預約清洗 ➔ `/contact/`

### 4. 商用空調工程 (Commercial)
*   **Landing Page**：`/lp/commercial-ac/`
*   **Sitelinks 映射對照**：
    *   商用空調工程 ➔ `/lp/commercial-ac/`
    *   冰水主機維護 ➔ `/services/chiller-maintenance/`
    *   工程實績 ➔ `/cases/`
    *   資格憑證 ➔ `/about/`
    *   高雄服務區 ➔ `/areas/kaohsiung/`
    *   聯絡場勘 ➔ `/contact/`

---

## 五、SEO & Schema 檢查結果

1.  **Metadata 頁面檢測**：
    全站各路由均配置唯一的 `<title>` 與 `<meta name="description">`。各頁面之 Canonical 連結均正確指向其在 `www.hanyao.com.tw` 網域下之實際路徑。
2.  **Structured Data (JSON-LD) 稽核**：
    *   **Organization** & **HVACBusiness**：部署於全站，載明登記案號（`經冷字第 1120002883 號`、`E602011 冷凍空調工程業丙等`）、公司統編（`90234660`）、物理地址與營業時間。
    *   **Article**：配置於 4 篇 GEO Guides（`/guides/*`）中。
    *   **FAQPage**：配置於有展示 FAQ 問答之頁面，且 **Schema 內容與前台渲染內容 100% 保持一致**。
    *   **禁止結構檢查**：全站無 `aggregateRating`、`reviewRating`、`review` 等涉及假評價與假分數之虛假結構。

---

## 六、GTM 14 個事件追蹤確認

全站 CTA 點擊均以 dataLayer 方式發送以下自訂事件：
1.  `phone_click`：電話點擊。
2.  `line_click`：LINE 點擊。
3.  `form_start`：表單開始輸入。
4.  `form_submit` : 表單提交點擊。
5.  `generate_lead`：表單提交成功（感謝視窗顯示）。
6.  `area_selected`：區域選擇器互動。
7.  `quote_request`：主預約服務點擊。
8.  `service_cta_click`：一般服務卡片細節點擊。
9.  `lp_cta_click`：Landing Page 內 CTA 點擊。
10. `guide_cta_click`：GEO 頁面內 inline 點擊。
11. `commercial_quote_request`：商用預約場勘。
12. `repair_urgent_click`：維修急件點擊。
13. `cleaning_booking_click`：清洗預約點擊。
14. `installation_quote_click`：安裝估價點擊。

---

## 七、廣告禁止詞與過度承諾字詞檢測

*   **檢測工具**：PowerShell `Select-String` 遞迴檢查。
*   **檢查對象**：全站程式碼、樣式表與靜態文本。
*   **檢測結果**：**0 筆符合**。
    （已排除「甲級、24小時、當天、當日、即時到府、即時安排、立即到府、立即安排、快速到府、馬上到府、保證修好、一定修好、評價數、服務年資、幾年保固、固定價格、保證價格、保證改善、保證省電、清洗一定有效、清洗一定解決」等可能違反 Google 政策之承諾字詞。）

---

## 八、Cloudflare Pages 部署設定

本專案部署於 Cloudflare Pages 時之參數設定如下：
*   **Framework preset**：`Next.js Static HTML Export`
*   **Build command**：`npm run build`
*   **Build output directory**：`out`
*   **Root directory**：`/`
*   **Node.js Version**：建議設定環境變數 `NODE_VERSION = 20`

---

## 九、需要手動替換之分析與廣告帳號 ID

在正式運行廣告及流量分析前，請至 `src/data/site.ts` 內將以下佔位符替換為您的真實帳號 ID：
*   GTM 容器 ID：`gtmId: "GTM-XXXXXXX"` (位於 `site.ts`)
*   GA4 追蹤碼 ID：`gaId: "G-XXXXXXXXXX"` (位於 `site.ts`)
*   Google Ads 轉換追蹤 ID：`adsId: "AW-XXXXXXXXXX"` (位於 `site.ts`)

GTM 核心載入腳本 `public/scripts/tracking.js` 會自動提取上述變數進行初始化。

---

## 十、上線前人工確認事項

1.  **ID 替換**：確保已在 `src/data/site.ts` 中完成 GTM、GA4 與 Google Ads ID 的手動替換。
2.  **表單接收設定**：Next.js 表單預設會將預約資料打印於終端機及瀏覽器 console 中。上線前，請至 `/src/components/ContactForm.tsx` 中將資料傳送至您的電子信箱、LINE Notify 或串接 API 後端。
3.  **LINE URL 確認**：確保 `siteConfig.lineUrl` 設定之 LINE 行動條碼網址正確無誤。
