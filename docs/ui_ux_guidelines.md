# UI/UX 設計規範與指南 (UI/UX Guidelines)

## 設計理念
身為 30 年經驗的資深 UI/UX 設計專家，本專案將採用極致現代化的設計語言：
- **深色模式為預設 (Dark Mode First)**
- **玻璃擬物化 (Glassmorphism)**
- **動態微動畫 (Micro-interactions)**

## 色彩系統 (Color Palette)
- **背景色**: 極深藍色 (例如 `#0f172a` 或 `#09090b`)
- **主色調 (Primary)**: 紫色到粉色的漸層 (例如 `linear-gradient(135deg, #8b5cf6, #ec4899)`)
- **文字顏色**: 白色 (`#ffffff`) 與淡灰色 (`#cbd5e1` 或 `#a1a1aa`)
- **面板背景 (Panel/Glass)**: 具有透明度的白色或淺灰色 (`rgba(255, 255, 255, 0.05)`) 加上背景模糊 (`backdrop-filter: blur(12px)`)

## 字體排版 (Typography)
- **字型 (Font)**: 優先使用系統內建現代無襯線字體，如 `Inter`, `Roboto`, `-apple-system`。
- **層級**: 大標題必須具備視覺衝擊力（可採用漸層文字），內文需保持高可讀性的行距 (Line-height `1.6` 以上)。

## 動畫與過渡 (Animations)
- 使用 **Framer Motion** 處理進場與退出動畫。
- 所有的按鈕與可互動元件都必須有 `.hover` 狀態的微小放大 (`transform: scale(1.02)`) 或位移 (`translateY(-2px)`)，並帶有平滑過渡 (`transition: all 0.2s ease-out`)。
- 避免突兀的樣式切換，所有改變都應該具備動畫效果。
- 使用 `card-grid` 和 `glass-panel` 元件保持卡片排列一致、響應式佈局良好。
