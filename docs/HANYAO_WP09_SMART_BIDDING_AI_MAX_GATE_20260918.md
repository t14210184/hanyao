# HANYAO WP09 — Smart Bidding / AI Max 進場 Gate

Status: `REPOSITORY_GATE_CONTRACT / NO_GOOGLE_ADS_MUTATION`

Base Production main: `8d85588da2e409a6cfa809c000470ee3116bb189`

## 1. 目的

WP09 不負責「現在就切 Smart Bidding」。它把批准計畫中的 S0–S4 前置條件變成 fail-closed executable gate，避免因 Google Ads UI recommendation、CTR、Ad Strength 或單一累計 conversion 訊號而提前改變出價策略。

## 2. S0 — 維持現況

批准計畫要求的 S0 不變條件：

- Maximize Clicks / TARGET_SPEND family 維持；
- phrase + exact control lane 維持；
- `HY - Verified LINE Contact` 維持 Secondary。

這三項若有任何 drift，gate 回 `S0_INVARIANT_DRIFT_BLOCK`；不得把 drift 當成進階成功。

## 3. S1 — Tracking proof

三項必須同時成立：

1. genuine Ads → HY → LINE → Data Manager → Ads reporting E2E PASS；
2. duplicate canonical path count = 0；
3. canonical funnel 可重現。

最新可驗證 HG09 evidence（PR #44）只證明 single-writer 已修正，並記錄當時 target 仍為：

- one failed outbox；
- provider attempts = 0；
- provider attempt events = 0；
- provider leases = 0；
- no Google request ID；
- target fenced before reconciliation。

這是「最新已驗證歷史證據」，不是永遠有效的 provider truth。只有新的 same-source D1 / Data Manager / Google Ads reporting readback 能取代它。在出現更新證據前，WP09 不得宣稱 S1 PASS。

## 4. S2 — 穩定觀察

S1 通過後至少觀察一個 conversion cycle，且四類資料都要存在：

- verified volume；
- conversion lag；
- cost distribution；
- search-term quality。

本專案**不創造「Google 規定至少 X conversions」的硬數字**。是否進入單一 campaign 實驗依真實 conversion cycles 與 provider recommendation/simulation 判讀。

## 5. S3 — Single-campaign experiment

只有 S1 + S2 都通過，且人類選定一個 campaign，才可進：

- Maximize Conversions；或
- Target CPA。

不得同日全帳戶切換。Executable gate 只會回「單一 campaign strategy experiment 可進行」，**不會自動 dispatch Google Ads mutation**。

## 6. S4 — AI Max

只有 S3 單一 campaign conversion-bidding experiment 已被證據驗證，並且：

- Search Terms evidence 足夠；
- landing evidence 足夠；
- 已準備 isolated AI Max experiment + control lane；

才回 `S4_AI_MAX_EXPERIMENT_ELIGIBLE`。

即使 S4 eligible，仍不得自動打開 AI Max；search term matching、text customization、final URL expansion 必須另做隔離 experiment。

## 7. Current disposition

依目前 repository 中最新已驗證的 HG09 evidence，而非猜測 provider 現況：

`WP09 = S1_TRACKING_PROOF_PENDING`

理由不是 conversion 數量少，而是 genuine canonical E2E provider success / reporting delta 尚無可引用的新證據取代 HG09 的 fenced state。

## 8. Frozen boundaries

本 WP 不修改：

- Google Ads budget；
- bidding strategy；
- conversion goal Primary/Secondary；
- canonical conversion identity；
- keywords / broad match；
- AI Max；
- GTM / GA4；
- D1 / uploader；
- Message Asset。
