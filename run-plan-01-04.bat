@echo off
echo ===================================
echo Running Plan 01-04 Setup Script
echo ===================================
echo.

python complete-plan-01-04.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================
    echo Plan 01-04 setup completed!
    echo ===================================
    echo.
    echo IMPORTANT: OAuth apps must be configured!
    echo See README-OAUTH.md for instructions
    echo.
    echo Next steps:
    echo 1. Verify TypeScript: npx tsc --noEmit
    echo 2. Run tests: npm test
    echo 3. Read README-OAUTH.md for OAuth setup
) else (
    echo.
    echo ===================================
    echo Setup failed! Please check errors above.
    echo ===================================
)

pause
