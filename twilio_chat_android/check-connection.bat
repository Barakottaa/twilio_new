@echo off
echo ======================================================
echo      Checking USB Connection for Android Device
echo ======================================================
echo.
echo 1. Restarting ADB Server (helps fix glitches)...
call adb kill-server
call adb start-server
echo.
echo 2. Listing Devices...
call adb devices
echo.
echo ======================================================
echo TROUBLESHOOTING TIPS:
echo.
echo IF LIST IS EMPTY:
echo   - Unplug USB and plug it back in.
echo   - Change USB mode on phone from "Charge only" to "File Transfer" / "MTP".
echo   - Install USB Drivers for your specific phone brand (Samsung/Pixel/etc).
echo.
echo IF "UNAUTHORIZED":
echo   - Look at your phone screen!
echo   - Tap "ALLOW" on the "Allow USB Debugging?" popup.
echo ======================================================
pause
