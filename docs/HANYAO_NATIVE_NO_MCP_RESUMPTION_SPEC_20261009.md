# HANYAO｜移除舊 Factory MCP 後的原生復工稽核與施工規格 R1

- 文件版本：HANYAO-NATIVE-NO-MCP-20261009-R1
- 專案：HANYAO_ADS_LINE_PROD（廣告追蹤）
- Repository：t14210184/hanyao
- 基準日期：2026-10-09，Asia/Taipei
- 文件狀態：完整稽核後的「施工候選規格」，**不是 Production 完工證明**
- 施工範圍：只限 HANYAO。不得接管 CHATGPT_GLOBAL_SKILL_GOVERNANCE／V5.3。
- 本輪外部寫入：本候選分支的規格文件；未部署、未執行 D1 寫入、Google Ads 修改、LINE 設定修改、Data Manager 補送。

## 0. 總裁決

HANYAO 本身可以直接使用原生 Git／Node.js／PowerShell／gcloud／Wrangler、Cloudflare D1 REST API、Google Ads API 和 Google Data Manager API，**完全不必等待 Factory MCP 或 V5.3**。

真正要移除的是 HANYAO 中仍要求 Factory MCP／SYSTEM 執行的「控制面依賴、舊 PowerShell 包裝、測試和過時 Policy」，**不是推倒正式業務追蹤架構**。

不得重建第二個 Worker、第二個 D1、第二條 Conversion 上傳鏈，也不得為了測試製造付費點擊或假 LINE 客戶。先取得真實資料，對帳後才修真正存在的問題。

## 1. 權威來源、正式進度與最新基準

依最新人類指令及正式 Directory 精確綁定：

| 項目 | 本輪查證內容 |
|---|---|
| Directory | PT-Original-Point/ptysd-vnext42-governance-sandbox，governance/project-directory |
| Project ID | HANYAO_ADS_LINE_PROD，BOUND |
| HANYAO Repo ID | 1272482826；對應 t14210184/hanyao |
| 控制分支 | governance/hanyao-control，已成功讀取 |
| Current Pointer | governance/hanyao/current.json |
| Checkpoint | 2 |
| 最後已完成工作 | HG10-CONTROL-REBASE = COMPLETED |
| 既有狀態 | WAITING_REAL_EVENT，僅限制下一筆自然事件的 E2E 驗收 |
| Mission | 20260919T151100+0800 |
| Policy | 20260919T151100+0800-EP-HG10 |
| 實際稽核主分支 | e917139e4e81a12e41ef5ead507589ae0bf48452 |
| GitHub Main 保護 | 已有 active ruleset 23550272，要求 Ads LINE required gate、Ads LINE hardening |
| PR #88 | 開啟中，尚未合併；最新核對 head 7cd87cb0f69b5586719c1265828df20879b28bf2 |
| PR #89 | 開啟中且 CI 阻擋；head 2c1021758d8b5ecbc3a126ad4a54b16cda1eac0b |
| 2026/10/09 Production D1 真實數字 | UNKNOWN |
| 2026/10/09 Google Ads 真實報表 | UNKNOWN |

權威順序為：**最新人類 HANYAO 指令 > 正式 Mission／Spec > 不衝突的 HANYAO Policy > Canonical Checkpoint > 直接讀回的即時 Provider 事實 > 可核驗產物 > 歷史報告**。

前次 404 已確認是查錯 Repository；不能當成控制分支失蹤，更不能據此重建 MCP 或 Directory。

## 2. 不可破壞的正式業務資料流

    Google Ads 真實點擊（gclid / gbraid / wbraid）
      -> www.xusen.pro 保存第一方歸因／Session
      -> /api/line/prepare 發給 HY token
      -> 真人在 LINE 官方帳號實際送出訊息
      -> LINE webhook 驗證 X-Line-Signature
      -> token / 歸因快照 / LINE 身分比對
      -> line_events MATCHED_ADS
      -> 合格 business_conversions verified_line_contact
      -> 唯一 conversion_outbox
      -> Cloudflare Production scheduled uploader
      -> Data Manager events:ingest
      -> requestId 持久化
      -> requestStatus:retrieve 真正終態
      -> Atomic completion／去重
      -> Google Ads 7674301565 轉換報表

