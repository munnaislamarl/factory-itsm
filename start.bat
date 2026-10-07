@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Factory ITSM - Local Run
echo ============================================
echo.

if not exist node_modules (
  echo [1/2] Installing dependencies... ^(first time only, 2-3 min^)
  call npm install
  echo.
) else (
  echo [1/2] Dependencies already installed. Skipping.
)

echo [2/2] Starting the app...
echo.
echo   After it starts, open:  http://localhost:5173
echo   Demo login:  admin@factory.com  /  Admin@123
echo.
echo   To stop the server press Ctrl + C.
echo ============================================
echo.

call npm run dev
pause
