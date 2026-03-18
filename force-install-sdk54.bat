@echo off
echo ===================================
echo Force Clean Install for SDK 54
echo ===================================
echo.

echo Step 1: Removing node_modules...
if exist node_modules rmdir /s /q node_modules

echo Step 2: Removing package-lock.json...
if exist package-lock.json del /f package-lock.json

echo Step 3: Clearing npm cache...
call npm cache clean --force

echo Step 4: Installing fresh SDK 54 packages...
call npm install --legacy-peer-deps --force

echo.
echo ===================================
echo Verifying installation...
echo ===================================
call npm list expo

echo.
echo If expo@54.0.2 is shown above, proceed with:
echo   npx expo start --clear
echo.

pause