正式 DB 身分的程式候選是 52453bad-90a3-4495-911b-c3d5b6cefb1f、hanyao-attribution-production；Ads Customer 是 4801404246，Action 是 7674301565。**程式設定不等於即時 Provider 已確認，必須再讀回。**

保留原本 webhook→D1→outbox→單一 Worker 的唯一寫入架構、快照、去重鍵、lease/fence、未知效果先對帳、Data Manager diagnostics、受保護主分支與已通過的 v1.3 P0-A/B/C/D/E 回歸契約。

## 3. 先區分三種問題

- **已證實的原始碼缺陷**：能指出本輪核對的程式檔案／控制規則；可以排入修正。
- **歷史發生、但現況未驗證**：舊報告中的 SYSTEM_CAPABILITY_RUN_DENY、部署來源 drift、GTM Admin 不完整等；不得說它現在仍然發生。
- **即時 UNKNOWN**：缺本輪 Cloudflare／Google／LINE 的合法 Provider 存取；不得偽填 0，也不得因程式 CI 綠燈就宣稱真正閉環。

舊 MCP 不在 Cloudflare 正式 webhook／scheduled Worker 執行熱路徑。**移除 MCP 可以解除稽核與調度卡關，但沒有證據支持「移除 MCP 就直接讓網站變快、LINE 客戶增加或 Ads CPA 降低」。**這些必須另做量測及真實 A/B。

## 4. 應移除的舊 MCP 依賴（附實際位置）

| ID | 等級 | 檔案／控制 | 查明問題 | 施工 |
|---|---|---|---|---|
| MCP-01 | P0 | governance/hanyao/policy/20260919T151100+0800-EP-HG10.json | known_good_path 強制 FACTORY_MCP_SYSTEM_ADS_READBACK；fallback_paths 是空陣列 | 只由 HANYAO 發布相容的新 Policy，原生唯讀優先 |
| MCP-02 | P0 | scripts/ads-optimization-gate-ledger.ts | WP02/WP03 硬編碼 FRESH_GOVERNED_FACTORY_MCP_RUNTIME_TRANSPORT_REQUIRED...；保留 9/18 tunnel 狀態 | 改用最新 API 讀回結果決定 READY，不用退役 transport Gate |
| MCP-03 | P0 | scripts/google-ads-provider-host-runner.ps1 | 強制 NT AUTHORITY/SYSTEM，混合唯讀與寫入模式，掃描不同使用者 gcloud 配置 | 以目前合法使用者的原生 Node／gcloud 取代包裝，保留可用 Ads 程式 |
| MCP-04 | P0 | scripts/hg10-system-readback-runner.ps1 | 強制 SYSTEM、查找各使用者 Wrangler 配置，還呼叫 MCP 世代宿主程式 | 以單一原生唯讀稽核器取代 |
| MCP-05 | P1 | scripts/google-ads-provider-host-runner-static.test.mjs、scripts/hg10-system-readback-runner-static.test.mjs | 測試反而守護退役 SYSTEM 限制 | 換成原生路徑、秘密保護、出錯降級及功能等價測試 |
| MCP-06 | P1 | package.json test:hg10:readback、test:google-ads:host-runner | CI 依然呼叫舊測試 | 更新腳本，保留完整 P0/P1 核心測試 |
| MCP-07 | P1 | .github/workflows/ads-line-required-gate.yml、ads-line-hardening.yml、ads-line-production-preflight.yml | 還對舊 SYSTEM PowerShell 做 parser／靜態驗證 | 用原生 reader 驗收取代；不能移除 required checks |
| MCP-08 | P1 | docs/HANYAO_GOOGLE_ADS_HOST_PROVIDER_RUNNER_20260918.md、docs/HANYAO_WP10_PROVIDER_SURFACE_REBASE_20260918.md 等 | 歷史做法誤導下一個工作階段 | 標為已廢棄、提供最新規格入口，保留稽核歷史 |
| MCP-09 | P1 | 工作日誌／復工環節 | 尚無已證實可跨 Web／Codex 自動回收的 HANYAO 原生執行收據 | 使用既有 HANYAO GitHub／工作成果檔案，補最小 Resume Packet，不建第二套控制系統 |

