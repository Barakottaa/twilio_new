@echo off
echo Stopping Node.js servers...
echo.

REM Kill all Node.js processes
taskkill /F /IM node.exe 2>nul

if %errorlevel% equ 0 (
    echo.
    echo ✅ All Node.js processes have been stopped.
) else (
    echo.
    echo ℹ️  No Node.js processes were found running.
)

echo.
pause

