@echo off
setlocal
cd /d "%~dp0"
if not exist "index.html" (
  if exist "H:\CODEX\SYS\index.html" (
    cd /d "H:\CODEX\SYS"
  )
)
start "" "%CD%\index.html"
echo Plan RPG opened in your default browser.
endlocal
