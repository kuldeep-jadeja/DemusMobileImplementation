@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo   Demus Mobile - Plan 01-01 Complete Setup
echo ===============================================
echo.

REM Step 1: Initialize Git
echo [1/5] Initializing Git...
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo   Initializing git repository...
    git init
    git config user.name "Demus Bot"
    git config user.email "bot@demus.com"
    echo   Done!
) else (
    echo   Git already initialized
)
echo.

REM Step 2: Create Directories
echo [2/5] Creating directory structure...
if not exist "tests" mkdir "tests"
if not exist "tests\__mocks__" mkdir "tests\__mocks__"
if not exist "src" mkdir "src"
if not exist "src\types" mkdir "src\types"
if not exist "src\api" mkdir "src\api"
if not exist "assets" mkdir "assets"
echo   Done!
echo.

REM Step 3: Create files using echo
echo [3/5] Creating project files...

REM tests/setup.ts
(
echo import '@testing-library/jest-native/extend-expect';
echo.
echo // Mock expo-secure-store
echo jest.mock('expo-secure-store', ^(^) =^> require^('./__mocks__/expo-secure-store'^)^);
echo.
echo // Mock expo-auth-session
echo jest.mock('expo-auth-session'^);
echo.
echo // Mock expo-web-browser
echo jest.mock('expo-web-browser'^);
echo.
echo // Silence console errors in tests
echo global.console = {
echo   ...console,
echo   error: jest.fn^(^),
echo   warn: jest.fn^(^),
echo };
) > "tests\setup.ts"
echo   Created tests\setup.ts

REM tests/__mocks__/expo-secure-store.ts
(
echo const store: Record^<string, string^> = {};
echo.
echo export const setItemAsync = jest.fn^(^(key: string, value: string^) =^> {
echo   store[key] = value;
echo   return Promise.resolve^(^);
echo }^);
echo.
echo export const getItemAsync = jest.fn^(^(key: string^) =^> {
echo   return Promise.resolve^(store[key] ^|^| null^);
echo }^);
echo.
echo export const deleteItemAsync = jest.fn^(^(key: string^) =^> {
echo   delete store[key];
echo   return Promise.resolve^(^);
echo }^);
) > "tests\__mocks__\expo-secure-store.ts"
echo   Created tests\__mocks__\expo-secure-store.ts

echo   Use Python or Node.js scripts for remaining files (they handle multiline better)
echo.

REM Step 4: Check if Python or Node are available
echo [4/5] Checking for Python or Node.js...

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   Python found! Running Python setup script...
    python complete-setup.py
    goto :verify
)

node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   Node.js found! Running Node setup script...
    node complete-setup.js
    goto :verify
)

echo   WARNING: Neither Python nor Node.js found!
echo   Please install one of them and run:
echo     python complete-setup.py
echo   OR
echo     node complete-setup.js
echo.
pause
exit /b 1

:verify
echo.
echo [5/5] Verifying setup...
node verify-plan.js
echo.
echo ===============================================
echo   Setup Complete!
echo ===============================================
echo.
echo Next steps:
echo   1. Run: npm install
echo   2. Check: git log --oneline -3
echo   3. Proceed to Plan 01-02
echo.
pause