**實體刪除順序**：先完成替代與功能等價測試 → 停用 HANYAO 舊 consumer → 通過無 MCP 回歸 → 才刪 HANYAO 專屬舊 runner 和測試。不能刪共享 Factory MCP 的 Windows 服務、VM、broker 或治理 repo 內其他專案資料；那不是 HANYAO 施工權。

## 5. 即使 MCP 被排除，仍有的資料正確性缺口

### D1-01：錯誤回應被誤判為零

scripts/cloudflare-d1-readonly.mjs 對缺失的 meta.rows_written、meta.changes、meta.rows_read 預設為零，對不存在的 results 也可得到空陣列；hg10-e17-d1-readback.mjs 和 conversion-closure-classifier.mjs 亦使用 Number(value ?? 0)。

必修：驗證頂層 success、單一 query result 的 success、results 陣列、meta.changed_db 明確 false、rows_written 與 changes 明確為零、rows_read 為非負有效數字；每個聚合查詢必須有一筆完整且型別正確的結果。若 Cloudflare 官方將 meta 欄位定義為選用，缺少安全驗收所需 meta 時報 UNKNOWN／證據不足，而不是聲稱真的寫入，也不是假 PASS。

### D1-02：同一天各段都有 1 筆，不等於同一真人完整閉環

原本 classifier 是日級計數判斷，不能用 LINE 匹配數、outbox 數、provider 成功數及 Ads 日期總數同時大於 0，就認定它們屬於**同一 transaction_id**。

新分類分兩層：每日營運總數對帳；及指定真人的 exact lineage 查核。

Exact lineage 須串起：line_event_id／lead_token／business_conversion_id／conversion_id／transaction_id／attempt_id／requestId／正確 Google destination／原子完成收據，然後確認 Google Ads 正確 action 的 conversion-date 報表相容。**Google Ads 日彙總未必能公開逐筆對應某個匯入交易；若缺個別證據，標記「日報表相容、個別歸因仍未證實」，不可假造逐筆證明。**

### D1-03：歷史與即時數據不可混同

正式 2026/09/19 證據顯示，**9/17 當日歷史記錄**為 MATCHED_ADS 1、business 1、eligible 1、outbox 1、provider attempt 1、requestId 1、診斷成功 1、Ads 日期轉換 1，closure_state=REPORTING_DELTA_CONFIRMED。這是**當時的歷史對帳證據**，不能當成今天 10/9 的實時累計。

### D1-04：current main 缺更細原因碼

PR #88 已新增 match_reason 候選、0018 migration、LINE 原因分類與多日查詢，但**尚未合併**。目前 main 只到 0017，不能對未具備原因碼的舊資料臆測 NO_TOKEN／UNKNOWN_TOKEN／ATTRIBUTION_EXPIRED。舊資料保留 LEGACY_UNCLASSIFIED；PR #88 合併與 Production migration 分開驗收。

### D1-05：PR #89 已存在但仍紅燈

PR #89 的三個 CI 在 2026/10/03 都因相同 TypeScript 測試型別錯誤而停下：

- scripts/google-ads-read-scope.test.ts 第 90 行：故意錯的 OAuth scope 違反 literal type。
- 同檔第 121 行：故意測試 65537 bytes 超限違反 65536 literal type。

正確修法是：保留執行期非法輸入驗證，在測試 fixture 以序列化的未知物件產生反例，不要把 runtime guard 刪掉；清理與 PR #88 共用檔案的衝突；再跑 exact-head CI。也要稽核新的 admitted-scope receipt 是否重複增加人類授權關卡；已獲授權的唯讀查詢不應因新規則無端停工。

## 6. 功能完整性分層稽核

