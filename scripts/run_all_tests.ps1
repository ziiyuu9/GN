# run_all_tests.ps1
# Automatically run lint, unit tests, and E2E tests

Write-Host "Starting tests and checks..." -ForegroundColor Cyan

$sourceDir = Join-Path $PSScriptRoot "..\source"
Push-Location $sourceDir

# 1. Run Biome lint
Write-Host "1. Running Biome..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Biome failed. Please fix style issues." -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}

# 2. Run Vitest
Write-Host "2. Running Vitest..." -ForegroundColor Yellow
npx vitest run --coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unit tests failed!" -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}

# 3. Run Playwright E2E
Write-Host "3. Running Playwright..." -ForegroundColor Yellow
npx playwright test
if ($LASTEXITCODE -ne 0) {
    Write-Host "E2E tests failed!" -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}

Write-Host "All tests passed successfully!" -ForegroundColor Green
Pop-Location
