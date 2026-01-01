@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    Twilio Chat: DEVELOPMENT MODE
echo ==========================================
echo.

echo [0/3] Cleaning up existing processes...
taskkill /f /im ngrok.exe /t 2>nul
taskkill /f /im node.exe /t 2>nul
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" 2>nul

echo [1/3] Starting Development Server...
start "Twilio Dev Server" cmd /k "npm run dev"

echo [WAIT] Waiting for server to initialize...
timeout /t 10 /nobreak > nul

echo [2/3] Starting ngrok tunnel...
start "Ngrok Tunnel" cmd /k "ngrok http 3000"

echo.
echo ==========================================
echo Development environment is launching!
echo ------------------------------------------
echo Check the spawned windows for logs.
echo.
pause
