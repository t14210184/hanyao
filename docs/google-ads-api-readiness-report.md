# 焓耀空調工程 Google Ads API 準備狀態檢查報告

本報告針對專案本地是否具備 Google Ads API 連線與 read-only 稽核能力進行全面檢驗。

---

## 一、 Google Ads API 憑證現狀稽核

經實地檢查專案 `secrets/` 目錄、配置檔案與本地環境變數，結果如下：

1.  **憑證存在狀態**：**無任何 Google Ads API 憑證**。
    *   `secrets/google-ads-api.json` ➔ **不存在**。
    *   `secrets/google-ads-config.env` ➔ **不存在**。
    *   環境變數 (Developer Token, Refresh Token, Customer ID 等) ➔ **未設定**。
2.  **Git 安全防護 (.gitignore)**：**安全通過**。
    *   `.gitignore` 檔案已更新並明確忽略了以下規則，確保未來任何 Ads 憑證絕不會被 commit 或 push：
        ```gitignore
        secrets/
        *google-ads*.json
        *google-ads*.env
        *refresh_token*
        *developer_token*
        ```

---

## 二、 Google Ads API 核心元件需求分析

若未來需要透過 API 進行全自動、read-only 的轉換與廣告活動優化稽核，以下為必要之技術元件：

### 1. 是否需要 Google Ads Developer Token？
*   **是的，絕對需要**。這是 Google Ads API 系統的強制要求。無論是讀取還是寫入，每一個 HTTP 請求的 Header 中都必須包含 `developer-token`，用以識別呼叫來源。

### 2. 是否需要 MCC / Manager Account (管理中心帳戶)？
*   **是的**。
    *   **獲取 Token 管道**：Google Ads Developer Token 必須在 Google Ads 管理中心 (MCC) 的「API 中心」進行申請與核發。普通的個人或企業投放帳戶是無法直接申請的。
    *   **授權路徑**：如果您的帳戶是在某個 MCC 管理之下，API 連線需要使用該 MCC 帳戶作為主體進行權限代理。

### 3. 是否需要 Customer ID / Login Customer ID？
*   **是的，兩者缺一不可**：
    *   **Customer ID (客戶 ID)**：指要進行稽核的實際廣告投放帳戶（例如：`Leads-Performance Max-2` 所在的 10 碼數字帳戶 `XXX-XXX-XXXX`）。
    *   **Login Customer ID (登入客戶 ID)**：指申請 API 憑證並擁有管理權限的 MCC 帳戶 ID。如果連線的 OAuth 憑證是由管理帳戶授權的，則必須在 API 請求中帶上此參數作為存取上下文，否則會遇到 `USER_PERMISSION_DENIED` 拒絕錯誤。

---

## 三、 下一步安全整合指引

為防止敏感的金鑰、密鑰在聊天對話、日誌中暴露，**請不要將憑證貼在對話中**。如果未來批准進入 API 稽核階段，請在您的本地專案中準備以下兩個檔案：

### 1. 建立 [NEW] `secrets/google-ads-api.json` (OAuth 用戶端憑證)
```json
{
  "client_id": "YOUR_GOOGLE_ADS_CLIENT_ID.apps.googleusercontent.com",
  "client_secret": "YOUR_GOOGLE_ADS_CLIENT_SECRET"
}
```

### 2. 建立 [NEW] `secrets/google-ads-config.env` (API 運作參數與 Token)
```env
GOOGLE_ADS_DEVELOPER_TOKEN="您的_google_ads_developer_token"
GOOGLE_ADS_REFRESH_TOKEN="您的_oauth_refresh_token"
GOOGLE_ADS_CUSTOMER_ID="您的_廣告投放帳戶_ID"
GOOGLE_ADS_LOGIN_CUSTOMER_ID="您的_管理中心MCC_ID"
```

---

## 四、 進程與安全聲明

*   **API 呼叫狀態**：**未進行任何 API 連線或測試**（目前處於 100% 靜態檢查狀態）。
*   **軟體套件檢查**：**未執行 npm install**（無任何第三方 Ads SDK 依賴安裝）。
*   **狀態確認**：本地準備已就緒，已暫停一切操作，等待您的下一步指令。
