Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NOVA E-Commerce - Git Commit & Push (PowerShell)     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "d:\Kodikon 6.0\nova-ecommerce"

Write-Host "Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`nStaging all modified and new files..." -ForegroundColor Yellow
git add -A

Write-Host "`nCommitting changes..." -ForegroundColor Yellow
git commit -m "fix(ui): remove hackathon mentions from storefront and update hero banner"

Write-Host "`nPushing to GitHub (main branch)..." -ForegroundColor Yellow
git push origin main

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
