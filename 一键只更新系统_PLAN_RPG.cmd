@echo off
setlocal
cd /d "%~dp0"
if not exist ".git" (
  if exist "H:\CODEX\SYS\.git" (
    cd /d "H:\CODEX\SYS"
  )
)
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

git -c safe.directory=H:/CODEX/SYS pull --ff-only origin main
if errorlevel 1 (
  echo.
  echo [ERROR] System update failed.
  pause
  exit /b 1
)

start "" "%CD%\index.html"
echo.
echo [OK] System updated and opened.
pause
endlocal
