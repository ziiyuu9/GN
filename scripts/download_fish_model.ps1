Write-Host "====================================="
Write-Host " 咕奈 Fish Speech 模型下載 (HuggingFace)"
Write-Host "====================================="

$ttsDir = "source\tts_server\fish-speech"
$activateScript = "..\venv\Scripts\Activate.ps1"

$script = @"
cd $ttsDir
& '$activateScript'

Write-Host ">>> 安裝 huggingface_hub..."
pip install huggingface_hub

Write-Host ">>> 開始下載 Fish Speech 1.5 預訓練模型..."
Write-Host "注意：模型大小約數 GB，根據您的網路速度可能需要一段時間。"

huggingface-cli download fishaudio/fish-speech-1.5 --local-dir checkpoints/fish-speech-1.5

Write-Host ">>> 模型下載完成！"
"@

$tempScript = "source\tts_server\temp_hf_download.ps1"
Set-Content -Path $tempScript -Value $script

try {
    & powershell -ExecutionPolicy Bypass -File $tempScript
} finally {
    Remove-Item -Path $tempScript -ErrorAction SilentlyContinue
}

Write-Host "====================================="
Write-Host "[完成] Fish Speech 核心權重準備完畢。"
