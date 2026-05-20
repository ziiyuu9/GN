# Auto-format and test script for Goodnight APP
# This script formats code with Biome, runs linting, and executes Vitest.

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Auto-Format & Verification..." -ForegroundColor Cyan

cd "$PSScriptRoot\..\source"

Write-Host "✨ 1/3 Running Biome Formatting..." -ForegroundColor Yellow
npx @biomejs/biome format --write .

Write-Host "🔍 2/3 Running Biome Linting..." -ForegroundColor Yellow
npx @biomejs/biome check .

Write-Host "🧪 3/3 Running Vitest (Run once)..." -ForegroundColor Yellow
npx vitest run

Write-Host "✅ All checks passed successfully! Your code is clean and tested." -ForegroundColor Green
