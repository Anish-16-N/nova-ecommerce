@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo   NOVA E-Commerce - One-Click Git Push
echo ========================================================
echo.

cd /d "d:\Kodikon 6.0\nova-ecommerce"

:: Abort any stuck rebase or merge
git rebase --abort >nul 2>&1
git merge --abort >nul 2>&1

echo [1/3] Staging all files...
git add -A

echo [2/3] Committing changes...
git commit -m "update: sync latest code, routes, and configs" >nul 2>&1

echo [3/3] Pushing to GitHub (origin main)...
git push origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS: Changes successfully pushed to GitHub!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   Standard push failed, attempting pull and push...
    echo ========================================================
    git pull origin main --no-rebase --no-edit
    git push origin main
)

echo.
pause

