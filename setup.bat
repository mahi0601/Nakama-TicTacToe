@echo off
echo ============================================
echo    Tic-Tac-Toe Multiplayer Setup Script
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version
echo.

REM Setup Server
echo [*] Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to install server dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Server dependencies installed
cd ..

echo.

REM Setup Mobile
echo [*] Installing mobile app dependencies...
cd mobile
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to install mobile app dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Mobile app dependencies installed
cd ..

echo.
echo [OK] Setup complete!
echo.
echo Next steps:
echo 1. Find your computer's IP address:
echo    - Run: ipconfig
echo    - Look for "IPv4 Address"
echo.
echo 2. Update mobile\App.tsx line 16 with your IP:
echo    const SERVER_URL = 'ws://YOUR_IP:3000';
echo.
echo 3. Start the server:
echo    cd server
echo    npm start
echo.
echo 4. In another terminal, start mobile app:
echo    cd mobile
echo    npm start
echo.
echo 5. Open Expo Go on your phone and scan QR code
echo.
echo For more details, see QUICKSTART.md
echo.
pause

