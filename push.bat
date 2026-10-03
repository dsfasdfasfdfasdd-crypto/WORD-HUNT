@echo off
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo WORD HUNT .IO - GITHUB'A YUKLEME BASLATILIYOR
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo [BASARILI] Kodlar basariyla GitHub'a yuklendi!
) else (
    echo [HATA] Yukleme basarisiz oldu. Lutfen ekrandaki talimatlari kontrol edin.
)
echo.
pause
