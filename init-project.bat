@echo off
echo === Demus Mobile - Plan 01-01 Execution ===
echo.

REM Create directory structure
echo Creating directories...
if not exist "tests" mkdir "tests"
if not exist "tests\__mocks__" mkdir "tests\__mocks__"
if not exist "src" mkdir "src"
if not exist "src\types" mkdir "src\types"
if not exist "src\api" mkdir "src\api"
if not exist "assets" mkdir "assets"
echo   Done!
echo.

REM Initialize git if needed
echo Checking git...
git status >nul 2>&1
if %errorlevel% neq 0 (
  echo   Initializing git...
  git init
  git config user.name "Demus Bot"
  git config user.email "bot@demus.com"
  echo   Done!
) else (
  echo   Git already initialized
)
echo.

echo === Project structure ready ===
echo.
echo Next steps:
echo 1. Run: node setup-project.js
echo 2. Run: node execute-plan.js
echo.
pause
