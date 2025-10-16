@echo off
echo 🚀 Starting Twilio + Bird Services
echo.

echo 🟢 Starting Twilio App (Port 3000)...
start "Twilio App" cmd /k "npm run dev"

echo 🟢 Starting Bird Service (Port 3001)...
start "Bird Service" cmd /k "cd bird-service-package && npm start"

echo.
echo ✅ Services started in separate windows!
echo.
echo 📋 Services running:
echo   - Twilio App: http://localhost:3000
echo   - Bird Service: http://localhost:3001
echo.
echo 💡 To stop services: Close the individual command windows
echo.
pause
