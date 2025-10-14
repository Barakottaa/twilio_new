@echo off
echo 🚀 Starting Bird WhatsApp Service with Ngrok...

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ngrok is not installed. Please install it first:
    echo    https://ngrok.com/download
    pause
    exit /b 1
)

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

echo 🕊️ Starting Bird service on port 3001...
start "Bird Service" cmd /k "npm start"

REM Wait a moment for the service to start
timeout /t 5 /nobreak >nul

REM Check if the service is running
curl -s http://localhost:3001/health >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bird service failed to start
    pause
    exit /b 1
)

echo ✅ Bird service started successfully

echo 🌐 Creating ngrok tunnel...
start "Ngrok Tunnel" cmd /k "ngrok http 3001"

REM Wait for ngrok to start
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Setup Complete!
echo 📡 Bird Service: http://localhost:3001
echo 🌐 Ngrok URL: Check the ngrok window for the URL
echo 🔗 Webhook URL: [ngrok-url]/api/bird/webhook
echo 💊 Health Check: [ngrok-url]/health
echo.
echo 📋 Next Steps:
echo 1. Check the ngrok window for your public URL
echo 2. Update your Bird dashboard webhook URL to: [ngrok-url]/api/bird/webhook
echo 3. Test the webhook by clicking a button in WhatsApp
echo.
echo Press any key to exit...
pause >nul
