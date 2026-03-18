@echo off
echo ===================================
echo Reverting to Expo SDK 50
echo ===================================
echo.

echo Step 1: Removing node_modules...
rmdir /s /q node_modules

echo.
echo Step 2: Removing package-lock.json...
del package-lock.json

echo.
echo Step 3: Reinstalling SDK 50 packages...
call npm install --legacy-peer-deps

echo.
echo ===================================
echo Revert Complete!
echo ===================================
echo.
echo Next: Install Expo Go SDK 50 on your device
echo Android: https://expo.dev/go?sdkVersion=50^&platform=android^&device=true
echo iOS: https://expo.dev/go?sdkVersion=50^&platform=ios^&device=false
echo.

pause
