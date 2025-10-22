@echo off
echo 🚀 PM2 Management Scripts for Twilio + Bird Services
echo.

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="monitor" goto monitor
if "%1"=="setup" goto setup
if "%1"=="diagnose" goto diagnose

echo Usage: pm2-scripts.bat [command]
echo.
echo Commands:
echo   start    - Start all services with crash protection
echo   stop     - Stop all services
echo   restart  - Restart all services
echo   status   - Show status of all services
echo   logs     - Show logs for all services
echo   monitor  - Open PM2 monitoring dashboard
echo   setup    - Setup PM2 to auto-start on boot
echo   diagnose - Run diagnostics to check for issues
echo.
goto end

:start
echo 🟢 Starting all services with crash protection...
echo.
echo 🔍 Running diagnostics first...
node diagnose-services.js
echo.
echo 🚀 Starting services with PM2...
pm2 start ecosystem.config.js
echo ✅ All services started with crash protection!
echo.
echo 📊 Services will restart max 5 times if they crash
echo ⏱️ 5 second delay between restarts
echo 📝 All logs saved to logs/ directory
goto status

:stop
echo 🔴 Stopping all services...
pm2 stop all
echo ✅ All services stopped!

:restart
echo 🔄 Restarting all services...
pm2 restart all
echo ✅ All services restarted!
goto status

:status
echo 📊 Service Status:
pm2 list
goto end

:logs
echo 📜 Service Logs:
pm2 logs --lines 50
goto end

:monitor
echo 📈 Opening PM2 Monitor...
pm2 monit
goto end

:setup
echo ⚙️ Setting up PM2 auto-start...
pm2 startup
echo.
echo 📝 After running the command above, run:
echo    pm2 save
echo.
echo This will make all services start automatically on system boot.
goto end

:diagnose
echo 🔍 Running service diagnostics...
node diagnose-services.js
goto end

:end
