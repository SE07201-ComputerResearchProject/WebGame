@echo off
echo.

:: Tắt tất cả các tiến trình node
taskkill /F /IM node.exe

echo.
echo ok

:: Tắt tất cả các cửa sổ Command Prompt đang mở
taskkill /F /IM cmd.exe
