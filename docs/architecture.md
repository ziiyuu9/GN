# 系統架構設計手冊 (Architecture Guidelines)

## 1. 核心架構
- **前端框架**: Next.js 16 (App Router)
- **後端 API**: Next.js Serverless Functions / Route Handlers
- **本地 AI 模型與語音**: FastAPI (Python) 提供本地 TTS 模型 (Fish Speech) 推理與 Ollama 大語言模型中繼存取。

## 2. 網路系統與高併發處理策略
身為網路系統專家，我們針對文字與語音生成採用以下策略：
1. **Streaming (串流)**: 無論是生成故事文字或語音，皆盡可能採用 Server-Sent Events (SSE) 或 WebSocket 將內容一段一段即時推送到前端，而非等待全段生成完畢，以大幅降低首字節延遲 (TTFB)。
2. **非同步架構 (Asynchronous Processing)**: Next.js API 與 Python TTS API 中接採用非同步 (`async`/`await`) 處理。
3. **高併發保護**: 所有 API 路由皆應加入速率限制 (rate limiting) 機制，避免本地模型或 TTS 服務因短時間大量請求而失效。
4. **快取 (Caching)**: 靜態資源由 Next.js 內建快取層處理；重複的生成結果可考慮加入 Redis 或記憶體內快取。

## 3. 開發規範
- 採用 **Biome** 取代 ESLint 與 Prettier 以獲得極致效能的檢查速度。
- 型別檢查：嚴格啟用 TypeScript (strict: true)。
- 狀態管理：優先使用 React 內建的 Hooks (useState, useReducer, useContext)，若狀態過於複雜再考慮引入 Zustand。
