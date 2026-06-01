# deploy_to_vercel.ps1
# Deploy GoodNight project to Vercel (ASCII version to prevent PowerShell encoding errors)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    GoodNight Vercel Deployment Helper" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Vercel CLI..."
Write-Host "If this is your first time, a browser window will open for you to log in." -ForegroundColor Yellow
Write-Host ""
Write-Host "When prompted, please answer as follows:" -ForegroundColor Green
Write-Host "1. Set up and deploy? -> Type: Y" -ForegroundColor Green
Write-Host "2. Which scope do you want to deploy to? -> Press Enter" -ForegroundColor Green
Write-Host "3. Link to existing project? -> Type: N" -ForegroundColor Green
Write-Host "4. What's your project's name? -> Press Enter (defaults to good-night)" -ForegroundColor Green
Write-Host "5. In which directory is your code located? -> Press Enter" -ForegroundColor Green
Write-Host "6. Want to modify these settings? -> Type: N" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to start deployment..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

$sourceDir = Join-Path $PSScriptRoot "..\source"
Set-Location $sourceDir

Write-Host "`nRunning: npx vercel..." -ForegroundColor Yellow
$env:COMPUTERNAME = "Desktop"
npx vercel

Write-Host "`nDeployment Completed!" -ForegroundColor Green
Write-Host "To push your changes to Production later, run: npx vercel --prod" -ForegroundColor Cyan
Write-Host ""
pause
