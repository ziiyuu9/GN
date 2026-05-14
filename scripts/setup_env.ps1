param (
    [switch]$InstallTools
)

Write-Host "================================="
Write-Host " 咕奈 專案自動化開發環境設定腳本"
Write-Host "================================="

if ($InstallTools) {
    Write-Host "[執行] 安裝 2025/2026 現代化前端與測試工具..."
    # 假設我們使用 npm
    # npm install -D @biomejs/biome playwright vitest
    Write-Host "目前尚未初始化 package.json，此步驟留待架構確認後執行。"
} else {
    Write-Host "[提示] 若要安裝工具，請加上 -InstallTools 參數。"
}

Write-Host "[完成] 自動化腳本執行完畢。"
