@echo off
REM Script rapido para iniciar el Asistente IA

echo.
echo ========================================
echo   Asistente de Codigo IA - CRM Albru
echo ========================================
echo.

REM Recargar PATH
set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Programs\Ollama

REM Verificar que Ollama este corriendo
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Ollama esta corriendo
) else (
    echo [!] Iniciando Ollama...
    start "" "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama app.exe"
    timeout /t 3 /nobreak >nul
)

echo.
echo Iniciando asistente...
echo.

python assistant.py chat

pause
