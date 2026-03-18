@echo off
REM Plan 01-02 Setup - Windows Batch Launcher
echo ============================================================
echo Plan 01-02: Auth Service ^& Storage Layer Setup
echo ============================================================
echo.
echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Python! Running Python setup script...
    python complete-plan-01-02.py
    goto :end
)

echo Python not found. Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Node.js! Running Node setup script...
    node complete-plan-01-02.js
    goto :end
)

echo.
echo ERROR: Neither Python nor Node.js found!
echo Please install Python or Node.js and try again.
echo.
pause
exit /b 1

:end
echo.
echo Done!
pause
