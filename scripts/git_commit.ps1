param(
    [string]$Type,
    [string]$Message
)

Write-Host "Preparing to commit..." -ForegroundColor Cyan

$testScript = Join-Path $PSScriptRoot "run_all_tests.ps1"
& $testScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed. Commit aborted." -ForegroundColor Red
    exit $LASTEXITCODE
}

$sourceDir = Join-Path $PSScriptRoot "..\source"
Push-Location $sourceDir

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

if (-not $Type -or -not $Message) {
    Write-Host ""
    Write-Host "Select Commit Type:" -ForegroundColor Cyan
    Write-Host "feat: New feature"
    Write-Host "fix: Bug fix"
    Write-Host "docs: Documentation"
    Write-Host "style: Formatting"
    Write-Host "refactor: Code refactoring"
    Write-Host "test: Testing"
    Write-Host "chore: Build/Tools"
    Write-Host ""

    $Type = Read-Host "Type (default: feat)"
    if ([string]::IsNullOrWhiteSpace($Type)) { $Type = "feat" }

    $Message = Read-Host "Commit message"
    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Host "Message cannot be empty!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

$commitMsg = "$($Type): $($Message)"

Write-Host "Running: git add . && git commit -m `"$commitMsg`"" -ForegroundColor Yellow
git add ..\
git commit -m $commitMsg

Write-Host "Commit completed!" -ForegroundColor Green
Pop-Location
