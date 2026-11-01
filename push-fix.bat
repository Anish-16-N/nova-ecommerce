@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo   NOVA E-Commerce - Ultimate Git Push & Diagnostics
echo ========================================================
echo.

cd /d "d:\Kodikon 6.0\nova-ecommerce"

set "LOGFILE=d:\Kodikon 6.0\nova-ecommerce\git-push-result.txt"

echo [1/4] Aborting any interrupted rebase/merge... > "%LOGFILE%"
git rebase --abort >> "%LOGFILE%" 2>&1
git merge --abort >> "%LOGFILE%" 2>&1

echo [2/4] Staging all files... >> "%LOGFILE%"
git add -A >> "%LOGFILE%" 2>&1

echo [3/4] Committing changes... >> "%LOGFILE%"
git commit -m "update: sync all project code, routes, and tests" >> "%LOGFILE%" 2>&1

echo [4/4] Attempting push... >> "%LOGFILE%"
git push origin main --force >> "%LOGFILE%" 2>&1

type "%LOGFILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Pushed to GitHub.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   Push encountered an error. Check the details above!
    echo ========================================================
)
pause

