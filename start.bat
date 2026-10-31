@echo off
title NOVA All Services Starter
echo ========================================================
echo        PROJECT NOVA - Starting All Services
echo ========================================================
echo.

set ROOT=D:\Kodikon 6.0\nova-ecommerce

echo [1/3] Starting Main Backend (Port 5000)...
start "NOVA Backend (5000)" cmd /k "cd /d \"%ROOT%\backend\" && npm run dev"

timeout /t 2 /nobreak > nul

echo [2/3] Starting Security Lab Backend (Port 5001)...
start "NOVA Security Lab (5001)" cmd /k "cd /d \"%ROOT%\security-lab\backend\" && npm run dev"

timeout /t 2 /nobreak > nul

echo [3/3] Starting Frontend (Port 3000)...
start "NOVA Frontend (3000)" cmd /k "cd /d \"%ROOT%\frontend\" && npm run dev"

echo.
echo ========================================================
echo  All 3 services are launching in separate windows!
echo  - Main Store:    http://localhost:3000
echo  - Security Lab:  http://localhost:3000/security-lab
echo  - Backend API:   http://localhost:5000/api/health
echo  - Lab API:       http://localhost:5001/lab/health
echo ========================================================
echo.
pause
