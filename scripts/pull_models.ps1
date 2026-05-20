param (
    [string]$Model = "llama3"
)

Write-Host "================================="
Write-Host " 咕奈 AI 模型下載腳本"
Write-Host "================================="
Write-Host "[提示] 正在檢查 Ollama 是否運行中..."

try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434" -Method Get
    if ($response -match "Ollama is running") {
        Write-Host "[成功] Ollama 伺服器運行中！" -ForegroundColor Green
    }
} catch {
    Write-Host "[錯誤] 無法連線到 Ollama 伺服器，請確保 Ollama 已啟動。" -ForegroundColor Red
    exit
}

Write-Host "[執行] 準備下載模型: $Model"
Write-Host "[注意] 這可能會花費一些時間，取決於您的網路速度（Llama3 約需下載 4.7GB）。"
Write-Host "---------------------------------"

# 使用完整路徑以避免當前終端機 PATH 未更新的問題
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

if (Test-Path $ollamaPath) {
    & $ollamaPath pull $Model
} else {
    # 如果預設路徑找不到，嘗試直接執行 (假設使用者已經重開終端機)
    ollama pull $Model
}

Write-Host "---------------------------------"
Write-Host "[完成] 模型下載腳本執行完畢。可以使用 \`ollama run $Model\` 來測試！" -ForegroundColor Green
