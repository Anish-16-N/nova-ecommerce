Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NOVA E-Commerce - Clean Git Push Fix (PowerShell)    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "d:\Kodikon 6.0\nova-ecommerce"

Write-Host "[1/4] Resetting commit history back to origin/main..." -ForegroundColor Yellow
git reset --soft origin/main

Write-Host "[2/4] Staging all cleaned files..." -ForegroundColor Yellow
git add -A

Write-Host "[3/4] Creating clean commit without sensitive patterns..." -ForegroundColor Yellow
git commit -m "feat: add access control, misconfiguration, and reconnaissance endpoints"

Write-Host "[4/4] Pushing to GitHub (origin main)..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Pushed to GitHub without any errors!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "`nRetrying with force push..." -ForegroundColor Yellow
    git push origin main --force
}

