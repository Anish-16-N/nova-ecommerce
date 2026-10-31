@echo off
echo ============================================
echo  NOVA E-Commerce - Starting Application
echo ============================================
echo.

REM Check if .env exists
if not exist "d:\Kodikon 6.0\nova-ecommerce\.env" (
    echo [INFO] Creating .env from .env.example...
    copy "d:\Kodikon 6.0\nova-ecommerce\.env.example" "d:\Kodikon 6.0\nova-ecommerce\.env"
    echo [OK] .env created. Edit it if needed.
)

echo [STEP 1] Starting PostgreSQL database...
cd /d "d:\Kodikon 6.0\nova-ecommerce"
docker-compose up -d postgres
echo [INFO] Waiting 15 seconds for PostgreSQL to initialize...
timeout /t 15 /nobreak

echo.
echo [STEP 2] Installing dependencies...
call npm install --prefix "d:\Kodikon 6.0\nova-ecommerce\backend"
call npm install --prefix "d:\Kodikon 6.0\nova-ecommerce\security-lab\backend"
call npm install --prefix "d:\Kodikon 6.0\nova-ecommerce\frontend"

echo.
echo [STEP 3] Starting all services...
echo  - Main Backend:     http://localhost:5000
echo  - Security Lab:     http://localhost:5001
echo  - Frontend:         http://localhost:3000
echo  - Security Lab UI:  http://localhost:3000/security-lab
echo.
echo Press Ctrl+C to stop all services.
echo.

REM Start backend in a new window
start "NOVA Backend (Port 5000)" cmd /k "cd /d "d:\Kodikon 6.0\nova-ecommerce\backend" && npm run dev"

REM Start security lab backend in a new window
start "NOVA Security Lab (Port 5001)" cmd /k "cd /d "d:\Kodikon 6.0\nova-ecommerce\security-lab\backend" && npm run dev"

REM Start frontend in a new window
start "NOVA Frontend (Port 3000)" cmd /k "cd /d "d:\Kodikon 6.0\nova-ecommerce\frontend" && npm run dev"

echo All services started in separate windows!
pause

