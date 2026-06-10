# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed (2026-06-10 debug 總整理)
- 補上缺漏的 `@gradio/client` 相依（先前 import 了未安裝的套件，build 直接失敗）。
- `clone-voice` 改用 `Client.connect()` 新版 API（舊版 `client()` 具名匯出已於 v1.0 移除）。
- 修正 Groq 模型名稱：`llama3-70b-8192` 已被 Groq 下架，改為 `llama-3.3-70b-versatile`（可用 `GROQ_MODEL` 覆寫）。
- `generate-story` 新增後端 fallback 鏈：Groq（有 key 時）→ 本地 Ollama（`OLLAMA_BASE_URL`/`OLLAMA_MODEL` 可設定），失敗時回傳明確的 503 錯誤訊息。
- 修正 `VoiceSynthesizer` 的 object URL 清理邏輯（原本錄音樣本一更新就會把仍在播放的合成音檔 URL 一併 revoke）。
- 重寫 E2E 測試以符合現行 UI（原測試針對舊版 UI，selector 全數失效）。
- 更新單元測試以符合新的 route 行為（mock `@gradio/client`、明確走 Ollama fallback 路徑）。
- 修正 CI workflow：repo 重構後程式碼已在根目錄，移除 `cd source`；補上 Playwright browser 安裝步驟。
- 移除殘留檔案：`source/.next/` 建置產物、`src/app/page.html` 舊靜態頁。
- 更新 `readme.md` 與 `project_map.md` 過時的目錄結構與啟動指令。

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
