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
git add .

echo Committing changes...
git commit -m "feat: complete realistic e-commerce platform and security lab for ROUTES"

echo.
echo Pushing to GitHub (main branch)...
git push origin main

echo.
echo ========================================================
echo Done! Changes pushed to https://github.com/Anish-16-N/nova-ecommerce.git
echo ========================================================
pause

