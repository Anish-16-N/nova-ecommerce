@echo off
echo ============================================
echo  NOVA E-Commerce - Run Tests
echo ============================================
echo.

cd /d "d:\Kodikon 6.0\nova-ecommerce"

echo [STEP 1] Running Backend API Tests...
cd backend
call npm test
cd ..

echo.
echo [STEP 2] Running Security Lab Tests (SQLi + XSS)...
cd security-lab\backend
call npm test
cd ..\..

echo.
echo [STEP 3] To run Playwright E2E tests:
echo   cd tests
echo   npx playwright test
echo.
pause