| 系統／功能 | 目前證據 | 尚缺內容 | 優先級 |
|---|---|---|---|
| 第一方 Ads 點擊歸因 | gclid／gbraid／wbraid、token、snapshot 程式已存在 | 真正各活動歸因成功率、不同裝置失敗率 | P1 |
| LINE 按鈕／桌面 QR | 原始 CTA、prepare、fallback 具程式 | 真人點擊到真正送出訊息流失比例 | P1 |
| LINE Webhook | HMAC 簽章、去重、身分比對 | 即時失敗原因及 LINE Admin webhook redelivery | P0 先讀 |
| Production D1 | 單一正式 D1 配置候選 | 即時 schema、0016/0017/0018 實際套用、每日真實數 | P0 |
| Google Data Manager | 來源程式有 ingest／requestId／診斷／重試 | 實際終態、警告與重複風險、各筆 lag | P0 |
| Google Ads | SearchStream v25 唯讀程式 | Action／Goal／日期報表即時數字、轉換延遲 | P0 |
| 合格客戶／成交 | qualified_line_lead、won_job 階段程式 | 真實人工判定與價值、Provider destination | P1/P2 |
| LINE Message Asset | WP05 候選與 UI/API 前置工具 | 實際資產掛載、政策審核、真人對話成果 | P1 |
| GTM／GA4 | 網站 dataLayer；GTM Bridge 程式 | GTM 公布狀態、GA4 自訂維度／事件目前版本 | P1 |
| 搜尋字詞排除 | WP02 分類與 exact-negative engine | 最新 search terms、現有負關鍵字、浪費預算 | P1 |
| RSA 素材 A/B | WP03 分階段 engine | 最新四活動 RSA Inventory、Ad Strength、實際成效 | P1 |
| Smart Bidding | WP09 S0–S4 安全規範 | S1 真實閉環及 S2 穩定觀察，禁止提前切換 | P2 |
| 跨 Session 報表 | GitHub control pointer 與舊收據 | 每日原生唯讀排程及變化通知、必要工作收據 | P0 |
| 網站效能 | WP06 五頁三次 Lighthouse 工作流程 | 今日真正 p75 LCP／INP／CLS、載入漏斗 | P1 |

程式中的 MESSAGE_ASSET_METRICS_ENABLED=false、GOOGLE_ENHANCED_CONVERSIONS_USER_DATA_ENABLED=false 是目前安全分階段啟用狀態，**不應直接判成故障或強迫打開**。

## 7. 不可虛構的效能檢查

原本 production source 設定 Cron 每五分鐘一次、每輪 MAX_ROWS_PER_SCHEDULE=5，並預留診斷名額。滿載時理論最多 1440 個 row selections／日，但**不是實際可成功送出的轉換數**，也沒有任何本輪量測證據顯示已經塞車。

必須從真實 Provider 讀取以下 p50／p95、分位或計數：

- 網站有效廣告落地到 Attribution Session 建立的比例。
- LINE CTA 點擊、prepare 成功、開啟官方 LINE、真正發送含 HY 訊息的比例；按服務／手機／桌面分層。
- LINE 簽章驗證時間、webhook 接收到 D1 寫入延遲。
- D1 查詢 meta.rows_read／duration，索引是否命中，避免 33 日報表全表掃描。
- business → outbox、outbox 進入候選 → Worker 實際送出、requestId → diagnostics 終態的延遲。
- Data Manager 終態 → Ads conversion-date 報表出現的延遲。
- pending／processing／SENT_UNKNOWN／RECONCILIATION_REQUIRED 的存量與最舊等待時間。
- 真正 Ads verified LINE contact／100 次付費點擊、每筆真正諮詢成本、qualified／verified、won／qualified。
- 五頁 Lighthouse 三次中位數與 CrUX 真實 LCP／INP／CLS p75 分開報告。

先量測，再修正瓶頸；**不得保證修好 MCP 就省下 X% Token、增加 X% 客戶或降低 X% 廣告費。**

## 8. 施工工作包與並行關係

### HN00｜恢復正式專案身分、鎖定查詢來源（P0，唯讀）

1. 從 Directory 精確取得 HANYAO project id、repository id、control locator。
2. 讀 current.json、Checkpoint 2、Mission、Policy、main、ruleset、PR #88/#89 與最近相關 CI。
3. 以 source path＋精確 SHA 列出所有 MCP 消費端與現有測試，確認沒有忘記某個 runner。
4. 輸出 sanitised HN00-PRESTATE 收據：來源、時間、版本、未解決外部副作用、下一步。不得寫新控制系統。

**PASS**：不再把 HANYAO 控制指標查到 Directory Repo，舊 checkpoint 不重做。

### HN01｜原生 Win11 Codex 執行能力與合法身分驗證（P0，唯讀）

