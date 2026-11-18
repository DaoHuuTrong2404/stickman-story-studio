@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   STICKMAN STORY STUDIO - KHOI DONG TU DONG (WINDOWS)
echo ============================================================

if not exist "node_modules\playwright" (
    echo [*] Lan chay dau tien: Dang tu dong cai dat thu vien va trinh duyet render...
    node scripts/setup.mjs
)

echo [*] Dang mo giao dien Web Studio tai http://127.0.0.1:4567 ...
start "" "http://127.0.0.1:4567"
node server/index.mjs
pause
