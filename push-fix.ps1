Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NOVA E-Commerce - Git Push & Diagnostics (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "d:\Kodikon 6.0\nova-ecommerce"

Write-Host "Resetting any stuck rebase state..." -ForegroundColor Yellow
git rebase --abort 2>$null
git merge --abort 2>$null

Write-Host "Staging all files..." -ForegroundColor Yellow
git add -A

Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "update: sync all project code, routes, and tests" 2>$null

Write-Host "Pushing to GitHub (origin main)..." -ForegroundColor Yellow
git push origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Successfully pushed to GitHub." -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "`nPush failed. Trying pull merge before pushing..." -ForegroundColor Yellow
    git pull origin main --no-rebase --no-edit
    git push origin main
}