只用**目前被授權的使用者身分**，確認 node、git、PowerShell、gcloud、Wrangler 能力；既有 Google Cloud service account impersonation 可取得短效 Google Ads OAuth token；Cloudflare 可以取得只讀 D1 scoped token／Wrangler 授權。不要掃 C:\Users 其他使用者資料，不依賴 NT AUTHORITY/SYSTEM，不建立服務帳號 JSON key，不輸出任何 Token。

當某組憑證缺失，回報 CLOUDflare_AUTH_UNAVAILABLE 或 GOOGLE_ADS_AUTH_UNAVAILABLE，只擋該 Provider，繼續 source／其它 Provider 讀取。

### HN02｜P0-A 9/7～10/9 真實轉換逐日唯讀（P0）

對 2026/09/07～10/09 共 33 日，用 Asia/Taipei 日期欄位，必要時分成 <=30 日查詢批次：

- D1：MATCHED_ADS、match_reason／狀態、business conversion、ELIGIBLE、outbox pending／submitted／success／deduplicated／failed、provider attempt／requestId／診斷終態及需人工對帳數。
- Google Ads：只讀 Action 7674301565，查 segments.date、segments.conversion_action、metrics.all_conversions_by_conversion_date，以及 Action 累計和最後轉換／收到請求日期。
- Data Manager：只針對已存在 requestId 調用 requestStatus:retrieve，絕不 events:ingest 補送。
- 每日列出真數、來源、讀取時間、差額與尚無法一對一解釋的原因。
- 必須嚴格驗證 D1 meta、Google SearchStream response；遺失欄位回 UNKNOWN，不可當零。

LIVE_REQUIRED 模式：若正式 D1 或 Ads 必要來源缺失，不能返回整體 PASS。保留本輪新交付的獨立 Node v2 稽核器作離線參考，但先校驗檔案 SHA；PR #88/#89 亦必須判定是否更值得直接接續重用。

### HN03｜真正逐筆對帳與不會重複通知的定期監控（P0）

使用 Windows 原生 Task Scheduler／已授權合法排程器，或符合現有權限的 GitHub 工作流程；所有運作不需要 ChatGPT Web 一直開著，也不需要 Factory MCP。

監控有「新增真人訊息」、「D1 合格事件但無 outbox」、「outbox 超時」、「Data Manager UNKNOWN／FAILED」、「Ads 報表延遲」、「資料庫或 Action 漂移」、「憑證失效」等分類。只有真的有狀態變更才派給需要理解的 Codex，平時固定輪詢由原生程序負責。

不在公開 GitHub 或 CI log 保存 raw HY token、gclid、LINE userId、訊息內容、OAuth token。

### HN04｜舊 MCP 程式及 CI 完整替換（P0）

先開發原生唯讀 adapter，確保可完成舊 runner 的 HG10 E10、WP02 審核、WP03 RSA 清單讀取、HQ05 與 HQ07 前置讀取等功能。已存在的 WP02 exact-negative／WP03 RSA PAUSED create 等**寫入引擎程式必須保留，但這一輪不得呼叫 apply 模式**。

完成原生等價後：
1. 刪除 HANYAO 專屬 SYSTEM host 包裝及其僵化測試。
2. 修正 package.json 執行指令。
3. 在 required gate、hardening、preflight 工作流程，用原生安全測試取代舊 parser；不得移除主分支必要檢查名稱。
4. 將 WP02/WP03 MCP blocker 改成真正 provider/auth 狀態，測試不再鎖定 9/18 舊 tunnel。
5. 保留歷史事故報告，標示 SUPERSEDED，而非銷毀證據。

### HN05｜HANYAO 自身 Policy 去 MCP 與跨 Session 續接（P0）

在已驗證原生能力後，HANYAO 自行發布下一版 Policy，修正 known_good_path、fallback_paths、allowed_tool_classes，保留 D1 禁寫、Google Ads 唯讀、禁止盲重送、外部影響未知需先核查等條款。

以既有 canonical checkpoint 方式確定新版本，採 fresh prestate＋精確 CAS＋same-source readback；Checkpoint 2 原始歷史不可覆蓋，不能讓最新 Policy 逼迫舊已驗收工作重做。

只用 HANYAO GitHub／其既有證據位置產生最小 Resume Packet，不新造整套全域控制面；需要填 project_id、Mission／Policy、main SHA、候選 PR、最近 accepted checkpoint、未決外部效果、READY lane、阻擋原因、下一動作。

