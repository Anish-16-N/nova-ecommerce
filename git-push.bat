@echo off
echo ========================================================
echo   NOVA E-Commerce - Git Commit & Push
echo ========================================================
echo.

cd /d "d:\Kodikon 6.0\nova-ecommerce"

echo Checking status...
git status

echo.
echo Adding all project files...
git add -A

echo Committing changes...
git commit -m "fix(ui): remove hackathon mentions from storefront and update hero banner"

echo.
echo Pushing to GitHub (main branch)...
git push origin main

echo.
echo ========================================================
echo Done! Changes pushed to GitHub.
echo ========================================================
pause
