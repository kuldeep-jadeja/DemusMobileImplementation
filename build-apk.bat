@echo off
echo ========================================
echo    Demus Mobile - Development Build
echo ========================================
echo.

echo Step 1: Checking EAS CLI...
call npm list -g eas-cli >nul 2>&1
if errorlevel 1 (
    echo Installing EAS CLI...
    call npm install -g eas-cli
) else (
    echo EAS CLI already installed!
)
echo.

echo Step 2: Login to Expo...
echo Please enter your Expo credentials when prompted.
echo If you don't have an account, sign up at: https://expo.dev/signup
echo.
call npx expo login
if errorlevel 1 (
    echo Login failed! Please try again.
    pause
    exit /b 1
)
echo.

echo Step 3: Configure EAS Build...
echo This will link your project to Expo and create credentials.
echo.
set EAS_NO_VCS=1
call eas build:configure
if errorlevel 1 (
    echo Configuration failed!
    pause
    exit /b 1
)
echo.

echo Step 4: Starting Development Build...
echo This will take 5-15 minutes.
echo You can close this window - build continues on Expo servers.
echo Check build status at: https://expo.dev
echo.
set EAS_NO_VCS=1
call eas build --profile development --platform android
echo.

echo ========================================
echo Build process started!
echo ========================================
echo.
echo Next steps:
echo 1. Wait for build to complete (check Expo dashboard)
echo 2. Download APK from build URL
echo 3. Install on Android device
echo 4. Test audio playback!
echo.
pause
