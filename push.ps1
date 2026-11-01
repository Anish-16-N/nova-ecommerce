Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NOVA E-Commerce - One-Click Git Push (PowerShell)    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "d:\Kodikon 6.0\nova-ecommerce"

# Abort any lingering rebase or merge
git rebase --abort 2>$null
git merge --abort 2>$null

Write-Host "[1/3] Staging all files..." -ForegroundColor Yellow
git add -A

Write-Host "[2/3] Committing changes..." -ForegroundColor Yellow
git commit -m "update: sync latest code, routes, and configs" 2>$null

Write-Host "[3/3] Pushing to GitHub (origin main)..." -ForegroundColor Yellow
git push origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS: Changes pushed to GitHub!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "`nRetrying with merge pull..." -ForegroundColor Yellow
    git pull origin main --no-rebase --no-edit
    git push origin main
}

