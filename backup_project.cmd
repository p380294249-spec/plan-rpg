@echo off
setlocal
cd /d "%~dp0"
set "STAMP=%DATE:~0,4%-%DATE:~5,2%-%DATE:~8,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%"
set "STAMP=%STAMP: =0%"
set "DEST=%~dp0backups\%STAMP%"
mkdir "%DEST%" >nul 2>nul
copy "%~dp0index.html" "%DEST%\index.html" >nul
copy "%~dp0VERSION.md" "%DEST%\VERSION.md" >nul
if exist "%~dp0README.md" copy "%~dp0README.md" "%DEST%\README.md" >nul
echo Project files backed up to:
echo %DEST%
echo.
echo Note: browser log data is stored in localStorage.
echo Use the in-app "导出数据" button to back up your personal logs as JSON.
pause
endlocal
