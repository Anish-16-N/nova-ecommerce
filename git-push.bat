@echo off
echo ========================================================
echo   NOVA E-Commerce - Git Sync & Push
echo ========================================================
echo.

cd /d "d:\Kodikon 6.0\nova-ecommerce"

echo Adding files...
git add -A

echo Committing...
git commit -m "fix(ui): clean hero banner and store assets"

echo.
echo Pulling latest remote changes (rebase)...
git pull --rebase origin main

echo.
echo Pushing to GitHub (main branch)...
git push origin main

echo.
echo ========================================================
echo Done! Changes pushed to GitHub.
echo ========================================================
pause
