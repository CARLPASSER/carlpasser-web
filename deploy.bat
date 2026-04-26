@echo off
echo ==========================================
echo   Netlify Automatic Deployer (Carlpasser)
echo ==========================================
echo.
echo Deploying updates to production...

"%APPDATA%\npm\netlify.cmd" deploy --prod --dir .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment Failed!
    color 0C
) else (
    echo.
    echo [SUCCESS] Deployment Complete!
    echo Your site is now live.
    color 0A
)
echo.
pause
