Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NOVA E-Commerce - Git Sync & Push (PowerShell)       " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "d:\Kodikon 6.0\nova-ecommerce"

Write-Host "Staging files..." -ForegroundColor Yellow
git add -A

Write-Host "`nCommitting (if any unstaged changes remain)..." -ForegroundColor Yellow
git commit -m "fix(ui): clean hero banner and store assets"

Write-Host "`nPulling latest remote changes with rebase..." -ForegroundColor Yellow
git pull --rebase origin main

Write-Host "`nPushing to GitHub (main branch)..." -ForegroundColor Yellow
git push origin main

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  Successfully synced and pushed to GitHub!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
