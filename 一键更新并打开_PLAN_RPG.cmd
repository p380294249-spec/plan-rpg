@echo off
setlocal
cd /d "%~dp0"

set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo [Plan RPG] One-click update started.
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git not found. Install Git for Windows first.
  pause
  exit /b 1
)

if not exist ".git" (
  echo [ERROR] This folder is not a Git repository.
  echo Folder: %CD%
  pause
  exit /b 1
)

echo [Plan RPG] Pulling latest code from GitHub...
git pull --ff-only origin main
if errorlevel 1 (
  echo.
  echo [ERROR] Git pull failed. Local files were not opened.
  pause
  exit /b 1
)

echo.
echo [Plan RPG] Opening local web app...
start "" "%~dp0index.html"

echo.
echo [OK] Plan RPG updated and opened.
echo File: %~dp0index.html
echo.
pause
endlocal
