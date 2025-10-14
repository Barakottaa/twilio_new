@echo off
echo 🚀 Starting Services with Single Ngrok Tunnel...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please copy env.example to .env and configure it:
    echo    copy env.example .env
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Install proxy dependencies
echo 📦 Installing proxy dependencies...
npm install http-proxy-middleware

echo 🕊️ Starting Bird service on port 3001...
start "Bird Service" cmd /k "npm start"

REM Wait for Bird service to start
timeout /t 3 /nobreak >nul

echo 🔄 Starting proxy server on port 8080...
start "Proxy Server" cmd /k "node simple-proxy.js"

REM Wait for proxy to start
timeout /t 3 /nobreak >nul

echo 🌐 Creating single ngrok tunnel...
start "Ngrok Tunnel" cmd /k "ngrok http 8080"

echo.
echo 🎉 Setup Complete!
echo 📡 Main App: http://localhost:3000
echo 🕊️ Bird Service: http://localhost:3001
echo 🔄 Proxy: http://localhost:8080
echo 🌐 Ngrok URL: Check the ngrok window
echo.
echo 📋 URLs:
echo   Main App: [ngrok-url]/
echo   Bird Service: [ngrok-url]/bird/
echo   Webhook: [ngrok-url]/bird/api/bird/webhook
echo.
echo 📋 Next Steps:
echo 1. Check the ngrok window for your public URL
echo 2. Update Bird webhook URL to: [ngrok-url]/bird/api/bird/webhook
echo 3. Test the webhook by clicking a button in WhatsApp
echo.
echo Press any key to exit...
pause >nul
