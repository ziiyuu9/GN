# 咕奈 GoodNight Project (Development APP)

## 專案概述 (Project Overview)
本專案為一個專業的APP開發與網頁系統開發環境。由資深網頁系統開發專家、電腦系統架構專家、網路系統專家、開發手冊架構撰寫專家與30年經驗的行動裝置APP資深UI/UX設計專家共同擬定架構。

本專案確保高度效能、處理高併發的能力與極致的現代化用戶體驗（如：深色模式、玻璃擬物化微動畫設計）。

## 系統架構規劃 (System Architecture & Tools 2025-2026)
- **核心架構**: Next.js 16 (App Router) + React 19
- **UI/UX 設計**: Framer Motion + Vanilla CSS (Glassmorphism & Dark Theme)
- **程式碼格式化與 Linting**: [Biome](https://biomejs.dev/) (取代 ESLint/Prettier)
- **全覆蓋測試工具**: Playwright (E2E) + Vitest (單元測試)
- **版本控制**: Git + GitHub CLI (`gh`)，並強制使用 Semantic Commits。

## 目錄結構說明 (Directory Structure)
- `src/`: Next.js 專案源始碼（App Router 頁面、元件、API 路由）。
- `tts_server/`: 本地文字轉語音伺服器（FastAPI mock，僅供本地測試）。
- `e2e/`: Playwright E2E 測試。
- `docs/`: 系統架構與設計手冊。
- `scripts/`: 自動化任務腳本（測試、部署、格式化、提交）。
- `agents.md`: AI 代理與開發者協作規範指南。
- `project_map.md`: 專案結構與模組地圖。
- `changelog.md`: 版本更新日誌。

## 快速啟動 (Quick Start)

### 安裝與開發環境啟動
```bash
npm install
npm run dev
```

### 環境設定（.env.local）
故事生成後端二擇一（兩者都設定時優先 Groq，失敗自動退回 Ollama）：
```bash
# 方案一：Groq 雲端（https://console.groq.com/keys 免費申請）
GROQ_API_KEY=gsk_xxxx
GROQ_MODEL=llama-3.3-70b-versatile   # 可省略，此為預設

# 方案二：本地/區網 Ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434   # 可省略，此為預設
OLLAMA_MODEL=gemma4:26b                  # 預設 llama3，建議改為已安裝的模型

# 語音克隆（可選）：HF token 可提高 ZeroGPU Space 配額
HF_TOKEN=hf_xxxx
```

### 執行測試
```bash
# 單元測試與覆蓋率
npm test

# E2E 測試（首次需先 npx playwright install chromium）
npx playwright test
```

### 主要 API 路由
- `/api/generate-story`: 生成繁體中文床邊故事（Groq 雲端 → 本地 Ollama 自動 fallback）
- `/api/clone-voice`: 上傳語音樣本，代理 Hugging Face Space `tonyassi/voice-clone`（XTTS-v2）
- `/api/generate`: 串流版故事生成（直連本地 Ollama）

### 已知限制
- 語音克隆 Space 的 XTTS 語言寫死為英文，輸入中文文本時發音效果有限。
- 免費 ZeroGPU Space 有排隊與配額限制，尖峰時段可能需重試。

## 開發指南
請參閱 `docs/` 與 `agents.md` 來了解協作規範與架構設計。任何重大修改請先建立 Plan 進行討論。