### HN06｜PR #88 的 LINE 歸因原因改善（P1）

檢查 exact PR head、0018 schema additive、安全回填、token／LINE 簽章／去重、QR browser smoke 防假綠燈及最終工作流程。通過現行受保護 CI 且有對應 Production Pages 影響授權後，才能合併。正式 D1 migration 0018 是**另一個需明確驗收的 Production 寫入**；不得因合併程式就暗中套用。沒有 0018 先用相容查詢，不阻塞 HN02。

### HN07｜PR #89 修兩項 TypeScript、減少過度治理（P1）

修第 90／121 行非法資料 fixture 的型別建構，不降低 runtime 安全。與 #88 共用 reconciliation.mjs 要以精確 Git 預先比較合併。保留合法 size／quota／期限限制，但不得新增「沒有額外人類核准文件就不能唯讀」的自我上鎖。三個 required CI 必須同一 exact head PASS 才能合併。

### HN08｜Cloudflare／Google／LINE 全部正式環境只讀凍結（P0）

Pages：真正部署 SHA／網址／來源；Worker：部署版本、Cron、D1 binding UUID、secret **名稱**、實際單一 writer；D1：schema／migration／索引／收據；Google Ads：action ENABLED、COUNT Every、Secondary、custom goal／campaign goal；Data Manager：requestId 的診斷及 destination；LINE Admin：webhook URL、是否啟用、redelivery／error 及正確 OA 身分。

結果必須標示 MATCH／DRIFT／UNKNOWN。不得用「GitHub config 有」代替 live deploy readback。

### HN09｜有確切證據後才做最小 Production 修復

只處理 HN08 證實的特定 drift、由 HANYAO 目前 Mission 授權的寫入。部署 Worker、改 Cron、套 migration、動 GTM/GA4、改 Ads Campaign，皆獨立列出 prestate、變更範圍與驗收。

完整流程：fresh prestate → exact target＋授权 → dry-run／validateOnly（若適用）→ 單次寫入 → provider 同來源讀回 → CONFIRMED／NOT_APPLIED／PARTIAL_OR_AMBIGUOUS。未知外部效果不得重送。

### HN10｜廣告素材、官網、LINE 訊息與真正商業漏斗優化（P1）

在不動既有出價／預算／Primary 的基礎上讀：四活動 Search Terms、CTR／CPA／網站落地品質、RSA 素材、原生 LINE Message Asset 的真正資產狀態、官網 CTA／prepare／handoff／Webhook、GTM 公布版、GA4 維度，以及 qualified／won 實際商機。用每個環節真實損失率尋找瓶頸，再做單一廣告活動、單一落地頁的受控改善。

2026/09/17 歷史 Quality Score 冷氣維修 5、清洗 5、安裝 3、落地頁經驗偏弱，只能作為檢查線索，不能宣稱今天仍然相同。

### HN11｜真人自然 E7 閉環（獨立於上述施工）

真人 Ads 點擊 → 第一方 session → HY token → 真 LINE 訊息／簽章 → MATCHED_ADS → business ELIGIBLE → 唯一 outbox → 真 requestId → Data Manager 同 destination 終態 → atomic completion → Ads 轉換日期報表。

目前 9/17 有歷史對帳證據，但當日重新即時核驗及後續自然新客的 E7 仍應分別判定。未發生新真人事件不阻擋 HN01/02/04；禁止人工創造 Production 轉換或重複補送。

### HN12｜合格諮詢、成交與 Smart Bidding（後續階段）

先完成 S1 真實追蹤閉環，再 S2 觀察、S3 選單一活動實驗 Maximize Conversions 或 tCPA、S4 才考慮 AI Max；qualified_line_lead／won_job 要有真實商機與金額的可稽核來源。不得僅憑一次數字、按鈕點擊、Google 建議就把 verified_line_contact 設 Primary 或全帳戶換策略。

## 9. 必須具備的回歸測試

繼承原本 v1.3 T01～T30 和主分支兩項必過檢查；至少追加以下 N01～N50：

