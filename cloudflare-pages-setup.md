# Cloudflare Pages 部署說明文件

本專案採用 Next.js Static Export，在 Cloudflare Pages 上應設定為靜態網站託管。

---

## ⚙️ Cloudflare Pages 部署設定

在 Cloudflare 控制台新建 Pages 專案並連結 GitHub 儲存庫後，請使用以下設定值：

| 設定項目 (Configuration) | 設定值 (Value) | 說明 (Notes) |
| --- | --- | --- |
| **Framework preset** | `Next.js Static HTML Export` | 指定為 Next.js 靜態導出架構 |
| **Build command** | `npm run build` | 運行正式編譯命令。這會呼叫 `package.json` 中的 `"build": "next build"` |
| **Build output directory** | `out` | Next.js 靜態 HTML 編譯輸出資料夾 |
| **Root directory** | `/` | 專案根目錄 |

---

## 🛠️ 環境變數設定 (Environment Variables)

由於本專案採用 React 19 與 Next.js 15，建議在 Cloudflare Pages 的設定中指定 Node 版本：

| 變數名稱 (Variable) | 設定值 (Value) | 說明 (Notes) |
| --- | --- | --- |
| **`NODE_VERSION`** | `20` (或以上) | 指定編譯所使用的 Node.js 版本（建議 v20 以上） |

---

## ⚠️ 部署注意事項 (Important Guidelines)

1.  **不使用 `node20.exe`**：
    專案根目錄下的 `node20.exe` 與 `local-build.ps1` 僅作為**本機 Windows 環境**繞過 Node v22 非 ASCII 路徑崩潰的暫時解決方案。
    Cloudflare Pages 為 Linux 編譯環境，**完全不需要且不得使用 `node20.exe`**。Cloudflare 會直接透過標準的 `npm run build` (運行 `next build`) 來完成編譯。
2.  **正式 Build Script 規範**：
    Cloudflare 上的編譯必須始終依賴標準 Node 套件管理器運行的編譯腳本，即 `package.json` 中配置的：
    ```json
    "scripts": {
      "build": "next build"
    }
    ```
3.  **trailingSlash 支援**：
    本專案已在 `next.config.mjs` 中設定了 `trailingSlash: true`。這意味著每個路由均會輸出為 `index.html`（例如 `/about/` 會對應 `out/about/index.html`）。Cloudflare Pages 預設已完全支援此種檔案結構。
4.  **Robots.txt & Sitemap.xml 自動打包**：
    `sitemap.xml` 與 `robots.txt` 檔案置於專案根目錄的 `/public` 資料夾中。在 Cloudflare 編譯期間，Next.js 會自動將此資料夾內的所有資產完整搬移至 `/out/` 目錄下，確保發布後位於網域之根路徑。
