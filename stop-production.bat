@echo off
echo 🛑 Stopping Production Services...
echo.

echo 🔧 Stopping PM2 services...
pm2 stop all

echo.
echo 🗑️ Removing PM2 processes...
pm2 delete all

echo.
echo ✅ All services stopped and removed!
echo.

pause
