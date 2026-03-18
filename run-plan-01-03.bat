@echo off
echo ===================================
echo Running Plan 01-03 Setup Script
echo ===================================
echo.

python complete-plan-01-03.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================
    echo Plan 01-03 setup completed!
    echo ===================================
    echo.
    echo Next steps:
    echo 1. Verify TypeScript: npx tsc --noEmit
    echo 2. Run tests: npm test
    echo 3. Optional - Start app: npm start
) else (
    echo.
    echo ===================================
    echo Setup failed! Please check errors above.
    echo ===================================
)

pause