| 編號 | 驗證 |
|---|---|
| N01–N05 | 精確 Directory、Checkpoint 2 保持已完成、完全無 MCP 可唯讀、缺憑證回 UNKNOWN、單一 Provider 錯誤不鎖專案 |
| N06–N10 | 禁止跨帳號掃描／錯客戶身分、D1 缺 meta／results 必拒、寫入跡象必拒、真實數字 0 才接受、DB UUID 錯誤必拒 |
| N11–N15 | 0018 缺／有都能安全分類、Provider join 不重複、33 天分批不遺漏、台灣時間跨午夜正確 |
| N16–N20 | Ads 查無 action 和查無當日轉換區分、正確 action、SearchStream 畸形回覆、退役 Developer Token 不當門檻、429／限額處理 |
| N21–N25 | OAuth 失敗不輸出 token、不同 transaction 不可合成成功、ACK 但無終態不可成功、SUCCESS 有 warning 正確保留、PARTIAL_SUCCESS 不當全成功 |
| N26–N30 | UNKNOWN 不盲補、只允許同交易去重、缺 requestId 待對帳、Ads 延遲不可過早 PASS、單一 uploader 永遠不變 |
| N31–N35 | LINE HMAC 無效、HY 不符身分、缺／多 token、歸因逾期、重送 webhook 不得重複轉換 |
| N36–N40 | 通知去重、讀取中崩潰無外部寫入、上傳 ACK 中崩潰原有 fence 保持、PR #88 未合併不能當 Production、PR #89 編譯紅燈禁止合併 |
| N41–N45 | 舊 runner 移除後 required CI 全綠、MCP 關閉後工作不受影響、沒真人仍可稽核、跨 Session fresh bind、只驗 exact head |
| N46–N50 | Pages／Worker 來源差額、GTM／LINE Admin 權限未知不偽證、D1 Read Zero Write、僅隔離本機假資料測試不得造 Production 假 conversion |

## 10. 驗收門檻：不能全部混成一個 PASS

| Gate | 最低完成條件 |
|---|---|
| A0：MCP_FREE_SOURCE_PASS | HANYAO 所有正式執行及 required CI 不依賴 MCP／SYSTEM；原生功能等價；精確主分支 CI 綠燈 |
| A1：NATIVE_PRODUCTION_READBACK_PASS | 直接從真正 D1＋Google Ads 讀出指定日期，資料型別、安全 meta、完整 33 天及時間戳正確；無合法憑證時只能 UNKNOWN |
| A2：CROSS_PROVIDER_RECONCILIATION_PASS | 對 business、outbox、provider、Ads 的差額逐項分類；歸因與重複風險有來源證據，不拿日級數字當個別 transaction 證明 |
| A3：NATURAL_E2E_PASS | 真正自然客戶完整 E7-01～E7-10，非自己測試點擊、非 HTTP 200、非純 Worker 部署 |
| A4：PRODUCT_OPTIMIZATION_VALIDATED | 有真實 KPI baseline、單一變更組／對照、轉換品質及足夠觀察，不承諾無證據效益 |

MCP 完全移除的 source Gate A0 可以先完成；A1～A4 分別驗收，不可要求全部完成才准復工。

## 11. 安全、施工界線、停止條件

本規格施工不建立新金鑰、不讀出 Secret 內容、不變更正式 Ads 目標、出價、預算、不補送未知 Data Manager transaction、不從 D1 清除業務紀錄、不新增第二條轉換傳送器。

只在「確定寫入副作用、錯帳號、資料洩漏、錯資料庫、目標 drift、required CI 紅燈」時阻止**對應的單一 lane**。不能因 GTM 或 LINE Admin 未登入就阻止 GitHub 文字修正或 D1 之外的安全讀取。

卸除舊 MCP 先做 native read-only 能力等價，再刪舊包裝／測試，不直接停止全域 Factory 服務。舊 history、證據及已核准 Checkpoint 必須保留。若修正造成 regression，僅回滾精確源碼／Release，禁止以建立新 conversion transaction 當回滾。

## 12. 可跨工作階段直接續做的執行清單

