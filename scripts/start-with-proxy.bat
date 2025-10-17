@echo off
echo 🚀 Starting All Services with Proxy
echo.

echo 🟢 Starting Twilio App (Port 3000)...
start "Twilio App" cmd /k "npm run dev"

echo 🟢 Starting Bird Service (Port 3001)...
start "Bird Service" cmd /k "cd bird-service-package && npm start"

echo 🟢 Starting Reverse Proxy (Port 8080)...
start "Reverse Proxy" cmd /k "cd bird-service-package && node simple-proxy.js"

echo.
echo ✅ All services started in separate windows!
echo.
echo 📋 Services running:
echo   - Twilio App: http://localhost:3000
echo   - Bird Service: http://localhost:3001
echo   - Reverse Proxy: http://localhost:8080
echo.
echo 🌐 For ngrok: ngrok http 8080
echo.
echo 💡 To stop services: Close the individual command windows
echo.
pause
