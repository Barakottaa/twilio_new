@echo off
echo 🚀 Starting Production Services...
echo.

echo 📋 Services to start:
echo   - Ngrok Tunnel (Public access)
echo   - Bird Listener (WhatsApp PDF processing)
echo   - Lab Reports Processor (PDF generation)
echo.

echo 🔧 Starting PM2 services...
pm2 start ecosystem.config.js

echo.
echo ✅ All services started!
echo.
echo 📊 To monitor services:
echo   pm2 monit
echo.
echo 📋 To check status:
echo   pm2 status
echo.
echo 📝 To view logs:
echo   pm2 logs
echo.
echo 🛑 To stop all services:
echo   pm2 stop all
echo.

pause
