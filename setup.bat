@echo off
cd /d "%~dp0"
echo ===============================================
echo   TiniCash - instalace (rucni spusteni pres ikonu)
echo ===============================================
echo.

REM 1) zavislosti projektu
if not exist node_modules (
  echo [1/2] npm install ...
  call npm install
) else (
  echo [1/2] node_modules uz existuje - preskakuji
)

REM 2) zastupce na plose (BEZ autostartu)
echo [2/2] vytvarim zastupce "Kasa" na plose ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\make_shortcuts.ps1"

echo.
echo === HOTOVO ===
echo Na plose je ikona "Kasa".
echo Kasa se NESPOUSTI sama - spustis ji jen pres tuto ikonu.
echo Ikona nastartuje server a otevre kiosk na 2. monitoru.
echo.
echo NEZAPOMEN: v XAMPP mit spustenou MySQL (databaze).
echo.
pause
