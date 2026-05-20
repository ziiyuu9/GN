param (
    [switch]$InstallDeps = $true
)

Write-Host "====================================="
Write-Host " 咕奈 Voice Cloning (TTS) 環境設定"
Write-Host "====================================="

$ttsDir = "source\tts_server"
if (-not (Test-Path $ttsDir)) {
    New-Item -ItemType Directory -Path $ttsDir | Out-Null
    Write-Host "[建立] 建立後端目錄: $ttsDir"
}

$venvDir = "$ttsDir\venv"
if (-not (Test-Path $venvDir)) {
    Write-Host "[執行] 正在建立 Python 虛擬環境..."
    # 使用 py 因為 Windows 上 python 指令有時會導向微軟商店
    py -m venv $venvDir
} else {
    Write-Host "[跳過] 虛擬環境已存在。"
}

if ($InstallDeps) {
    Write-Host "[執行] 準備安裝 PyTorch 與相關依賴 (這會花費一些時間)..."
    
    $activateScript = "$venvDir\Scripts\Activate.ps1"
    
    # 建立安裝腳本來確保在 venv 中執行
    $installScript = @"
& '$activateScript'
Write-Host ">>> 更新 pip..."
python -m pip install --upgrade pip

Write-Host ">>> 安裝 PyTorch (支援 CUDA 12.1)..."
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121

Write-Host ">>> 安裝 FastAPI 與伺服器依賴..."
pip install fastapi uvicorn python-multipart

# 備註: 這裡先不直接 pip install fish-speech，因為它可能有特殊的編譯需求，
# 我們先準備好基礎模型所需的 PyTorch 環境與 API 框架。
Write-Host ">>> 環境依賴安裝完成！"
"@
    
    $tempScript = "$ttsDir\temp_install.ps1"
    Set-Content -Path $tempScript -Value $installScript
    
    try {
        & powershell -ExecutionPolicy Bypass -File $tempScript
    } finally {
        Remove-Item -Path $tempScript -ErrorAction SilentlyContinue
    }
}

Write-Host "====================================="
Write-Host "[完成] TTS 後端環境設定完畢！"
Write-Host "接下來將建立 FastAPI 伺服器主程式。"
