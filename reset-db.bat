@echo off
echo ============================================
echo  NOVA E-Commerce - Database Reset
echo ============================================
echo.
echo [WARNING] This will delete ALL data and reinitialize the database.
echo Press Ctrl+C to cancel, or any key to continue...
pause > nul

cd /d "d:\Kodikon 6.0\nova-ecommerce"

echo [STEP 1] Stopping and removing containers with volumes...
docker-compose down -v

echo [STEP 2] Starting fresh PostgreSQL instance...
docker-compose up -d postgres

echo [STEP 3] Waiting 20 seconds for PostgreSQL to initialize and run SQL scripts...
timeout /t 20 /nobreak

echo.
echo [OK] Database reset complete!
echo     All synthetic data has been restored.
echo     Demo data has been restored.
echo.
pause

