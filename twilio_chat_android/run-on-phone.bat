@echo off
echo ===================================================
echo   Twilio Chat - Run on Physical Device Helper
echo ===================================================
echo.

echo 1. Checking for connected devices...
call adb devices
echo.

echo 2. Starting Metro Bundler (in separate window)...
start "Metro Bundler" cmd /c "npm start"
echo Waiting for Metro to initialize...
timeout /t 5

echo.
echo 3. Installing App on Phone...
echo    (Make sure your phone screen is unlocked!)
echo.
call npm run android

echo.
echo ===================================================
echo   Done! App should launch on your phone.
echo   If you see "Success", check your phone.
echo   If it failed, check the errors above.
echo ===================================================
pause
