@echo off
echo ==========================================
echo    KHOI DONG HE THONG NEXUS GAMES
echo ==========================================

:: Bật Backend ở một cửa sổ mới
echo [1] Dang khoi dong Backend Server...
start "Backend Server" cmd /k "cd server && node index.js"

:: Bật Frontend ở một cửa sổ mới
echo [2] Dang khoi dong Frontend React...
start "Frontend React" cmd /k "npm run dev"

echo Da gui lenh khoi dong!
exit