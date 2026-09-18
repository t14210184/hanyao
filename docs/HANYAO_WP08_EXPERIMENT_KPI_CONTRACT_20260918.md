# HANYAO WP08 — 實驗設計與 KPI 契約

Status: `REPOSITORY_CONTRACT / NO_GOOGLE_ADS_MUTATION`

Base Production main: `40f6bdd14b74c8310a6dc9a62bea292a60e5cc76`

## 1. 目的

WP08 將網站 canonical conversion Lane A 與 Google Message Asset Lane B 的量測口徑固定成同一套可執行契約，避免後續只看 CTR、line_click、加好友或累計 allConversions 就宣稱成效。

這個工作包只建立計算與判讀契約；不修改 Google Ads、GTM、GA4、D1、uploader、預算、出價、Primary conversion、broad match 或 AI Max。

## 2. Lane A — 官網 canonical

正式 KPI：

- Verified LINE Contact / 100 paid clicks
- Cost / Verified LINE Contact
- Qualified conversation / Verified LINE Contact
- Won job / Qualified conversation

`HY - Verified LINE Contact` 保持 canonical verified conversion。瀏覽器 `line_click` 仍只是 observation event。

## 3. Lane B — Google Message Asset

正式 KPI：

- Message Asset CTR
- Cost / Message Asset click
- Leads from Messages
- Cost / Leads from Messages
- manual/CRM real conversation count
- qualified conversation count

Message Asset click 不等於 Verified LINE Contact；`Leads from Messages` 也不得取代 canonical HY conversion 身分。

## 4. Guardrails

固定同時觀察：

- phone leads
- irrelevant chat rate
- prepare error rate
- profile fallback rate
- Ads search-term waste share
- landing bounce / engagement（diagnostic only）
- Data Manager duplicate/reconciliation incidents
- GTM/GA4 duplicate canonical sender 必須維持 0

Message Asset 若提高聊天量、卻同步吃掉電話 lead，不能只靠 Message CTR 判勝。

## 5. 零分母與資料完整性

所有 ratio/cost KPI 遇到零分母時回傳 `null`，不得把「尚無樣本」偽裝成 0% 或 NT$0 CPA。

人工／CRM 真值仍是以下指標的唯一來源：

- real conversation
- qualified conversation
- won job

不得由 Google Ads click、LINE 加好友、GA4 event 或自動推測替代。

## 6. 觀察期

Project heuristic：

- 最低觀察 14 天；
- Message Asset 若流量允許，偏好至少 100 clicks；
- 14 天未滿：`OBSERVATION_WINDOW_INCOMPLETE`；
- 已滿 14 天但 Message clicks <100：`DIRECTIONAL_ONLY_LOW_MESSAGE_SAMPLE`；
- 達 100 clicks：`PREFERRED_MESSAGE_SAMPLE_REACHED`。

100 clicks 是本專案的觀察偏好，不是 Google 平台硬規定。

## 7. 禁止用來單獨裁決的假 KPI

- CTR only
- Ad Strength only
- line_click only
- LINE friend-add only
- Goals 頁面綠燈 only
- historical allConversions total only

## 8. 後續 Gate

WP08 完成後才可進 WP09 Smart Bidding / AI Max Gate 判讀。

WP09 Stage S1 仍要求先證明自然 Ads → HY → LINE → Data Manager → Ads reporting E2E PASS，沒有 duplicate canonical path；在此之前不得以本 KPI contract 為理由自行切 Maximize Conversions、Target CPA 或 AI Max。
