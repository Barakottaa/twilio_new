@echo off
echo ========================================
echo Starting Twilio Chat Server (Production)
echo ========================================
echo.

cd /d "%~dp0"

REM Check if build exists
if not exist ".next" (
    echo [WARNING] Production build not found!
    echo Building the application first...
    echo.
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ERROR] Build failed! Please check the errors above.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Build completed!
    echo.
)

echo Starting production server on port 3000...
echo.
call npm start

pause

