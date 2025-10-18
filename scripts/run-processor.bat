@echo off
echo ==========================================================
echo Lab Reports Processor
echo ==========================================================

REM Change to script directory
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it first:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Dependencies not found. Installing...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Run the processor
echo [INFO] Starting lab reports processor...
node process-lab-reports.js

REM Check exit code
if %errorlevel% neq 0 (
    echo [ERROR] Processor failed with exit code %errorlevel%
    pause
    exit /b %errorlevel%
) else (
    echo [INFO] Processor completed successfully
)

echo.
echo Press any key to exit...
pause >nul
