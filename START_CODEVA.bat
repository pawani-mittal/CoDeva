@echo off
title CoDeva - Real-Time Collaborative IDE
color 0b

echo ========================================================
echo        STARTING CODEVA COLLABORATIVE IDE...
echo ========================================================
echo.
echo [1/3] Starting CoDeva Backend Server (Port 5000)...
start /b cmd /c "cd /d "%~dp0server" && node src/server.js"

echo [2/3] Starting CoDeva Frontend (Port 5173)...
start /b cmd /c "cd /d "%~dp0client" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo Opening CoDeva in your web browser...
start http://localhost:5173

echo ========================================================
echo   CODEVA IS RUNNING SUCCESSFULLY!
echo ========================================================
echo.
echo - Web App URL:   http://localhost:5173
echo - Backend API:   http://localhost:5000
echo.
echo DO NOT CLOSE THIS WINDOW while using the application.
echo To STOP CoDeva, simply close this window.
echo ========================================================
echo.

pause
taskkill /f /im node.exe >nul 2>&1
