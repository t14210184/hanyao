# HANYAO WP10 — Execution / Gate Ledger — 2026-09-18

Status: `CURRENT_STATE_SNAPSHOT / PROVIDER_READBACK_REQUIRED_FOR_PROVIDER_TRUTH`

Baseline main at snapshot: `14669a8f5107c42b5f1e6ed148480aa58fa0b094`

## Purpose

這份 ledger 不是第二套控制面，也不取代 Google Ads、Cloudflare、D1 或 Data Manager 的 provider truth。它只把目前已完成的 repository / website 施工與剩餘 provider Gate 投影成可機器驗證的 current-state snapshot，避免後續工作階段把「候選已做好」誤認成「Google Ads 已套用」。

## Completed

- WP06：system-font payload elimination Production PASS；後續 LCP 微調若 A/B 無實質改善就拒絕。
- WP07：Ads × Landing Promise Matrix PASS。
- WP08：Experiment KPI contract PASS。
- WP09：Smart Bidding / AI Max fail-closed gate contract PASS。
- WP05 API preflight v2：read-only capability PASS；LINE 仍為帳戶 UI Beta。
- Mobile sticky CRO：四個 paid service landing 已按服務別對齊 mobile CTA copy / service_type。

## Provider work not yet claimed

### Search hygiene

Repository 已有 read-only Search Term audit/rules；但正式 negative keyword dispatch 前仍必須 fresh read：

- Search Terms window；
- campaign / ad-group identity；
- existing negative inventory。

只允許高信心 exact negative；不得 broad negative 批次亂殺流量。

### RSA

候選 A/B package 已存在；正式 rollout 前必須 fresh read：

- enabled ad groups；
- enabled RSA inventory；
- Ad Strength / feedback；
- final URLs。

不得把 candidate package 冒充 live Ads state。

### LINE Message Asset

API preflight 能讀公開 API 可見 prestate，但 HANYAO 的 LINE Beta 仍是 UI-only Gate。正式 association 前必須 fresh UI 證明：

- Advertiser Verification；
- Beta eligibility；
- Line / Line ID fields；
- bidding strategy；
- conversion optimization set；
- Call / Lead Form / Message associations；
- save 後 policy / verification result。

## Canonical E2E blocker

最新已驗證的歷史 provider evidence 來自 PR #44 HG09：single-writer topology PASS，但當時 target 在 reconciliation 前仍有 1 failed outbox、0 provider attempts/events/leases、no Google request ID。

這不是永久 provider truth。新的 same-source readback 可以取代它；在那之前只能保守判：

`S1_TRACKING_PROOF_PENDING`

禁止 blind resend。未知副作用必須 readback first。

S1 PASS 需要：

1. fresh target D1 readback；
2. genuine Ads → HY → LINE business event；
3. Data Manager provider request + terminal success-equivalent diagnostics；
4. Google Ads reporting delta；
5. duplicate canonical sender/path = 0。

## Phase F observation

尚未開始。只有實際 provider pilot 或 canonical conversion cycle 已啟動並捕捉 fresh baseline 才開始計時。

Project heuristic：

- minimum 14 days；
- prefer >=100 Message Asset clicks when traffic permits。

100 clicks 不是 Google 平台硬規定。

## Current legal terminal / next transitions

目前所有 Chat 可在 repository / website 直接完成的 plan-scope施工已推到 provider boundary。下一步只能由 fresh provider truth 解鎖：

1. canonical E2E reconciliation readback；
2. Search hygiene live prestate → bounded exact-negative dispatch；
3. RSA live inventory → bounded rollout；
4. Google Ads UI fresh prestate → one 冷氣維修 LINE Message Asset association；
5. 實際開始 Phase F observation。

Smart Bidding、tCPA、broad match、AI Max 在 S1/S2/S3 Gate 前持續 fail closed。
