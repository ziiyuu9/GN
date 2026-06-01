# 啟動 Next.js 開發伺服器並監聽所有網路介面
# 用法: .\scripts\start_public.ps1

Write-Host "🌐 正在啟動公開訪問模式..." -ForegroundColor Cyan
Write-Host ""

# 切換到 source 目錄
Push-Location source

# 取得本機 IP 位址
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" } | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    $ipAddress = "localhost"
}

Write-Host "✅ Next.js 開發伺服器將在以下地址啟動:" -ForegroundColor Green
Write-Host ""
Write-Host "  • 本機: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  • 網路: http://$($ipAddress):3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 若要分享給其他人，請提供: http://$($ipAddress):3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  注意事項:" -ForegroundColor Magenta
Write-Host "  1. 確保防火牆允許 TCP 連接埠 3000"
Write-Host "  2. 其他人需在同一網路環境下，或使用 VPN/ngrok 公開暴露"
Write-Host "  3. 後端 Ollama/TTS 服務也需對外部可訪問"
Write-Host ""

# 啟動開發伺服器（監聽 0.0.0.0）
npm run dev -- --hostname 0.0.0.0

Pop-Location
