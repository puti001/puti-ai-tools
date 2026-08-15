# ANTIGRAVITY - Puti-AI 教學工具庫備份站

## 專案簡介
* **名稱**：Puti-AI 教學工具庫備份站
* **技術棧**：React 19, Vite, Tailwind CSS v4, Lucide React, Wouter, Web Audio API
* **發布平台**：GitHub Pages (GitHub Actions CI/CD)
* **線上網址**：https://puti001.github.io/puti-ai-tools/
* **Padlet 來源**：https://padlet.com/clongwh/puti_ai_tools

## 開發規範
1. 標題 prefix 必須帶有 `Puti-AI | `。
2. 頁尾版權宣告：`屏東縣後庄國小黃朝榮老師作品，免費分享，歡迎擴散推廣，嚴禁商用與任何侵權、不尊重著作權的行為，更多 Puti-AI 教學工具 點此前往(https://padlet.com/clongwh/puti_ai_tools)`。
3. 採用相對路徑 `base: "./"` 與 Hash 路由（`useHashLocation`）以完美相容 GitHub Pages。

## 目前進度
* [x] 本地依賴與構建流程配置完成
* [x] GitHub Pages 與 GitHub Actions 自動部署配置完成
* [ ] 抓取 Padlet 原始縮圖並加入 `tools.json`
* [ ] 升級卡片 UI 為視覺化縮圖版型（支援 lazy load、skeleton、fallback）
