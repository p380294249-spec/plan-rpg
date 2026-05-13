@echo off
setlocal
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or not available in PATH.
  echo Install Git first: https://git-scm.com/downloads
  pause
  exit /b 1
)
echo Pulling latest Plan RPG version from GitHub...
git pull --ff-only
if errorlevel 1 (
  echo.
  echo Update failed. Check whether there are local edits or network issues.
  pause
  exit /b 1
)
echo.
echo Update complete. Opening Plan RPG...
start "" "%~dp0index.html"
endlocal
