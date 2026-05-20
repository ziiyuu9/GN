# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- 初始化專案架構 (Next.js 16 + React 19)。
- 建立 `agents.md`、`changelog.md`、`project_map.md`。
- 引入 Biome 作為 Linter 與 Formatter。
- 引入 Playwright 與 Vitest 作為測試框架。
- 建立 `docs/` 開發手冊資料夾，包含 `architecture.md` 與 `ui_ux_guidelines.md`。
- 建立 `scripts/` 自動化腳本資料夾。
- 實作高質感 UI (Dark Mode, Glassmorphism, Framer Motion)。
- 重構故事生成與語音合成路由，統一前端 API 呼叫。
- 新增 `vite.config.ts` 與 React 測試支援。
- 補齊 `rate-limiter` 高併發防護與 mock fallback 行為。
- 新增 Vitest 單元測試與 E2E 自動化測試流程。
