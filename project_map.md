# 專案結構地圖 (Project Map)

本文件描述 GoodNight 專案的核心目錄與模組職責。

```text
GoodNight/
├── .git/                      # Git 版本控制
├── .github/workflows/ci.yml   # GitHub Actions CI（lint + test + build + e2e）
├── agents.md                  # AI 與開發者協作規範指南
├── changelog.md               # 版本更新日誌
├── project_map.md             # 專案目錄結構地圖 (本檔)
├── readme.md                  # 專案說明與啟動指南
├── package.json               # Node.js 相依套件設定（專案根目錄即 Next.js 專案）
├── biome.json                 # Biome 程式碼規範設定
├── next.config.ts             # Next.js 設定
├── playwright.config.ts       # Playwright E2E 測試設定
├── vite.config.ts             # Vitest 測試與 Vite 解析設定
├── docs/                      # 系統開發手冊
│   ├── architecture.md        # 電腦與網路系統架構設計
│   └── ui_ux_guidelines.md    # UI/UX 設計規範與指南
├── scripts/                   # 自動化工作腳本 (PowerShell)
│   ├── git_commit.ps1         # 自動化格式化與 Git 提交
│   └── run_all_tests.ps1      # 自動化執行全覆蓋測試
├── e2e/                       # E2E 測試資料夾
├── src/                       # Next.js 前端核心
│   ├── app/                   # App Router 頁面、全域樣式與 API 路由
│   ├── components/            # 可重用 React UI 元件
│   └── lib/                   # 工具函數與 API 共用邏輯
└── tts_server/                # 本地 TTS mock 服務（FastAPI，僅供測試）
```
