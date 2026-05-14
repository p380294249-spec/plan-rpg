@echo off
setlocal
cd /d "%~dp0"
if not exist ".git" (
  if exist "H:\CODEX\SYS\.git" (
    cd /d "H:\CODEX\SYS"
  )
)
set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo [Plan RPG] System + data update.
echo.
echo Data sync uses the newest plan-rpg-backup-*.json in Downloads.
echo If you changed records, export data from the app first.
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

git -c safe.directory=H:/CODEX/SYS pull --rebase origin main
if errorlevel 1 (
  echo.
  echo [ERROR] System update failed.
  pause
  exit /b 1
)

if not exist "data" mkdir "data"
for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "$f = Get-ChildItem -Path \"$env:USERPROFILE\Downloads\" -Filter 'plan-rpg-backup-*.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if ($f) { $f.FullName }"`) do set "LATEST_BACKUP=%%F"

if defined LATEST_BACKUP (
  echo [OK] Latest export:
  echo %LATEST_BACKUP%
  copy /Y "%LATEST_BACKUP%" "data\plan-rpg-data.json" >nul
  git -c safe.directory=H:/CODEX/SYS add data\plan-rpg-data.json
  git -c safe.directory=H:/CODEX/SYS diff --cached --quiet
  if errorlevel 1 (
    for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%i"
    git -c safe.directory=H:/CODEX/SYS commit -m "sync plan rpg data %STAMP%"
    if errorlevel 1 (
      echo [ERROR] Data commit failed.
      pause
      exit /b 1
    )
    git -c safe.directory=H:/CODEX/SYS push origin main
    if errorlevel 1 (
      echo [ERROR] Data push failed.
      pause
      exit /b 1
    )
    echo [OK] Data synced to GitHub.
  ) else (
    echo [OK] Data file unchanged. No data commit needed.
  )
) else (
  echo [WARN] No plan-rpg-backup-*.json found in Downloads. Skipping data sync.
)

start "" "%CD%\index.html"
echo.
echo [OK] System updated, data sync checked, app opened.
pause
endlocal
