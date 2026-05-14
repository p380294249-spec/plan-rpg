@echo off
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo [Plan RPG] System-only update.
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git not found. Install Git for Windows first.
  pause
  exit /b 1
)

if not exist ".git" (
  echo [ERROR] This folder is not a Git repository.
  pause
  exit /b 1
)

git pull --ff-only origin main
if errorlevel 1 (
  echo.
  echo [ERROR] System update failed.
  pause
  exit /b 1
)

start "" "%~dp0index.html"
echo.
echo [OK] System updated and opened.
pause
endlocal
