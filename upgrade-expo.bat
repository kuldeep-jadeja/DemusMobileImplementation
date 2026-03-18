@echo off
echo ===================================
echo Upgrading Expo SDK 50 to SDK 54
echo ===================================
echo.

echo Step 1: Installing expo-doctor...
call npm install -g expo-doctor

echo.
echo Step 2: Running Expo upgrade...
call npx expo install expo@latest

echo.
echo Step 3: Updating all Expo dependencies...
call npx expo install --fix

echo.
echo Step 4: Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo ===================================
echo Upgrade Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Verify TypeScript: npx tsc --noEmit
echo 2. Run tests: npm test
echo 3. Start app: npm start
echo.

pause
