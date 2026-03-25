@echo off
title ParkVerse Launcher
color 0A

echo.
echo ==============================================
echo  ParkVerse Smart Parking System - Launcher
echo ==============================================
echo.

:: 1. Flask ML Server
echo [1/3] Starting Flask ML Server (port 5001)...
start "ParkVerse - ML Server" cmd /k "color 0E && title ParkVerse ML Server && cd /d "%~dp0ml" && call venv\Scripts\activate && python parking_ml_server.py"

:: Give Flask a moment to start loading the model
timeout /t 3 /nobreak >nul

:: 2. Spring Boot Backend
echo [2/3] Starting Spring Boot Backend (port 8080)...
start "ParkVerse - Spring Boot" cmd /k "color 0B && title ParkVerse Spring Boot && cd /d "%~dp0parkingsystem" && call mvnw.cmd spring-boot:run"

:: Give Spring Boot a moment to begin startup
timeout /t 3 /nobreak >nul

:: 3. React Frontend
echo [3/3] Starting React Frontend (port 5173)...
start "ParkVerse - React" cmd /k "color 0D && title ParkVerse React Frontend && cd /d "%~dp0frontend" && npm run dev"

echo.
echo All 3 services are starting in separate windows:
echo --------------------------------------------------
echo  ML Server  > http://localhost:5001
echo  Backend    > http://localhost:8080
echo  Frontend   > http://localhost:5173
echo --------------------------------------------------
echo.
echo Close this window or press any key to exit launcher.
pause >nul
