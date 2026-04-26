@echo off
cd /d "%~dp0"
echo Starting Watch Mode...
powershell -NoProfile -ExecutionPolicy Bypass -File "watch.ps1"
pause
