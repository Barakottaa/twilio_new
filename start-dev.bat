@echo off
echo Starting Twilio WhatsApp Development Environment...
echo.

REM Change to project directory
cd /d "D:\New folder\twilio_new"

REM Start Node.js development server in background
echo Starting Node.js development server...
start "Node Dev Server" cmd /k "npm run dev"

REM Wait a moment for the server to start
timeout /t 3 /nobreak >nul

REM Start ngrok tunnel
echo Starting ngrok tunnel...
start "ngrok Tunnel" cmd /k "ngrok http 3000"

echo.
echo Both services are starting...
echo - Node.js app will be available at: http://localhost:3000
echo - ngrok interface will be available at: http://localhost:4040
echo.
echo Press any key to exit this window...
pause >nul