1. **HN00／已完成本輪靜態稽核**：exact Directory、main、Checkpoint、PR、舊 MCP 所在位置和法規／Provider 依據均已核對。候選分支中的文字不是部署確認。
2. **HN01／待原生 Host 讀取**：合法 Win11 Codex 身分下判別 D1 Read、Ads OAuth、Data Manager diagnostics 可用性，不問重複授權，也不猜其他使用者的憑證。
3. **HN02／第一優先真數據**：執行 2026/09/07～10/09 即時報表。沒有真實 Provider 數字就明確回 UNKNOWN，不假裝為 0。
4. **HN04／同時進行原生化**：確定完全不用舊 MCP，修正假零值與 CI／Policy 不合理依賴，建立 exact-head PASS 的安全 PR。
5. **HN06／HN07／同時進行**：不重做 PR #88、#89 已完成工作；#88 保留及驗收，#89 修兩項 TS 錯誤／過度 Gate，根據衝突決定最小合併。
6. **HN08／待 provider 授權查證**：Pages／Worker／D1／Google／LINE／GTM／GA4 正式實況各自取同來源收據。
7. **HN03／HN05／本案自行交接**：GitHub 原生紀錄與安全本機每日監控，替換 HANYAO Policy 的 MCP good path；不等治理 V5.3。
8. **HN11／等真實業務事件**：自然 Ads→LINE E7 全鏈驗收；沒有事件不能造假的。
9. **HN10／HN12／後續產品優化**：以資料判斷是否值得改素材、LINE Message Asset、落地頁、qualified 商機與 Smart Bidding。

## 13. 最後裁決

    PROJECT_ID=HANYAO_ADS_LINE_PROD
    MAIN_SHA_AT_AUDIT=e917139e4e81a12e41ef5ead507589ae0bf48452
    CURRENT_CHECKPOINT=2
    HG10_CONTROL_REBASE=COMPLETED
    NO_MCP_NATIVE_SPEC=CONSTRUCTION_CANDIDATE
    OLD_MCP_SOURCE_DEPENDENCY=CONFIRMED
    OLD_MCP_FILES_DELETED=NO
    PR88=OPEN_UNMERGED
    PR89=OPEN_CI_BLOCKED
    PRODUCTION_D1_LIVE_COUNTS=UNKNOWN
    GOOGLE_ADS_LIVE_COUNTS=UNKNOWN
    NEW_NATURAL_E2E=WAITING_REAL_EVENT
    PRODUCTION_DATA_MUTATION=NONE
    SHARED_FACTORY_MUTATION=NONE
    NEXT_EXECUTOR=HANYAO_CODEX_NATIVE
    NEXT_UNIT=HN01_AND_HN02

這份施工計劃以 **HANYAO 專案本身**作為全部業務工作的擁有者，並將舊 MCP 的移除限定於 HANYAO 可管理的消費端。只有日後證明某個通用工具缺陷同時影響其他專案時，才交由共享治理專案負責那一項通用基礎設施。

## 14. 可重現的主要證據連結

- [正式 HANYAO Directory](https://github.com/PT-Original-Point/ptysd-vnext42-governance-sandbox/blob/governance/project-directory/directory/projects/HANYAO_ADS_LINE_PROD.json)
- [HANYAO Current Pointer](https://github.com/t14210184/hanyao/blob/governance/hanyao-control/governance/hanyao/current.json)
- [HANYAO Checkpoint 2](https://github.com/t14210184/hanyao/blob/governance/hanyao-control/governance/hanyao/checkpoints/000002.json)
- [HANYAO Policy](https://github.com/t14210184/hanyao/blob/governance/hanyao-control/governance/hanyao/policy/20260919T151100%2B0800-EP-HG10.json)
- [LINE 原因分類 PR #88](https://github.com/t14210184/hanyao/pull/88)
- [唯讀監控 PR #89](https://github.com/t14210184/hanyao/pull/89)
- [9/17 的 HG10 歷史對帳](https://github.com/t14210184/hanyao/blob/governance/hanyao-control/governance/hanyao/evidence/HG10_E17_20260917_20260919.json)
- [Cloudflare D1 Query REST](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/)
- [Google Ads Developer Token 2026/9/9 淘汰](https://developers.google.com/google-ads/api/docs/api-policy/developer-token?hl=zh-tw)
- [Google Ads API v25 指標定義](https://developers.google.com/google-ads/api/fields/v25/metrics)
- [Google Data Manager requestStatus.retrieve](https://developers.google.com/data-manager/api/reference/rest/v1/requestStatus/retrieve)

**注意：以上 GitHub branch 的這份文件僅是待施工規格，不自行使 HANYAO Mission 或正式 Policy 生效。**
