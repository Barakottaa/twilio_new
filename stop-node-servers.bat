@echo off
echo ========================================
echo   Stop Node.js Servers
echo ========================================
echo.

REM Check if any Node.js processes are running
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Found Node.js processes running:
    tasklist /FI "IMAGENAME eq node.exe"
    echo.
    echo Stopping all Node.js processes...
    taskkill /F /IM node.exe
    echo.
    echo ✅ All Node.js processes have been stopped.
) else (
    echo ℹ️  No Node.js processes are currently running.
)

echo.
echo Press any key to exit...
pause >nul

