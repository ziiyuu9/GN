# 咕奈 Project (Development APP)

## 專案概述 (Project Overview)
本專案為一個專業的APP開發環境。由資深網頁系統開發專家、系統架構專家、網路系統專家與行動裝置APP資深UI/UX設計專家共同規劃與建立。本專案確保高度的效能、良好的高併發處理能力與極致的用戶體驗。

## 系統架構規劃 (System Architecture & Tools 2025-2026)
目前選定的前沿開發與測試工具鏈包含：
- **核心架構**: 待定 (推薦使用 Next.js 或 Vite + React/Vue 以支援現代化 Web/APP 混合開發)
- **程式碼格式化與Linting**: [Biome](https://biomejs.dev/) - 2025/2026 極速且全能的代碼格式化與Lint工具，取代舊有的 Prettier + ESLint。
- **全覆蓋測試工具**: [Playwright](https://playwright.dev/) + [Vitest](https://vitest.dev/)
  - **Playwright**: 支援跨瀏覽器與跨平台的端到端 (E2E) 測試。
  - **Vitest**: 高速單元測試與組件測試。
  - *規則*: 測試腳本與專案開發須保持同步更新，保證測試全覆蓋。
- **版本控制**: Git + GitHub CLI (gh) 配合 Husky 自動化 Pre-commit hooks。

## 目錄結構說明
- `source/`: 核心源代碼與資源。
- `docs/`: 開發與系統文件。
- `scripts/`: 自動化腳本（如部署、測試、清理等重複性高工作）。
- `agents.md`: AI 代理與開發者協作規範指南。
- `project_map.md`: 專案結構地圖。
- `changelog.md`: 版本更新日誌。

## 開發指南
請參閱 `docs/` 與 `agents.md` 來了解協作規範與架構設計。任何重大修改請先提交 Plan 進行討論。
