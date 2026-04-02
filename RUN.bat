@echo off
title Khoi dong Cosy Game Zone
color 0A

echo ===================================================
echo    KHOI DONG HE THONG NEXUS GAMES (COSY GAME ZONE)
echo ===================================================
echo.

:: 1. Mở cửa sổ mới chạy Backend (Node.js)
echo Đang bật Backend Server...
start "Backend Server (Port 4000)" cmd /k "cd server && node index.js"

:: Ngắt nhịp 2 giây để Backend kịp kết nối Database trước khi FE gọi API
timeout /t 2 /nobreak > NUL

:: 2. Mở cửa sổ mới chạy Frontend (React/Vite)
echo Đang bật Frontend Server...
start "Frontend Server (React)" cmd /k "cd src && npm run dev"

echo.
echo ===================================================
echo   HOAN TAT! Da mo 2 cua so Terminal de chay ngam.
echo   Ban co the tat cua so den nay.
echo ===================================================
timeout /t 3 > NUL