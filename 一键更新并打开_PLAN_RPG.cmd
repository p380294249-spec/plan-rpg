@echo off
setlocal
cd /d "%~dp0"
if not exist ".git" (
  if exist "H:\CODEX\SYS\.git" (
    cd /d "H:\CODEX\SYS"
  )
)

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
git -c safe.directory=H:/CODEX/SYS pull --ff-only origin main
if errorlevel 1 (
  echo.
  echo [ERROR] Git pull failed. Local files were not opened.
  pause
  exit /b 1
)

echo.
echo [Plan RPG] Opening local web app...
start "" "%CD%\index.html"

echo.
echo [OK] Plan RPG updated and opened.
echo File: %CD%\index.html
echo.
pause
endlocal
