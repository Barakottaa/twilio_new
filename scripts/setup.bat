@echo off
echo ==========================================================
echo Lab Reports Processor Setup
echo ==========================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it first:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js found

REM Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available
    pause
    exit /b 1
)

echo [INFO] npm found

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [INFO] Dependencies installed successfully

REM Create necessary directories
echo [INFO] Creating directories...
if not exist "C:\scripts\logs" mkdir "C:\scripts\logs"
if not exist "C:\temp\lab-reports" mkdir "C:\temp\lab-reports"
if not exist "D:\Results" mkdir "D:\Results"

echo [INFO] Directories created

REM Check for Oracle Reports at specific path
if exist "C:\orant\BIN\RWRUN60.EXE" (
    echo [INFO] Oracle Reports found at C:\orant\BIN\RWRUN60.EXE
) else (
    echo [WARN] Oracle Reports not found at C:\orant\BIN\RWRUN60.EXE
    echo [WARN] Please ensure Oracle Reports is installed at the correct path
)

REM Check for Ghostscript
where gswin64c >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Ghostscript (gswin64c) not found in PATH
    echo [WARN] Please install Ghostscript from https://ghostscript.com
) else (
    echo [INFO] Ghostscript (gswin64c) found
)

echo.
echo ==========================================================
echo Setup Complete!
echo ==========================================================
echo.
echo Next steps:
echo 1. Configure database connection in config.js
echo 2. Test the setup: npm test
echo 3. Run the processor: npm start
echo.
echo Configuration files:
echo - config.js (main configuration)
echo - process-lab-reports.js (main processor)
echo.
pause
